import { randomBytes } from 'node:crypto';
import { config } from '../config/env.js';
import { sequelize, Pago, Pedido, TransaccionPayphone } from '../models/index.js';
import {
  aCentavos,
  confirmarPago,
  ESTADO_PAYPHONE,
  payphoneConfigurado,
  prepararPago
} from '../services/payphoneService.js';
import { paginaResultadoPago } from '../legal/paginaPago.js';

/**
 * Pago con tarjeta por Payphone (RF-22).
 *
 * 1. La app pide `POST /api/v1/pagos/payphone/preparar` y abre el enlace en
 *    el navegador (Payphone no permite webviews).
 * 2. Payphone devuelve al cliente a `GET /pagos/payphone/retorno` (página
 *    pública de este backend), que confirma el resultado directamente con
 *    Payphone y registra el pago. La app nunca decide si el pago se aprobó.
 *
 * A diferencia de `POST /pagos` (RN-10), se puede pagar desde que el pedido
 * está solicitado. Si el restaurante lo cancela, el pago pasa a reembolsado
 * y la devolución se hace desde Payphone Business.
 */

const ESTADOS_PAGO_ABIERTOS = ['pendiente'];

export const prepararPagoPayphone = async (req, res, next) => {
  try {
    if (!payphoneConfigurado()) {
      return res.status(503).json({
        success: false,
        message: 'El pago con tarjeta no está disponible por ahora. Puedes pagar en caja.'
      });
    }

    const pedidoId = Number(req.body?.pedido_id);
    if (!Number.isInteger(pedidoId) || pedidoId <= 0) {
      return res.status(400).json({ success: false, message: 'pedido_id es obligatorio' });
    }

    const pedido = await Pedido.findByPk(pedidoId, {
      include: { model: Pago, as: 'pago' }
    });
    if (!pedido || pedido.cliente_id !== req.user.id) {
      return res.status(404).json({ success: false, message: 'Pedido no encontrado' });
    }
    if (pedido.estado === 'cancelado') {
      return res.status(400).json({
        success: false,
        message: 'El pedido está cancelado y no requiere pago'
      });
    }
    if (pedido.pago && !ESTADOS_PAGO_ABIERTOS.includes(pedido.pago.estado)) {
      return res.status(400).json({
        success: false,
        message:
          pedido.pago.estado === 'aprobado'
            ? 'Este pedido ya está pagado'
            : 'Este pedido ya tiene un pago registrado'
      });
    }

    const transaccion = await TransaccionPayphone.create({
      pedido_id: pedido.id,
      client_tx_id: `SP${pedido.id}-${randomBytes(6).toString('hex')}`,
      monto: pedido.valor_total
    });

    let respuesta;
    try {
      respuesta = await prepararPago({
        clientTransactionId: transaccion.client_tx_id,
        centavos: aCentavos(pedido.valor_total),
        referencia: `Pedido #${pedido.id} · Sabor Politécnico`
      });
    } catch (error) {
      await transaccion.destroy();
      console.error('[payphone] Prepare falló:', error.message);
      return res.status(502).json({
        success: false,
        message: 'No se pudo iniciar el pago con tarjeta. Inténtalo de nuevo.'
      });
    }

    if (!respuesta.payWithCard) {
      await transaccion.destroy();
      console.error('[payphone] Prepare sin payWithCard:', respuesta);
      return res.status(502).json({
        success: false,
        message: 'No se pudo iniciar el pago con tarjeta. Inténtalo de nuevo.'
      });
    }

    res.status(201).json({
      success: true,
      message: 'Pago iniciado',
      data: {
        url: respuesta.payWithCard,
        client_transaction_id: transaccion.client_tx_id
      }
    });
  } catch (error) {
    next(error);
  }
};

const enlaceApp = (pedidoId) => `${config.payphone.appUrl}/pedidos/${pedidoId}`;

const responderPagina = (res, status, datos) =>
  res
    .status(status)
    .type('html')
    .set('Cache-Control', 'no-store')
    .send(paginaResultadoPago(datos));

const PAGINA_APROBADO = (pedidoId) => ({
  tipo: 'aprobado',
  titulo: 'Pago aprobado',
  mensaje: `Tu pago del pedido #${pedidoId} fue aprobado. Ya puedes volver a la app para seguir tu pedido.`,
  enlaceApp: enlaceApp(pedidoId)
});

const PAGINA_CANCELADO = (pedidoId) => ({
  tipo: 'cancelado',
  titulo: 'Pago no realizado',
  mensaje: 'No se hizo ningún cobro. Puedes intentarlo de nuevo desde el detalle de tu pedido o pagar en caja.',
  enlaceApp: enlaceApp(pedidoId)
});

/**
 * Registra en el pedido el pago aprobado por Payphone. Bloquea el pedido
 * para no cruzarse con una cancelación simultánea del personal.
 * Devuelve false si el pedido ya tenía otro pago cerrado (cobro duplicado).
 */
const registrarAprobado = (transaccion, confirmacion) =>
  sequelize.transaction(async (t) => {
    const tx = await TransaccionPayphone.findByPk(transaccion.id, { lock: t.LOCK.UPDATE, transaction: t });
    if (tx.estado === 'aprobada') return true;

    const pedido = await Pedido.findByPk(tx.pedido_id, { lock: t.LOCK.UPDATE, transaction: t });
    await tx.update(
      {
        estado: 'aprobada',
        payphone_id: confirmacion.transactionId,
        codigo_autorizacion: confirmacion.authorizationCode?.toString().slice(0, 50) || null
      },
      { transaction: t }
    );

    const datosPago = {
      fecha: new Date(),
      valor: tx.monto,
      metodo_pago: 'tarjeta',
      numero_referencia: `Payphone ${confirmacion.transactionId}`,
      // Cancelado mientras el cliente pagaba: el dinero se devuelve a mano.
      estado: pedido.estado === 'cancelado' ? 'reembolsado' : 'aprobado'
    };
    const pago = await Pago.findOne({ where: { pedido_id: pedido.id }, lock: t.LOCK.UPDATE, transaction: t });
    if (!pago) {
      await Pago.create({ pedido_id: pedido.id, ...datosPago }, { transaction: t });
      return true;
    }
    if (ESTADOS_PAGO_ABIERTOS.includes(pago.estado)) {
      await pago.update(datosPago, { transaction: t });
      return true;
    }
    return false;
  });

export const retornoPayphone = async (req, res, next) => {
  try {
    const { id, clientTransactionId, cancelado } = req.query;
    const transaccion =
      typeof clientTransactionId === 'string'
        ? await TransaccionPayphone.findOne({ where: { client_tx_id: clientTransactionId } })
        : null;

    if (!transaccion) {
      return responderPagina(res, 404, {
        tipo: 'error',
        titulo: 'Pago no encontrado',
        mensaje: 'No encontramos este pago. Revisa el estado de tu pedido en la app.'
      });
    }
    const pedidoId = transaccion.pedido_id;

    if (transaccion.estado === 'aprobada') {
      return responderPagina(res, 200, PAGINA_APROBADO(pedidoId));
    }

    if (cancelado || !id || !/^\d+$/.test(String(id))) {
      if (transaccion.estado === 'iniciada') await transaccion.update({ estado: 'cancelada' });
      return responderPagina(res, 200, PAGINA_CANCELADO(pedidoId));
    }

    let confirmacion;
    try {
      confirmacion = await confirmarPago({ id, clientTransactionId: transaccion.client_tx_id });
    } catch (error) {
      console.error('[payphone] Confirm falló:', error.message);
      return responderPagina(res, 502, {
        tipo: 'error',
        titulo: 'No pudimos confirmar el pago',
        mensaje:
          'Si se hizo un cargo, Payphone lo revierte automáticamente en unos minutos. Revisa tu pedido en la app o acércate a caja.',
        enlaceApp: enlaceApp(pedidoId)
      });
    }

    const coincide =
      confirmacion.clientTransactionId === transaccion.client_tx_id &&
      Number(confirmacion.amount) === aCentavos(transaccion.monto);

    if (confirmacion.statusCode === ESTADO_PAYPHONE.APROBADA && coincide) {
      const registrado = await registrarAprobado(transaccion, confirmacion);
      if (!registrado) {
        console.error(`[payphone] Pedido ${pedidoId} ya tenía pago cerrado; cobro ${confirmacion.transactionId} por devolver.`);
        return responderPagina(res, 200, {
          tipo: 'error',
          titulo: 'Este pedido ya estaba pagado',
          mensaje: 'Recibimos tu pago, pero el pedido ya tenía otro pago registrado. Acércate a caja para la devolución.',
          enlaceApp: enlaceApp(pedidoId)
        });
      }
      return responderPagina(res, 200, PAGINA_APROBADO(pedidoId));
    }

    if (confirmacion.statusCode === ESTADO_PAYPHONE.APROBADA) {
      // Aprobado pero no corresponde a esta transacción: no se registra.
      console.error(`[payphone] Confirmación que no coincide con ${transaccion.client_tx_id}:`, {
        clientTransactionId: confirmacion.clientTransactionId,
        amount: confirmacion.amount
      });
      return responderPagina(res, 400, {
        tipo: 'error',
        titulo: 'No pudimos validar el pago',
        mensaje: 'El pago no coincide con tu pedido. Acércate a caja para revisarlo.',
        enlaceApp: enlaceApp(pedidoId)
      });
    }

    if (transaccion.estado === 'iniciada') await transaccion.update({ estado: 'cancelada' });
    return responderPagina(res, 200, PAGINA_CANCELADO(pedidoId));
  } catch (error) {
    next(error);
  }
};
