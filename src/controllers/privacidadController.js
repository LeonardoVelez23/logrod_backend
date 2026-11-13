import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { Op } from 'sequelize';
import { Cliente, Pedido, DetallePedido, Producto, Pago, sequelize } from '../models/index.js';

const ESTADOS_FINALES = ['entregado', 'cancelado'];

/**
 * Datos personales del cliente autenticado, en un formato que puede
 * descargar (LOPDP: derecho de acceso y portabilidad).
 */
export const getMisDatos = async (req, res, next) => {
  try {
    const cliente = await Cliente.findByPk(req.user.id);
    if (!cliente) {
      return res.status(404).json({ success: false, message: 'Cliente no encontrado' });
    }

    const pedidos = await Pedido.findAll({
      where: { cliente_id: cliente.id },
      attributes: ['id', 'fecha', 'hora', 'modalidad', 'estado', 'valor_total'],
      include: [
        {
          model: DetallePedido,
          as: 'detalles',
          attributes: ['cantidad', 'precio_unitario', 'subtotal'],
          include: { model: Producto, as: 'producto', attributes: ['nombre'] }
        },
        { model: Pago, as: 'pago', attributes: ['fecha', 'valor', 'metodo_pago', 'estado'] }
      ],
      order: [['id', 'DESC']]
    });

    res.status(200).json({
      success: true,
      data: {
        generado_en: new Date().toISOString(),
        cliente: {
          identificacion: cliente.identificacion,
          nombres: cliente.nombres,
          apellidos: cliente.apellidos,
          correo_electronico: cliente.correo_electronico,
          telefono: cliente.telefono,
          tipo_cliente: cliente.tipo_cliente,
          registrado_en: cliente.createdAt,
          actualizado_en: cliente.updatedAt
        },
        aceptacion_legal: cliente.legal_version
          ? { version: cliente.legal_version, aceptado_en: cliente.legal_aceptado_en }
          : null,
        pedidos: pedidos.map((p) => ({
          id: p.id,
          fecha: p.fecha,
          hora: p.hora,
          modalidad: p.modalidad,
          estado: p.estado,
          valor_total: p.valor_total,
          productos: p.detalles.map((d) => ({
            producto: d.producto?.nombre ?? null,
            cantidad: d.cantidad,
            precio_unitario: d.precio_unitario,
            subtotal: d.subtotal
          })),
          pago: p.pago
        }))
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * El cliente elimina su cuenta confirmando con su contraseña. Se reemplazan
 * sus datos personales (no se borra la fila: los pedidos y pagos la
 * referencian y se conservan anónimos por contabilidad).
 */
export const eliminarMiCuenta = async (req, res, next) => {
  const { contrasenia } = req.body ?? {};
  if (typeof contrasenia !== 'string' || !contrasenia) {
    return res.status(400).json({ success: false, message: 'Ingresa tu contraseña para confirmar' });
  }

  try {
    const resultado = await sequelize.transaction(async (transaction) => {
      const cliente = await Cliente.findByPk(req.user.id, {
        lock: transaction.LOCK.UPDATE,
        transaction
      });
      if (!cliente || cliente.eliminado_en) {
        return { status: 404, message: 'Cliente no encontrado' };
      }
      if (!(await bcrypt.compare(contrasenia, cliente.contrasenia))) {
        return { status: 400, message: 'La contraseña no es correcta' };
      }

      const enCurso = await Pedido.count({
        where: { cliente_id: cliente.id, estado: { [Op.notIn]: ESTADOS_FINALES } },
        transaction
      });
      if (enCurso > 0) {
        return {
          status: 400,
          message: 'Tienes pedidos en curso. Podrás eliminar tu cuenta cuando se entreguen o se cancelen.'
        };
      }

      const marca = `ELIMINADO-${cliente.id}`;
      await cliente.update(
        {
          identificacion: marca,
          nombres: 'Cliente',
          apellidos: 'eliminado',
          correo_electronico: `eliminado-${cliente.id}@eliminado.invalid`,
          telefono: null,
          // Contraseña imposible de adivinar: nadie vuelve a entrar.
          contrasenia: await bcrypt.hash(crypto.randomBytes(32).toString('hex'), 10),
          reset_password_token: null,
          reset_password_expires: null,
          reset_password_attempts: 0,
          legal_version: null,
          legal_aceptado_en: null,
          eliminado_en: new Date()
        },
        { transaction }
      );
      return { status: 200, message: 'Tu cuenta y tus datos personales se eliminaron' };
    });

    res.status(resultado.status).json({
      success: resultado.status === 200,
      message: resultado.message
    });
  } catch (error) {
    next(error);
  }
};
