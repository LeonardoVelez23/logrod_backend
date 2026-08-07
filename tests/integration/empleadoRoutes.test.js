import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../../src/app.js';
import { Empleado } from '../../src/models/index.js';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'jwt_secret_resto_logrod_2026';

vi.mock('../../src/models/index.js', () => ({
  Empleado: {
    findAll: vi.fn(),
    findByPk: vi.fn(),
    findOne: vi.fn(),
    create: vi.fn()
  },
  Cliente: { findOne: vi.fn() },
  Categoria: { findAll: vi.fn() },
  Producto: { findAll: vi.fn() },
  Pedido: { findAll: vi.fn() },
  DetallePedido: { findAll: vi.fn() },
  Pago: { findAll: vi.fn() }
}));

describe('Empleado Routes (/api/v1/empleados)', () => {
  let adminToken;
  let empleado1Token;
  let empleado2Token;

  beforeEach(() => {
    vi.clearAllMocks();
    adminToken = jwt.sign({ id: 99, rol: 'admin' }, JWT_SECRET);
    empleado1Token = jwt.sign({ id: 1, rol: 'mesero' }, JWT_SECRET);
    empleado2Token = jwt.sign({ id: 2, rol: 'cocinero' }, JWT_SECRET);
  });

  describe('GET /api/v1/empleados', () => {
    it('debe obtener la lista de empleados si el usuario es admin', async () => {
      Empleado.findAll.mockResolvedValue([
        { id: 1, nombres: 'Carlos', cargo: 'Mesero' }
      ]);

      const res = await request(app)
        .get('/api/v1/empleados')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('debe denegar el acceso a un mesero para listar todos los empleados (403)', async () => {
      const res = await request(app)
        .get('/api/v1/empleados')
        .set('Authorization', `Bearer ${empleado1Token}`);

      expect(res.status).toBe(403);
    });
  });

  describe('POST /api/v1/empleados', () => {
    it('debe crear un nuevo empleado si el usuario es admin', async () => {
      Empleado.findOne.mockResolvedValue(null);
      const mockNuevo = {
        id: 3,
        identificacion: '0987654321',
        nombres: 'Pedro',
        cargo: 'Cajero',
        toJSON: () => ({ id: 3, nombres: 'Pedro', cargo: 'Cajero' })
      };
      Empleado.create.mockResolvedValue(mockNuevo);

      const res = await request(app)
        .post('/api/v1/empleados')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          identificacion: '0987654321',
          nombres: 'Pedro',
          apellidos: 'Ramírez',
          correo_electronico: 'pedro@test.com',
          contrasenia: 'Password123!',
          cargo: 'Cajero'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
    });
  });

  describe('GET /api/v1/empleados/:id', () => {
    it('debe permitir a un empleado consultar su propio perfil', async () => {
      const mockEmp = {
        id: 1,
        nombres: 'Carlos',
        toJSON: () => ({ id: 1, nombres: 'Carlos' })
      };
      Empleado.findByPk.mockResolvedValue(mockEmp);

      const res = await request(app)
        .get('/api/v1/empleados/1')
        .set('Authorization', `Bearer ${empleado1Token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('PUT /api/v1/empleados/:id', () => {
    it('debe actualizar los datos del empleado', async () => {
      const mockEmp = {
        id: 1,
        nombres: 'Carlos',
        update: vi.fn().mockResolvedValue(true),
        toJSON: () => ({ id: 1, nombres: 'Carlos Actualizado' })
      };
      Empleado.findByPk.mockResolvedValue(mockEmp);

      const res = await request(app)
        .put('/api/v1/empleados/1')
        .set('Authorization', `Bearer ${empleado1Token}`)
        .send({ nombres: 'Carlos Actualizado' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('DELETE /api/v1/empleados/:id', () => {
    it('debe eliminar un empleado si el usuario es admin', async () => {
      const mockEmp = {
        id: 1,
        destroy: vi.fn().mockResolvedValue(true)
      };
      Empleado.findByPk.mockResolvedValue(mockEmp);

      const res = await request(app)
        .delete('/api/v1/empleados/1')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });
});
