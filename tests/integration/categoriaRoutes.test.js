import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../../src/app.js';
import { Categoria } from '../../src/models/index.js';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'jwt_secret_resto_logrod_2026';

vi.mock('../../src/models/index.js', () => ({
  Categoria: {
    findAll: vi.fn(),
    findByPk: vi.fn(),
    create: vi.fn(),
    update: vi.fn()
  },
  Cliente: { findOne: vi.fn() },
  Empleado: { findOne: vi.fn() },
  Producto: { findAll: vi.fn() },
  Pedido: { findAll: vi.fn() },
  DetallePedido: { findAll: vi.fn() },
  Pago: { findAll: vi.fn() }
}));

describe('Categoria Routes (/api/v1/categorias)', () => {
  let adminToken;
  let clienteToken;

  beforeEach(() => {
    vi.clearAllMocks();
    adminToken = jwt.sign({ id: 1, rol: 'admin' }, JWT_SECRET);
    clienteToken = jwt.sign({ id: 2, rol: 'cliente' }, JWT_SECRET);
  });

  describe('GET /api/v1/categorias', () => {
    it('debe obtener la lista de categorías', async () => {
      const mockCategorias = [
        { id: 1, nombre: 'Bebidas' },
        { id: 2, nombre: 'Platos Fuertes' }
      ];
      Categoria.findAll.mockResolvedValue(mockCategorias);

      const res = await request(app).get('/api/v1/categorias');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(2);
    });
  });

  describe('GET /api/v1/categorias/:id', () => {
    it('debe obtener una categoría por ID', async () => {
      const mockCat = { id: 1, nombre: 'Bebidas' };
      Categoria.findByPk.mockResolvedValue(mockCat);

      const res = await request(app).get('/api/v1/categorias/1');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.nombre).toBe('Bebidas');
    });

    it('debe responder 404 si la categoría no existe', async () => {
      Categoria.findByPk.mockResolvedValue(null);

      const res = await request(app).get('/api/v1/categorias/999');

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/v1/categorias', () => {
    it('debe crear una categoría si el usuario es admin', async () => {
      const mockNueva = { id: 3, nombre: 'Postres', descripcion: 'Dulces deliciosos' };
      Categoria.create.mockResolvedValue(mockNueva);

      const res = await request(app)
        .post('/api/v1/categorias')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ nombre: 'Postres', descripcion: 'Dulces deliciosos' });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.nombre).toBe('Postres');
    });

    it('debe rechazar la creación si el usuario es cliente (403 Forbidden)', async () => {
      const res = await request(app)
        .post('/api/v1/categorias')
        .set('Authorization', `Bearer ${clienteToken}`)
        .send({ nombre: 'Entradas' });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });
  });

  describe('PUT /api/v1/categorias/:id', () => {
    it('debe actualizar una categoría si existe', async () => {
      const mockCat = {
        id: 1,
        nombre: 'Bebidas',
        update: vi.fn().mockResolvedValue(true)
      };
      Categoria.findByPk.mockResolvedValue(mockCat);

      const res = await request(app)
        .put('/api/v1/categorias/1')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ nombre: 'Bebidas Frías' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(mockCat.update).toHaveBeenCalled();
    });
  });

  describe('DELETE /api/v1/categorias/:id', () => {
    it('debe eliminar una categoría si el usuario es admin', async () => {
      const mockCat = {
        id: 1,
        destroy: vi.fn().mockResolvedValue(true)
      };
      Categoria.findByPk.mockResolvedValue(mockCat);

      const res = await request(app)
        .delete('/api/v1/categorias/1')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(mockCat.destroy).toHaveBeenCalled();
    });
  });
});
