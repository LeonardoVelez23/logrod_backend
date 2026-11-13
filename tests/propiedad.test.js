import { beforeEach, describe, expect, it } from 'vitest';
import { Pago } from '../src/models/index.js';
import {
  api,
  auth,
  crearCliente,
  crearEmpleado,
  crearPedido,
  limpiarBase,
  login
} from './helpers.js';

describe('Clientes solo acceden a lo suyo', () => {
  let ana, beto, tokenAna, tokenAdmin, cajero, pedidoBeto, pedidoAna;

  beforeEach(async () => {
    await limpiarBase();
    ana = await crearCliente();
    beto = await crearCliente();
    cajero = await crearEmpleado('cajero');
    const admin = await crearEmpleado('admin');
    tokenAna = await login(ana);
    tokenAdmin = await login(admin);
    pedidoAna = await crearPedido(ana, { estado: 'confirmado', empleado: cajero });
    pedidoBeto = await crearPedido(beto, { estado: 'confirmado', empleado: cajero });
  });

  describe('perfil', () => {
    it('no ve el perfil de otro cliente', async () => {
      const res = await api().get(`/api/v1/clientes/${beto.id}`).set(auth(tokenAna));
      expect(res.status).toBe(403);
    });

    it('ve su propio perfil sin datos privados', async () => {
      const res = await api().get(`/api/v1/clientes/${ana.id}`).set(auth(tokenAna));
      expect(res.status).toBe(200);
      expect(res.body.data).not.toHaveProperty('contrasenia');
      expect(res.body.data).not.toHaveProperty('reset_password_token');
    });

    it('el admin ve cualquier perfil', async () => {
      const res = await api().get(`/api/v1/clientes/${beto.id}`).set(auth(tokenAdmin));
      expect(res.status).toBe(200);
    });
  });

  describe('pedidos', () => {
    it('no ve el pedido de otro cliente', async () => {
      const res = await api().get(`/api/v1/pedidos/${pedidoBeto.id}`).set(auth(tokenAna));
      expect(res.status).toBe(403);
    });

    it('ve su propio pedido', async () => {
      const res = await api().get(`/api/v1/pedidos/${pedidoAna.id}`).set(auth(tokenAna));
      expect(res.status).toBe(200);
    });

    it('el personal ve cualquier pedido', async () => {
      const res = await api()
        .get(`/api/v1/pedidos/${pedidoBeto.id}`)
        .set(auth(await login(cajero)));
      expect(res.status).toBe(200);
    });
  });

  describe('pagos', () => {
    const pagar = (token, pedido, extra = {}) =>
      api()
        .post('/api/v1/pagos')
        .set(auth(token))
        .send({
          pedido_id: pedido.id,
          fecha: '2026-11-11T12:00:00Z',
          valor: 5,
          metodo_pago: 'tarjeta',
          numero_referencia: 'PAY-SIM-1',
          ...extra
        });

    it('un cliente no puede aprobar su propio pago: queda pendiente', async () => {
      const res = await pagar(tokenAna, pedidoAna, { estado: 'aprobado' });

      expect(res.status).toBe(201);
      expect(res.body.data.estado).toBe('pendiente');
    });

    it('un cliente no puede pagar el pedido de otro', async () => {
      const res = await pagar(tokenAna, pedidoBeto);

      expect(res.status).toBe(403);
      expect(await Pago.count()).toBe(0);
    });

    it('el cajero sí registra un pago aprobado', async () => {
      const res = await pagar(await login(cajero), pedidoBeto, { estado: 'aprobado' });

      expect(res.status).toBe(201);
      expect(res.body.data.estado).toBe('aprobado');
    });

    it('no ve el pago de otro cliente (por pedido ni por id)', async () => {
      const pago = await Pago.create({
        pedido_id: pedidoBeto.id,
        fecha: new Date(),
        valor: 5,
        metodo_pago: 'efectivo',
        estado: 'aprobado'
      });

      const porPedido = await api()
        .get(`/api/v1/pagos/pedido/${pedidoBeto.id}`)
        .set(auth(tokenAna));
      const porId = await api().get(`/api/v1/pagos/${pago.id}`).set(auth(tokenAna));

      expect(porPedido.status).toBe(403);
      expect(porId.status).toBe(403);
    });

    it('ve el pago de su propio pedido', async () => {
      await pagar(tokenAna, pedidoAna);

      const res = await api().get(`/api/v1/pagos/pedido/${pedidoAna.id}`).set(auth(tokenAna));

      expect(res.status).toBe(200);
    });
  });
});
