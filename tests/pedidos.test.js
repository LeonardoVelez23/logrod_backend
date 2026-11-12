import { beforeEach, describe, expect, it } from 'vitest';
import { DetallePedido, Pago, Pedido } from '../src/models/index.js';
import {
  api,
  auth,
  crearCliente,
  crearEmpleado,
  crearProducto,
  limpiarBase,
  login
} from './helpers.js';

const hoyEcuador = () =>
  new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Guayaquil' }).format(new Date());

const pedir = (token, detalles, extra = {}) =>
  api()
    .post('/api/v1/pedidos')
    .set(auth(token))
    .send({ modalidad: 'en línea', detalles, ...extra });

const cancelar = (token, id) =>
  api().put(`/api/v1/pedidos/${id}`).set(auth(token)).send({ estado: 'cancelado' });

describe('Pedidos (bloque 2)', () => {
  let ana, beto, tokenAna, tokenBeto, tokenAdmin, cajero, tokenCajero;

  beforeEach(async () => {
    await limpiarBase();
    ana = await crearCliente();
    beto = await crearCliente();
    const admin = await crearEmpleado('admin');
    cajero = await crearEmpleado('cajero');
    [tokenAna, tokenBeto, tokenAdmin, tokenCajero] = await Promise.all([
      login(ana),
      login(beto),
      login(admin),
      login(cajero)
    ]);
  });

  describe('crear: datos que pone el servidor', () => {
    it('el cliente del pedido es el del token, aunque el cuerpo diga otro', async () => {
      const producto = await crearProducto();

      const res = await pedir(tokenAna, [{ producto_id: producto.id, cantidad: 1 }], {
        cliente_id: beto.id
      });

      expect(res.status).toBe(201);
      expect(res.body.data.cliente_id).toBe(ana.id);
    });

    it('fecha y hora salen del reloj del servidor (Ecuador)', async () => {
      const producto = await crearProducto();

      const res = await pedir(tokenAna, [{ producto_id: producto.id, cantidad: 1 }], {
        fecha: '2000-01-01',
        hora: '03:00:00'
      });

      expect(res.status).toBe(201);
      expect(res.body.data.fecha).toBe(hoyEcuador());
      expect(res.body.data.hora).toMatch(/^\d{2}:\d{2}:\d{2}$/);
    });

    it('un cliente no puede asignar empleados a su pedido', async () => {
      const producto = await crearProducto();

      const res = await pedir(tokenAna, [{ producto_id: producto.id, cantidad: 1 }], {
        empleado_id: cajero.id,
        empleado_preparacion_id: cajero.id
      });

      expect(res.status).toBe(201);
      expect(res.body.data.empleado_id).toBeNull();
      expect(res.body.data.empleado_preparacion_id).toBeNull();
    });

    it('el personal debe indicar el cliente del pedido asistido', async () => {
      const producto = await crearProducto();
      const detalles = [{ producto_id: producto.id, cantidad: 1 }];

      const sinCliente = await pedir(tokenCajero, detalles);
      expect(sinCliente.status).toBe(400);

      const conCliente = await pedir(tokenCajero, detalles, { cliente_id: beto.id });
      expect(conCliente.status).toBe(201);
      expect(conCliente.body.data.cliente_id).toBe(beto.id);
    });

    it('rechaza un empleado de preparación inexistente', async () => {
      const producto = await crearProducto();

      const res = await pedir(tokenCajero, [{ producto_id: producto.id, cantidad: 1 }], {
        cliente_id: ana.id,
        empleado_preparacion_id: 99999
      });

      expect(res.status).toBe(400);
    });
  });

  describe('crear: stock', () => {
    it('un producto repetido se agrupa en una línea y descuenta la suma', async () => {
      const producto = await crearProducto({ cantidad_disponible: 10, precio: 2.5 });

      const res = await pedir(tokenAna, [
        { producto_id: producto.id, cantidad: 3 },
        { producto_id: producto.id, cantidad: 3 }
      ]);

      expect(res.status).toBe(201);
      expect(res.body.data.detalles).toHaveLength(1);
      expect(res.body.data.detalles[0].cantidad).toBe(6);
      expect(Number(res.body.data.valor_total)).toBe(15);
      await producto.reload();
      expect(producto.cantidad_disponible).toBe(4);
    });

    it('un producto repetido cuya suma supera el stock se rechaza', async () => {
      const producto = await crearProducto({ cantidad_disponible: 5 });

      const res = await pedir(tokenAna, [
        { producto_id: producto.id, cantidad: 3 },
        { producto_id: producto.id, cantidad: 3 }
      ]);

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/Stock insuficiente/);
      await producto.reload();
      expect(producto.cantidad_disponible).toBe(5);
      expect(await Pedido.count()).toBe(0);
    });

    it('el máximo de 50 unidades aplica a la suma por producto', async () => {
      const producto = await crearProducto({ cantidad_disponible: 100 });

      const res = await pedir(tokenAna, [
        { producto_id: producto.id, cantidad: 30 },
        { producto_id: producto.id, cantidad: 30 }
      ]);

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/50/);
    });

    it.each([1.5, '2', 0, -1])('rechaza la cantidad %s', async (cantidad) => {
      const producto = await crearProducto();

      const res = await pedir(tokenAna, [{ producto_id: producto.id, cantidad }]);

      expect(res.status).toBe(400);
    });

    it('dos pedidos simultáneos por la última unidad: solo uno se crea', async () => {
      const producto = await crearProducto({ cantidad_disponible: 1 });
      const detalles = [{ producto_id: producto.id, cantidad: 1 }];

      const respuestas = await Promise.all([pedir(tokenAna, detalles), pedir(tokenBeto, detalles)]);

      expect(respuestas.map((r) => r.status).sort()).toEqual([201, 400]);
      await producto.reload();
      expect(producto.cantidad_disponible).toBe(0);
    });
  });

  describe('cancelar', () => {
    let producto, pedido;

    beforeEach(async () => {
      producto = await crearProducto({ cantidad_disponible: 10 });
      const res = await pedir(tokenAna, [{ producto_id: producto.id, cantidad: 4 }]);
      pedido = res.body.data;
    });

    it('el personal cancela el pedido y el stock vuelve', async () => {
      const res = await cancelar(tokenCajero, pedido.id);

      expect(res.status).toBe(200);
      expect(res.body.data.estado).toBe('cancelado');
      await producto.reload();
      expect(producto.cantidad_disponible).toBe(10);
    });

    it('el cliente no puede cancelar su pedido una vez hecho', async () => {
      const res = await cancelar(tokenAna, pedido.id);

      expect(res.status).toBe(403);
      const enBase = await Pedido.findByPk(pedido.id);
      expect(enBase.estado).toBe('solicitado');
      await producto.reload();
      expect(producto.cantidad_disponible).toBe(6);
    });

    it('el cliente no puede modificar el pedido de ninguna forma', async () => {
      const res = await api()
        .put(`/api/v1/pedidos/${pedido.id}`)
        .set(auth(tokenAna))
        .send({ estado: 'confirmado', empleado_id: cajero.id });

      expect(res.status).toBe(403);
    });

    it('dos cancelaciones simultáneas devuelven el stock una sola vez', async () => {
      const respuestas = await Promise.all([
        cancelar(tokenAdmin, pedido.id),
        cancelar(tokenAdmin, pedido.id)
      ]);

      expect(respuestas.map((r) => r.status).sort()).toEqual([200, 400]);
      await producto.reload();
      expect(producto.cantidad_disponible).toBe(10);
    });

    it('al cancelar con pago aprobado, el pago queda reembolsado y no suma ingresos', async () => {
      await Pedido.update(
        { estado: 'confirmado', empleado_id: cajero.id },
        { where: { id: pedido.id } }
      );
      await Pago.create({
        pedido_id: pedido.id,
        fecha: hoyEcuador(),
        valor: pedido.valor_total,
        metodo_pago: 'efectivo',
        estado: 'aprobado'
      });

      const res = await cancelar(tokenAdmin, pedido.id);

      expect(res.status).toBe(200);
      const pago = await Pago.findOne({ where: { pedido_id: pedido.id } });
      expect(pago.estado).toBe('reembolsado');
      const stats = await api().get('/api/v1/pedidos/stats').set(auth(tokenAdmin));
      expect(stats.body.data.totalRevenue).toBe(0);
    });

    it('eliminar un pedido cancelado no devuelve el stock otra vez', async () => {
      await cancelar(tokenAdmin, pedido.id);

      const res = await api().delete(`/api/v1/pedidos/${pedido.id}`).set(auth(tokenAdmin));

      expect(res.status).toBe(200);
      await producto.reload();
      expect(producto.cantidad_disponible).toBe(10);
      expect(await DetallePedido.count()).toBe(0);
    });
  });

  describe('GET /pedidos/mios', () => {
    it('devuelve solo los pedidos del cliente, del más nuevo al más viejo', async () => {
      const producto = await crearProducto({ imagen_codigo: 'bandeja_paisa' });
      const primero = await pedir(tokenAna, [{ producto_id: producto.id, cantidad: 1 }]);
      const segundo = await pedir(tokenAna, [{ producto_id: producto.id, cantidad: 2 }]);
      await pedir(tokenBeto, [{ producto_id: producto.id, cantidad: 1 }]);

      const res = await api().get('/api/v1/pedidos/mios').set(auth(tokenAna));

      expect(res.status).toBe(200);
      expect(res.body.data.map((p) => p.id)).toEqual([segundo.body.data.id, primero.body.data.id]);
      expect(res.body.data[0].detalles[0].producto.imagen_codigo).toBe('bandeja_paisa');
      expect(res.body.data[0]).toHaveProperty('pago');
      expect(res.body.data[0]).not.toHaveProperty('cliente');
    });

    it('el personal no usa esta ruta', async () => {
      const res = await api().get('/api/v1/pedidos/mios').set(auth(tokenCajero));

      expect(res.status).toBe(403);
    });
  });

  describe('estadísticas', () => {
    it('los productos populares no cuentan pedidos cancelados', async () => {
      const producto = await crearProducto({ cantidad_disponible: 30 });
      const res = await pedir(tokenAna, [{ producto_id: producto.id, cantidad: 5 }]);
      await cancelar(tokenAdmin, res.body.data.id);

      const stats = await api().get('/api/v1/pedidos/stats').set(auth(tokenAdmin));

      expect(stats.status).toBe(200);
      expect(stats.body.data.popularProducts).toEqual([]);
    });
  });
});
