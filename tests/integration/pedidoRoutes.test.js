import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../../src/app.js';
import { Pedido, Cliente, Empleado, Producto, DetallePedido, Pago } from '../../src/models/index.js';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'jwt_secret_resto_logrod_2026';

vi.mock('../../src/models/index.js', () => {
  const mockTransaction = {
    commit: vi.fn().mockResolvedValue(true),
    rollback: vi.fn().mockResolvedValue(true)
  };

  return {
    sequelize: {
      transaction: vi.fn().mockResolvedValue(mockTransaction),
      fn: vi.fn(),
      col: vi.fn()
    },
    Pedido: {
      findAll: vi.fn(),
      findByPk: vi.fn(),
      create: vi.fn(),
      count: vi.fn().mockResolvedValue(10)
    },
    DetallePedido: {
      findAll: vi.fn().mockResolvedValue([]),
      create: vi.fn(),
      destroy: vi.fn()
    },
    Producto: {
      findByPk: vi.fn(),
      count: vi.fn().mockResolvedValue(5)
    },
    Cliente: {
      findByPk: vi.fn(),
      findOne: vi.fn(),
      count: vi.fn().mockResolvedValue(20)
    },
    Empleado: {
      findByPk: vi.fn(),
      findOne: vi.fn(),
      count: vi.fn().mockResolvedValue(4)
    },
    Pago: {
      findAll: vi.fn(),
      sum: vi.fn().mockResolvedValue(150.0)
    },
    Categoria: { findAll: vi.fn() }
  };
});

describe('Pedido Routes (/api/v1/pedidos)', () => {
  let adminToken;
  let meseroToken;
  let cocineroToken;
  let clienteToken;

  beforeEach(() => {
    vi.clearAllMocks();
    adminToken = jwt.sign({ id: 99, rol: 'admin' }, JWT_SECRET);
    meseroToken = jwt.sign({ id: 1, rol: 'mesero' }, JWT_SECRET);
    cocineroToken = jwt.sign({ id: 2, rol: 'cocinero' }, JWT_SECRET);
    clienteToken = jwt.sign({ id: 3, rol: 'cliente' }, JWT_SECRET);
  });

  describe('GET /api/v1/pedidos/stats', () => {
    it('debe obtener las estadísticas de pedidos para usuarios autorizados', async () => {
      const mockRawItem = {
        estado: 'solicitado',
        modalidad: 'presencial',
        getDataValue: () => 5
      };
      Pedido.findAll.mockImplementation(async () => [mockRawItem]);
      Pedido.count.mockImplementation(async () => 10);
      Pago.sum.mockImplementation(async () => 150.0);
      Cliente.count.mockImplementation(async () => 20);
      DetallePedido.findAll.mockImplementation(async () => []);

      const res = await request(app)
        .get('/api/v1/pedidos/stats')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();
    });

    it('debe denegar el acceso a stats para un cocinero (403)', async () => {
      const res = await request(app)
        .get('/api/v1/pedidos/stats')
        .set('Authorization', `Bearer ${cocineroToken}`);

      expect(res.status).toBe(403);
    });
  });

  describe('GET /api/v1/pedidos', () => {
    it('debe obtener el listado de pedidos', async () => {
      Pedido.findAll.mockImplementation(async () => [
        { id: 1, numero_pedido: 'PED-001', estado: 'solicitado' }
      ]);

      const res = await request(app)
        .get('/api/v1/pedidos')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(1);
    });
  });

  describe('GET /api/v1/pedidos/:id', () => {
    it('debe obtener un pedido por ID', async () => {
      Pedido.findByPk.mockImplementation(async () => ({ id: 1, numero_pedido: 'PED-001' }));

      const res = await request(app)
        .get('/api/v1/pedidos/1')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('debe responder 404 si el pedido no existe', async () => {
      Pedido.findByPk.mockImplementation(async () => null);

      const res = await request(app)
        .get('/api/v1/pedidos/999')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(404);
    });
  });

  describe('POST /api/v1/pedidos', () => {
    it('debe crear un pedido exitosamente con sus detalles', async () => {
      Cliente.findByPk.mockImplementation(async () => ({ id: 3, nombres: 'Ana' }));
      Producto.findByPk.mockImplementation(async () => ({ id: 10, nombre: 'Pizza', precio: 10.0, estado: 'disponible', cantidad_disponible: 20, update: vi.fn() }));

      const mockNuevoPedido = {
        id: 1,
        numero_pedido: 'PED-100',
        valor_total: 20.0,
        estado: 'solicitado',
        update: vi.fn().mockResolvedValue(true)
      };

      Pedido.create.mockImplementation(async () => mockNuevoPedido);
      DetallePedido.create.mockImplementation(async () => ({ id: 1 }));
      Pedido.findByPk.mockImplementation(async () => mockNuevoPedido);

      const res = await request(app)
        .post('/api/v1/pedidos')
        .set('Authorization', `Bearer ${clienteToken}`)
        .send({
          fecha: '2026-08-07',
          hora: '12:30',
          modalidad: 'presencial',
          cliente_id: 3,
          detalles: [{ producto_id: 10, cantidad: 2 }]
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
    });

    it('debe denegar la creación de pedidos si el usuario es cocinero (403)', async () => {
      const res = await request(app)
        .post('/api/v1/pedidos')
        .set('Authorization', `Bearer ${cocineroToken}`)
        .send({ detalles: [] });

      expect(res.status).toBe(403);
    });
  });

  describe('PUT /api/v1/pedidos/:id', () => {
    it('debe actualizar el estado del pedido', async () => {
      Empleado.findByPk.mockImplementation(async () => ({ id: 1, nombres: 'Juan' }));
      const mockPedido = {
        id: 1,
        estado: 'solicitado',
        empleado_id: 1,
        update: vi.fn().mockResolvedValue(true)
      };
      Pedido.findByPk.mockImplementation(async () => mockPedido);

      const res = await request(app)
        .put('/api/v1/pedidos/1')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ estado: 'en preparación', empleado_id: 1 });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('debe rechazar la cancelación de pedido si la realiza un cocinero (403)', async () => {
      const mockPedido = {
        id: 1,
        estado: 'en preparación',
        update: vi.fn()
      };
      Pedido.findByPk.mockImplementation(async () => mockPedido);

      const res = await request(app)
        .put('/api/v1/pedidos/1')
        .set('Authorization', `Bearer ${cocineroToken}`)
        .send({ estado: 'cancelado' });

      expect(res.status).toBe(403);
    });
  });

  describe('DELETE /api/v1/pedidos/:id', () => {
    it('debe eliminar un pedido si el usuario es admin', async () => {
      const mockPedido = {
        id: 1,
        estado: 'solicitado',
        detalles: [],
        destroy: vi.fn().mockResolvedValue(true)
      };
      Pedido.findByPk.mockImplementation(async () => mockPedido);

      const res = await request(app)
        .delete('/api/v1/pedidos/1')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });
});
