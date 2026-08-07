import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../../src/app.js';
import { Cliente } from '../../src/models/index.js';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'jwt_secret_resto_logrod_2026';

vi.mock('../../src/models/index.js', () => ({
  Cliente: {
    findAll: vi.fn(),
    findByPk: vi.fn(),
    findOne: vi.fn(),
    create: vi.fn()
  },
  Empleado: { findOne: vi.fn() },
  Categoria: { findAll: vi.fn() },
  Producto: { findAll: vi.fn() },
  Pedido: { findAll: vi.fn() },
  DetallePedido: { findAll: vi.fn() },
  Pago: { findAll: vi.fn() }
}));

describe('Cliente Routes (/api/v1/clientes)', () => {
  let adminToken;
  let cliente1Token;
  let cliente2Token;

  beforeEach(() => {
    vi.clearAllMocks();
    adminToken = jwt.sign({ id: 99, rol: 'admin' }, JWT_SECRET);
    cliente1Token = jwt.sign({ id: 1, rol: 'cliente' }, JWT_SECRET);
    cliente2Token = jwt.sign({ id: 2, rol: 'cliente' }, JWT_SECRET);
  });

  describe('POST /api/v1/clientes', () => {
    it('debe registrar un cliente nuevo', async () => {
      const mockNuevo = {
        id: 1,
        identificacion: '1234567890',
        nombres: 'María',
        apellidos: 'López',
        correo_electronico: 'maria@test.com',
        tipo_cliente: 'Estudiante',
        toJSON: () => ({ id: 1, nombres: 'María' })
      };
      Cliente.create.mockImplementationOnce(async () => mockNuevo);

      const res = await request(app)
        .post('/api/v1/clientes')
        .send({
          identificacion: '1234567890',
          nombres: 'María',
          apellidos: 'López',
          correo_electronico: 'maria@test.com',
          tipo_cliente: 'Estudiante',
          contrasenia: 'Password123!'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
    });

    it('debe responder 400 si la identificación o correo ya existen', async () => {
      Cliente.create.mockRejectedValueOnce({
        name: 'SequelizeUniqueConstraintError',
        errors: [{ message: 'El correo electrónico ya existe' }]
      });

      const res = await request(app)
        .post('/api/v1/clientes')
        .send({
          identificacion: '1234567890',
          nombres: 'María',
          apellidos: 'López',
          correo_electronico: 'existente@test.com',
          tipo_cliente: 'Estudiante',
          contrasenia: 'Password123!'
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/clientes', () => {
    it('debe obtener todos los clientes si el rol es admin o empleado', async () => {
      Cliente.findAll.mockImplementationOnce(async () => [{ id: 1, nombres: 'María' }]);

      const res = await request(app)
        .get('/api/v1/clientes')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('GET /api/v1/clientes/:id', () => {
    it('debe permitir a un cliente ver su propio perfil', async () => {
      const mockUser = {
        id: 1,
        nombres: 'María',
        toJSON: () => ({ id: 1, nombres: 'María' })
      };
      Cliente.findByPk.mockImplementationOnce(async () => mockUser);

      const res = await request(app)
        .get('/api/v1/clientes/1')
        .set('Authorization', `Bearer ${cliente1Token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('PUT /api/v1/clientes/:id', () => {
    it('debe actualizar los datos del cliente propio', async () => {
      const mockUser = {
        id: 1,
        nombres: 'María',
        update: vi.fn().mockResolvedValue(true),
        toJSON: () => ({ id: 1, nombres: 'María Actualizada' })
      };
      Cliente.findByPk.mockImplementationOnce(async () => mockUser);

      const res = await request(app)
        .put('/api/v1/clientes/1')
        .set('Authorization', `Bearer ${cliente1Token}`)
        .send({ nombres: 'María Actualizada' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('debe rechazar si un cliente intenta modificar el perfil de otro cliente (403)', async () => {
      const res = await request(app)
        .put('/api/v1/clientes/1')
        .set('Authorization', `Bearer ${cliente2Token}`)
        .send({ nombres: 'Intento Hack' });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });
  });

  describe('DELETE /api/v1/clientes/:id', () => {
    it('debe eliminar un cliente si el usuario es admin', async () => {
      const mockUser = {
        id: 1,
        destroy: vi.fn().mockResolvedValue(true)
      };
      Cliente.findByPk.mockImplementationOnce(async () => mockUser);

      const res = await request(app)
        .delete('/api/v1/clientes/1')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });
});
