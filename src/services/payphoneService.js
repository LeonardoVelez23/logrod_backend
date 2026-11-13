import { config } from '../config/env.js';

/**
 * Cliente mínimo de la API "Botón de pago por redirección" de Payphone.
 * Docs: https://docs.payphone.app/boton-de-pago-por-redireccion
 *
 * Los montos van en centavos (enteros). El ambiente (pruebas o producción)
 * lo define la aplicación creada en Payphone Developer, no la URL.
 */

export class ErrorPayphone extends Error {
  constructor(message, { status, errorCode } = {}) {
    super(message);
    this.name = 'ErrorPayphone';
    this.status = status;
    this.errorCode = errorCode;
  }
}

/** Estado de una transacción en la respuesta de Confirm. */
export const ESTADO_PAYPHONE = { CANCELADA: 2, APROBADA: 3 };

export const payphoneConfigurado = () => {
  const { token, storeId, responseUrl } = config.payphone;
  return Boolean(token && storeId && responseUrl);
};

/** Dólares → centavos sin errores de coma flotante (2.675 → 268). */
export const aCentavos = (valor) => Math.round(Number(valor) * 100);

const llamar = async (ruta, cuerpo) => {
  let res;
  try {
    res = await fetch(`${config.payphone.apiUrl}${ruta}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.payphone.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(cuerpo),
      signal: AbortSignal.timeout(15000)
    });
  } catch (error) {
    throw new ErrorPayphone(`Sin conexión con Payphone: ${error.message}`);
  }
  const datos = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new ErrorPayphone(datos.message || `Payphone respondió ${res.status}`, {
      status: res.status,
      errorCode: datos.errorCode
    });
  }
  return datos;
};

/**
 * Crea el pago en Payphone. Devuelve `{paymentId, payWithCard, payWithPayPhone}`:
 * enlaces que vencen a los 10 minutos y deben abrirse en el navegador.
 */
export const prepararPago = ({ clientTransactionId, centavos, referencia }) => {
  const { storeId, responseUrl } = config.payphone;
  const cancelacion = new URL(responseUrl);
  cancelacion.searchParams.set('clientTransactionId', clientTransactionId);
  cancelacion.searchParams.set('cancelado', '1');
  return llamar('/api/button/Prepare', {
    amount: centavos,
    // Los precios del menú son finales: todo el monto va como "sin impuesto".
    amountWithoutTax: centavos,
    currency: 'USD',
    clientTransactionId,
    storeId,
    reference: referencia,
    responseUrl,
    cancellationUrl: cancelacion.toString(),
    lang: 'es'
  });
};

/**
 * Consulta el resultado. Hay que llamarlo dentro de los 5 minutos
 * siguientes al pago o Payphone lo revierte automáticamente.
 */
export const confirmarPago = ({ id, clientTransactionId }) =>
  llamar('/api/button/V2/Confirm', { id: Number(id), clientTxId: clientTransactionId });
