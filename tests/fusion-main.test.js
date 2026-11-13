import { beforeEach, describe, expect, it } from 'vitest';
import {
  api,
  auth,
  crearCliente,
  crearEmpleado,
  crearPedido,
  limpiarBase,
  login
} from './helpers.js';

// Cambios que llegaron por main (agosto 2026) y se integraron en develop.
describe('Cambios integrados desde main', () => {
  let ana, beto, admin, tokenAna, tokenAdmin, tokenCajero;

  beforeEach(async () => {
    await limpiarBase();
    ana = await crearCliente();
    beto = await crearCliente();
    admin = await crearEmpleado('admin');
    const cajero = await crearEmpleado('cajero');
    [tokenAna, tokenAdmin, tokenCajero] = await Promise.all([login(ana), login(admin), login(cajero)]);
    await crearPedido(ana);
    await crearPedido(beto);
  });

  describe('GET /pedidos', () => {
    it('el cliente solo recibe sus pedidos aunque pida los de otro', async () => {
      const res = await api().get(`/api/v1/pedidos?cliente_id=${beto.id}`).set(auth(tokenAna));

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].cliente_id).toBe(ana.id);
    });

    it('el personal filtra por cliente_id', async () => {
      const res = await api().get(`/api/v1/pedidos?cliente_id=${beto.id}`).set(auth(tokenCajero));

      expect(res.status).toBe(200);
      expect(res.body.data.map((p) => p.cliente_id)).toEqual([beto.id]);
    });

    it('cliente_id no numérico → 400', async () => {
      const res = await api().get('/api/v1/pedidos?cliente_id=abc').set(auth(tokenCajero));
      expect(res.status).toBe(400);
    });
  });

  describe('cambio de contraseña por el administrador', () => {
    it('el admin cambia la de un cliente sin OTP', async () => {
      const res = await api()
        .put(`/api/v1/clientes/${ana.id}`)
        .set(auth(tokenAdmin))
        .send({ contrasenia: 'Nueva#2026' });

      expect(res.status).toBe(200);
      const nuevo = await api()
        .post('/api/v1/auth/login')
        .send({ email: ana.correo_electronico, password: 'Nueva#2026' });
      expect(nuevo.status).toBe(200);
    });

    it('el admin cambia la de otro empleado sin OTP', async () => {
      const mesero = await crearEmpleado('mesero');
      const res = await api()
        .put(`/api/v1/empleados/${mesero.id}`)
        .set(auth(tokenAdmin))
        .send({ contrasenia: 'Nueva#2026' });

      expect(res.status).toBe(200);
    });

    it('el admin necesita OTP para cambiar la suya', async () => {
      const res = await api()
        .put(`/api/v1/empleados/${admin.id}`)
        .set(auth(tokenAdmin))
        .send({ contrasenia: 'Nueva#2026' });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('OTP');
    });

    it('la política de contraseñas también aplica al admin', async () => {
      const res = await api()
        .put(`/api/v1/clientes/${ana.id}`)
        .set(auth(tokenAdmin))
        .send({ contrasenia: 'simple' });

      expect(res.status).toBe(400);
    });

    it('el cliente sigue necesitando OTP', async () => {
      const res = await api()
        .put(`/api/v1/clientes/${ana.id}`)
        .set(auth(tokenAna))
        .send({ contrasenia: 'Nueva#2026' });

      expect(res.status).toBe(400);
    });
  });
});
