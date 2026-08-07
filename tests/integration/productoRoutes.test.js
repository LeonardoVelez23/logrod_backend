import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../../src/app.js';
import { Producto, Categoria } from '../../src/models/index.js';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'jwt_secret_resto_logrod_2026';

vi.mock('../../src/models/index.js', () => ({
  Producto: {
    findAll: vi.fn(),
    findByPk: vi.fn(),
    create: vi.fn()
  },
  Categoria: { findByPk: vi.fn() },
  Cliente: { findOne: vi.fn() },
  Empleado: { findOne: vi.fn() },
  Pedido: { findAll: vi.fn() },
  DetallePedido: { findAll: vi.fn() },
  Pago: { findAll: vi.fn() }
}));

describe('Producto Routes (/api/v1/productos)', () => {
  let adminToken;
  let clienteToken;

  beforeEach(() => {
    vi.clearAllMocks();
    adminToken = jwt.sign({ id: 1, rol: 'admin' }, JWT_SECRET);
    clienteToken = jwt.sign({ id: 2, rol: 'cliente' }, JWT_SECRET);
  });

  describe('GET /api/v1/productos', () => {
    it('debe obtener la lista de productos públicos', async () => {
      const mockProds = [
        { id: 1, nombre: 'Pizza Hawaiana', precio: 8.5, estado: 'disponible' }
      ];
      Producto.findAll.mockResolvedValue(mockProds);

      const res = await request(app).get('/api/v1/productos');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(1);
    });
  });

  describe('GET /api/v1/productos/:id', () => {
    it('debe obtener un producto por ID', async () => {
      const mockProd = { id: 1, nombre: 'Hamburguesa', precio: 5.0 };
      Producto.findByPk.mockResolvedValue(mockProd);

      const res = await request(app).get('/api/v1/productos/1');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('debe responder 404 si el producto no existe', async () => {
      Producto.findByPk.mockResolvedValue(null);

      const res = await request(app).get('/api/v1/productos/999');

      expect(res.status).toBe(404);
    });
  });

  describe('POST /api/v1/productos', () => {
    it('debe crear un producto si el usuario es admin', async () => {
      Categoria.findByPk.mockResolvedValue({ id: 1, nombre: 'Comida' });
      const mockProd = { id: 2, codigo: 'PROD-001', nombre: 'Taco', precio: 2.5, categoria_id: 1 };
      Producto.create.mockResolvedValue(mockProd);

      const res = await request(app)
        .post('/api/v1/productos')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          codigo: 'PROD-001',
          nombre: 'Taco',
          precio: 2.5,
          categoria_id: 1
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
    });

    it('debe rechazar la creación si el usuario es cliente (403)', async () => {
      const res = await request(app)
        .post('/api/v1/productos')
        .set('Authorization', `Bearer ${clienteToken}`)
        .send({ codigo: 'PROD-002', nombre: 'Taco', precio: 2.5 });

      expect(res.status).toBe(403);
    });
  });

  describe('PUT /api/v1/productos/:id', () => {
    it('debe actualizar un producto existente', async () => {
      const mockProd = {
        id: 1,
        nombre: 'Hamburguesa',
        update: vi.fn().mockResolvedValue(true)
      };
      Producto.findByPk.mockResolvedValue(mockProd);

      const res = await request(app)
        .put('/api/v1/productos/1')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ precio: 6.0 });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('DELETE /api/v1/productos/:id', () => {
    it('debe eliminar un producto si el usuario es admin', async () => {
      const mockProd = {
        id: 1,
        destroy: vi.fn().mockResolvedValue(true)
      };
      Producto.findByPk.mockResolvedValue(mockProd);

      const res = await request(app)
        .delete('/api/v1/productos/1')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });
});
