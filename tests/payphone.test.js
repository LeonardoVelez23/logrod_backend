import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { config } from '../src/config/env.js';
import { Pago, TransaccionPayphone } from '../src/models/index.js';
import { api, auth, crearCliente, crearEmpleado, crearPedido, limpiarBase, login } from './helpers.js';

const RESPUESTA_URL = 'https://prueba.ngrok-free.app/pagos/payphone/retorno';

/** Simula la API de Payphone: Prepare y Confirm. */
const simularPayphone = ({ confirm } = {}) =>
  vi.spyOn(globalThis, 'fetch').mockImplementation(async (url, opciones) => {
    const cuerpo = JSON.parse(opciones.body);
    if (url.endsWith('/api/button/Prepare')) {
      return Response.json({
        paymentId: 'abc',
        payWithCard: `https://pay.payphonetodoesposible.com/PayWithCard/${cuerpo.clientTransactionId}`,
        payWithPayPhone: 'https://pay.payphonetodoesposible.com/PayWithPayPhone/x'
      });
    }
    if (url.endsWith('/api/button/V2/Confirm')) {
      return Response.json({
        statusCode: 3,
        transactionStatus: 'Approved',
        transactionId: Number(cuerpo.id),
        clientTransactionId: cuerpo.clientTxId,
        authorizationCode: 'W123',
        amount: 500,
        ...confirm
      });
    }
    return new Response('{}', { status: 404 });
  });

describe('Pago con tarjeta por Payphone (RF-22)', () => {
  let ana, token, pedido;
  const original = { ...config.payphone };

  beforeEach(async () => {
    await limpiarBase();
    Object.assign(config.payphone, { token: 'tok', storeId: 'store', responseUrl: RESPUESTA_URL });
    ana = await crearCliente();
    token = await login(ana);
    pedido = await crearPedido(ana); // solicitado, $5.00
  });

  afterEach(() => {
    vi.restoreAllMocks();
    Object.assign(config.payphone, original);
  });

  const preparar = (pedidoId = pedido.id, tk = token) =>
    api().post('/api/v1/pagos/payphone/preparar').set(auth(tk)).send({ pedido_id: pedidoId });

  const retorno = (query) => api().get('/pagos/payphone/retorno').query(query);

  it('prepara el pago de un pedido recién hecho con el monto en centavos', async () => {
    const fetch = simularPayphone();

    const res = await preparar();

    expect(res.status).toBe(201);
    expect(res.body.data.url).toMatch(/^https:\/\/pay\.payphonetodoesposible\.com\/PayWithCard\//);
    const [url, opciones] = fetch.mock.calls[0];
    expect(url).toBe('https://pay.payphonetodoesposible.com/api/button/Prepare');
    expect(opciones.headers.Authorization).toBe('Bearer tok');
    const cuerpo = JSON.parse(opciones.body);
    expect(cuerpo).toMatchObject({
      amount: 500,
      amountWithoutTax: 500,
      currency: 'USD',
      storeId: 'store',
      responseUrl: RESPUESTA_URL,
      clientTransactionId: res.body.data.client_transaction_id
    });
    expect(cuerpo.cancellationUrl).toContain('cancelado=1');
    expect(await TransaccionPayphone.count()).toBe(1);
  });

  it('sin credenciales de Payphone responde 503', async () => {
    config.payphone.token = '';
    const res = await preparar();
    expect(res.status).toBe(503);
  });

  it('no deja pagar pedidos ajenos, cancelados o ya pagados', async () => {
    simularPayphone();
    const beto = await crearCliente();
    const pedidoBeto = await crearPedido(beto);
    expect((await preparar(pedidoBeto.id)).status).toBe(404);

    const cancelado = await crearPedido(ana, { estado: 'cancelado' });
    expect((await preparar(cancelado.id)).status).toBe(400);

    await Pago.create({ pedido_id: pedido.id, fecha: new Date(), valor: 5, metodo_pago: 'efectivo', estado: 'aprobado' });
    const res = await preparar();
    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Este pedido ya está pagado');
  });

  it('solo para clientes', async () => {
    const tokenCajero = await login(await crearEmpleado('cajero'));
    expect((await preparar(pedido.id, tokenCajero)).status).toBe(403);
  });

  it('si Payphone falla al preparar, no deja la transacción', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(Response.json({ message: 'Token inválido' }, { status: 401 }));
    vi.spyOn(console, 'error').mockImplementation(() => {});

    const res = await preparar();

    expect(res.status).toBe(502);
    expect(await TransaccionPayphone.count()).toBe(0);
  });

  it('al volver aprobado confirma con Payphone y registra el pago aprobado', async () => {
    const fetch = simularPayphone();
    const { client_transaction_id: tx } = (await preparar()).body.data;

    const res = await retorno({ id: 98765, clientTransactionId: tx });

    expect(res.status).toBe(200);
    expect(res.text).toContain('Pago aprobado');
    expect(res.text).toContain(`saborpolitecnico://app/pedidos/${pedido.id}`);
    expect(JSON.parse(fetch.mock.calls[1][1].body)).toEqual({ id: 98765, clientTxId: tx });
    const pago = await Pago.findOne({ where: { pedido_id: pedido.id } });
    expect(pago).toMatchObject({ estado: 'aprobado', metodo_pago: 'tarjeta', valor: 5, numero_referencia: 'Payphone 98765' });

    // Volver a abrir la página no duplica nada ni vuelve a consultar.
    const otra = await retorno({ id: 98765, clientTransactionId: tx });
    expect(otra.text).toContain('Pago aprobado');
    expect(fetch).toHaveBeenCalledTimes(2);
    expect(await Pago.count()).toBe(1);
  });

  it('el pedido aparece pagado en Mis pedidos', async () => {
    simularPayphone();
    const { client_transaction_id: tx } = (await preparar()).body.data;
    await retorno({ id: 1, clientTransactionId: tx });

    const res = await api().get('/api/v1/pedidos/mios').set(auth(token));

    expect(res.body.data[0].pago).toMatchObject({ estado: 'aprobado', metodo_pago: 'tarjeta' });
  });

  it('un pago pendiente registrado antes pasa a aprobado', async () => {
    simularPayphone();
    await Pago.create({ pedido_id: pedido.id, fecha: new Date(), valor: 5, metodo_pago: 'efectivo', estado: 'pendiente' });
    const { client_transaction_id: tx } = (await preparar()).body.data;

    await retorno({ id: 7, clientTransactionId: tx });

    const pagos = await Pago.findAll();
    expect(pagos).toHaveLength(1);
    expect(pagos[0]).toMatchObject({ estado: 'aprobado', metodo_pago: 'tarjeta' });
  });

  it('cancelado en Payphone: no registra pago', async () => {
    simularPayphone({ confirm: { statusCode: 2, transactionStatus: 'Canceled' } });
    const { client_transaction_id: tx } = (await preparar()).body.data;

    const res = await retorno({ id: 5, clientTransactionId: tx });

    expect(res.text).toContain('Pago no realizado');
    expect(await Pago.count()).toBe(0);
    expect((await TransaccionPayphone.findOne()).estado).toBe('cancelada');
  });

  it('el botón Cancelar de Payphone no consulta ni registra pago', async () => {
    const fetch = simularPayphone();
    const { client_transaction_id: tx } = (await preparar()).body.data;

    const res = await retorno({ clientTransactionId: tx, cancelado: 1 });

    expect(res.text).toContain('Pago no realizado');
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(await Pago.count()).toBe(0);
  });

  it('no registra un aprobado de otro monto', async () => {
    simularPayphone({ confirm: { amount: 100 } });
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const { client_transaction_id: tx } = (await preparar()).body.data;

    const res = await retorno({ id: 5, clientTransactionId: tx });

    expect(res.status).toBe(400);
    expect(await Pago.count()).toBe(0);
  });

  it('si el restaurante canceló mientras pagaba, el pago queda reembolsado', async () => {
    simularPayphone();
    const { client_transaction_id: tx } = (await preparar()).body.data;
    await pedido.update({ estado: 'cancelado' });

    await retorno({ id: 5, clientTransactionId: tx });

    expect((await Pago.findOne()).estado).toBe('reembolsado');
  });

  it('una transacción desconocida muestra un error', async () => {
    const res = await retorno({ id: 1, clientTransactionId: 'no-existe' });
    expect(res.status).toBe(404);
    expect(res.text).toContain('Pago no encontrado');
  });
});
