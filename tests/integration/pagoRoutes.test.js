import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../../src/app.js';
import { Pago, Pedido } from '../../src/models/index.js';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'jwt_secret_resto_logrod_2026';

vi.mock('../../src/models/index.js', () => {
  return {
    sequelize: {
      transaction: vi.fn().mockResolvedValue({
        commit: vi.fn().mockResolvedValue(true),
        rollback: vi.fn().mockResolvedValue(true)
      })
    },
    Pago: {
      findAll: vi.fn(),
      findByPk: vi.fn(),
      findOne: vi.fn(),
      create: vi.fn()
    },
    Pedido: {
      findByPk: vi.fn()
    },
    Cliente: { findOne: vi.fn() },
    Empleado: { findOne: vi.fn() },
    Categoria: { findAll: vi.fn() },
    Producto: { findAll: vi.fn() },
    DetallePedido: { findAll: vi.fn() }
  };
});

describe('Pago Routes (/api/v1/pagos)', () => {
  let adminToken;
  let cajeroToken;

  beforeEach(() => {
    vi.clearAllMocks();
    adminToken = jwt.sign({ id: 99, rol: 'admin' }, JWT_SECRET);
    cajeroToken = jwt.sign({ id: 10, rol: 'cajero' }, JWT_SECRET);
  });

  describe('GET /api/v1/pagos', () => {
    it('debe obtener la lista de pagos para usuarios autorizados', async () => {
      Pago.findAll.mockImplementation(async () => [
        { id: 1, valor: 15.5, metodo_pago: 'efectivo', estado: 'aprobado' }
      ]);

      const res = await request(app)
        .get('/api/v1/pagos')
        .set('Authorization', `Bearer ${cajeroToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(1);
    });
  });

  describe('GET /api/v1/pagos/:id', () => {
    it('debe obtener un pago por ID', async () => {
      Pago.findByPk.mockImplementation(async () => ({ id: 1, valor: 15.5 }));

      const res = await request(app)
        .get('/api/v1/pagos/1')
        .set('Authorization', `Bearer ${cajeroToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('debe responder 404 si el pago no existe', async () => {
      Pago.findByPk.mockImplementation(async () => null);

      const res = await request(app)
        .get('/api/v1/pagos/999')
        .set('Authorization', `Bearer ${cajeroToken}`);

      expect(res.status).toBe(404);
    });
  });

  describe('POST /api/v1/pagos', () => {
    it('debe registrar un pago válidamente', async () => {
      const mockPedido = {
        id: 1,
        valor_total: 15.5,
        estado: 'confirmado',
        update: vi.fn().mockResolvedValue(true)
      };

      const mockPago = {
        id: 1,
        pedido_id: 1,
        fecha: '2026-08-07',
        valor: 15.5,
        metodo_pago: 'efectivo',
        estado: 'aprobado'
      };

      Pedido.findByPk.mockImplementation(async () => mockPedido);
      Pago.findOne.mockImplementation(async () => null);
      Pago.create.mockImplementation(async () => mockPago);

      const res = await request(app)
        .post('/api/v1/pagos')
        .set('Authorization', `Bearer ${cajeroToken}`)
        .send({
          pedido_id: 1,
          fecha: '2026-08-07',
          valor: 15.5,
          metodo_pago: 'efectivo',
          estado: 'aprobado'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
    });
  });

  describe('DELETE /api/v1/pagos/:id', () => {
    it('debe eliminar un pago si el usuario es admin', async () => {
      const mockPago = {
        id: 1,
        destroy: vi.fn().mockResolvedValue(true)
      };
      Pago.findByPk.mockImplementation(async () => mockPago);

      const res = await request(app)
        .delete('/api/v1/pagos/1')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });
});
