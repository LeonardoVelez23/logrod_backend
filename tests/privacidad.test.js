import { beforeEach, describe, expect, it } from 'vitest';
import { Cliente, Pedido } from '../src/models/index.js';
import {
  api,
  auth,
  crearCliente,
  crearEmpleado,
  crearPedido,
  limpiarBase,
  login,
  PASSWORD
} from './helpers.js';

describe('Privacidad del cliente (LOPDP y tiendas)', () => {
  let ana, tokenAna;

  beforeEach(async () => {
    await limpiarBase();
    ana = await crearCliente({ telefono: '0987654321', legal_version: '2026-11-13' });
    tokenAna = await login(ana);
  });

  const eliminar = (token, contrasenia = PASSWORD) =>
    api().delete('/api/v1/privacidad/mi-cuenta').set(auth(token)).send({ contrasenia });

  describe('GET /privacidad/mis-datos', () => {
    it('devuelve sus datos, la aceptación legal y sus pedidos, sin secretos', async () => {
      await crearPedido(ana);

      const res = await api().get('/api/v1/privacidad/mis-datos').set(auth(tokenAna));

      expect(res.status).toBe(200);
      expect(res.body.data.cliente).toMatchObject({
        correo_electronico: ana.correo_electronico,
        telefono: '0987654321'
      });
      expect(res.body.data.aceptacion_legal.version).toBe('2026-11-13');
      expect(res.body.data.pedidos).toHaveLength(1);
      expect(JSON.stringify(res.body)).not.toMatch(/contrasenia|reset_password/);
    });

    it('solo para clientes', async () => {
      const token = await login(await crearEmpleado('admin'));
      const res = await api().get('/api/v1/privacidad/mis-datos').set(auth(token));
      expect(res.status).toBe(403);
    });
  });

  describe('DELETE /privacidad/mi-cuenta', () => {
    it('anonimiza los datos, conserva los pedidos y corta la sesión', async () => {
      const pedido = await crearPedido(ana, { estado: 'entregado' });

      const res = await eliminar(tokenAna);

      expect(res.status).toBe(200);
      const fila = await Cliente.findByPk(ana.id);
      expect(fila.eliminado_en).toBeInstanceOf(Date);
      expect(fila.correo_electronico).not.toBe(ana.correo_electronico);
      expect(fila.identificacion).toBe(`ELIMINADO-${ana.id}`);
      expect(fila.telefono).toBeNull();
      expect(await Pedido.findByPk(pedido.id)).not.toBeNull();

      // El token anterior ya no sirve y no se puede volver a entrar.
      const conToken = await api().get('/api/v1/privacidad/mis-datos').set(auth(tokenAna));
      expect(conToken.status).toBe(401);
      const relogin = await api()
        .post('/api/v1/auth/login')
        .send({ email: ana.correo_electronico, password: PASSWORD });
      expect(relogin.status).toBe(401);
    });

    it('el correo queda libre para registrarse de nuevo', async () => {
      await eliminar(tokenAna);
      await expect(crearCliente({ correo_electronico: ana.correo_electronico })).resolves.toBeTruthy();
    });

    it('con contraseña incorrecta no elimina', async () => {
      const res = await eliminar(tokenAna, 'Otra#2026');

      expect(res.status).toBe(400);
      expect((await Cliente.findByPk(ana.id)).eliminado_en).toBeNull();
    });

    it('sin contraseña → 400', async () => {
      const res = await api().delete('/api/v1/privacidad/mi-cuenta').set(auth(tokenAna)).send({});
      expect(res.status).toBe(400);
    });

    it('con un pedido en curso no elimina', async () => {
      await crearPedido(ana, { estado: 'solicitado' });

      const res = await eliminar(tokenAna);

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('pedidos en curso');
      expect((await Cliente.findByPk(ana.id)).eliminado_en).toBeNull();
    });

    it('las cuentas eliminadas no salen en la lista del personal', async () => {
      await eliminar(tokenAna);
      const token = await login(await crearEmpleado('admin'));

      const res = await api().get('/api/v1/clientes').set(auth(token));

      expect(res.body.data.map((c) => c.id)).not.toContain(ana.id);
    });
  });

  describe('páginas públicas para las tiendas', () => {
    it.each(['terminos', 'privacidad', 'eliminar-cuenta'])('GET /legal/%s es HTML', async (pagina) => {
      const res = await api().get(`/legal/${pagina}`);

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toContain('text/html');
      expect(res.text).toContain('<!doctype html>');
      expect(res.text).toContain('#1A365D');
      expect(res.text).not.toContain('<script');
    });

    it('una página que no existe → 404', async () => {
      const res = await api().get('/legal/otra');
      expect(res.status).toBe(404);
    });
  });
});
