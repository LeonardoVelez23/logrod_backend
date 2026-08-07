import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../../src/app.js';
import { Cliente, Empleado } from '../../src/models/index.js';
import * as emailService from '../../src/services/emailService.js';
import bcrypt from 'bcryptjs';

vi.mock('../../src/models/index.js', () => {
  return {
    Cliente: {
      findOne: vi.fn(),
      create: vi.fn(),
      findAll: vi.fn(),
      findByPk: vi.fn()
    },
    Empleado: {
      findOne: vi.fn(),
      create: vi.fn(),
      findAll: vi.fn(),
      findByPk: vi.fn()
    },
    Categoria: { findAll: vi.fn(), findByPk: vi.fn() },
    Producto: { findAll: vi.fn(), findByPk: vi.fn() },
    Pedido: { findAll: vi.fn(), findByPk: vi.fn() },
    DetallePedido: { findAll: vi.fn() },
    Pago: { findAll: vi.fn() }
  };
});

vi.mock('../../src/services/emailService.js', () => ({
  sendPasswordResetEmail: vi.fn().mockResolvedValue({ success: true })
}));

describe('Auth Routes (/api/v1/auth)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    emailService.sendPasswordResetEmail.mockResolvedValue({ success: true });
  });

  describe('POST /api/v1/auth/login', () => {
    it('debe responder 400 si faltan correo o contraseña', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: '' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('debe permitir inicio de sesión exitoso para un cliente', async () => {
      const hashedPassword = await bcrypt.hash('Password123!', 10);
      const mockUser = {
        id: 1,
        identificacion: '1234567890',
        nombres: 'Juan',
        apellidos: 'Pérez',
        correo_electronico: 'juan@test.com',
        contrasenia: hashedPassword,
        toJSON: () => ({ id: 1, nombres: 'Juan', apellidos: 'Pérez', correo_electronico: 'juan@test.com' })
      };

      Cliente.findOne.mockImplementation(async () => mockUser);
      Empleado.findOne.mockImplementation(async () => null);

      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'juan@test.com', password: 'Password123!' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.token).toBeDefined();
      expect(res.body.user.rol).toBe('cliente');
    });

    it('debe permitir inicio de sesión exitoso para un empleado admin', async () => {
      const hashedPassword = await bcrypt.hash('AdminPass123!', 10);
      const mockUser = {
        id: 2,
        identificacion: '0987654321',
        nombres: 'Carlos',
        apellidos: 'Admin',
        correo_electronico: 'admin@test.com',
        cargo: 'Admin',
        contrasenia: hashedPassword,
        toJSON: () => ({ id: 2, nombres: 'Carlos', cargo: 'Admin' })
      };

      Cliente.findOne.mockImplementation(async () => null);
      Empleado.findOne.mockImplementation(async () => mockUser);

      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'admin@test.com', password: 'AdminPass123!' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.user.rol).toBe('admin');
    });

    it('debe mapear correctamente otros cargos de empleados (mesero, cajero, cocinero)', async () => {
      const hashedPassword = await bcrypt.hash('Pass123!', 10);
      const mockMesero = {
        id: 3,
        correo_electronico: 'mesero@test.com',
        cargo: 'mesero',
        contrasenia: hashedPassword,
        toJSON: () => ({ id: 3, cargo: 'mesero' })
      };

      Cliente.findOne.mockImplementation(async () => null);
      Empleado.findOne.mockImplementation(async () => mockMesero);

      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'mesero@test.com', password: 'Pass123!' });

      expect(res.status).toBe(200);
      expect(res.body.user.rol).toBe('mesero');
    });

    it('debe responder 401 si las credenciales son incorrectas', async () => {
      Cliente.findOne.mockImplementation(async () => null);
      Empleado.findOne.mockImplementation(async () => null);

      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'desconocido@test.com', password: 'WrongPassword123!' });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Credenciales inválidas');
    });
  });

  describe('POST /api/v1/auth/forgot-password', () => {
    it('debe responder 400 si no se proporciona el correo', async () => {
      const res = await request(app)
        .post('/api/v1/auth/forgot-password')
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('debe responder 404 si el correo no está registrado', async () => {
      Cliente.findOne.mockImplementation(async () => null);
      Empleado.findOne.mockImplementation(async () => null);

      const res = await request(app)
        .post('/api/v1/auth/forgot-password')
        .send({ email: 'noexiste@espam.edu.ec' });

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('no se encuentra registrado');
    });

    it('debe enviar el OTP si el usuario existe', async () => {
      const mockUser = {
        id: 1,
        correo_electronico: 'cliente@espam.edu.ec',
        nombres: 'Ana',
        apellidos: 'García',
        reset_password_token: null,
        reset_password_expires: null,
        update: vi.fn().mockResolvedValue(true)
      };

      Cliente.findOne.mockImplementation(async () => mockUser);
      Empleado.findOne.mockImplementation(async () => null);

      const res = await request(app)
        .post('/api/v1/auth/forgot-password')
        .send({ email: 'cliente@espam.edu.ec' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(mockUser.update).toHaveBeenCalled();
    });

    it('debe responder 500 si falla el servicio de correo', async () => {
      const mockUser = {
        id: 1,
        correo_electronico: 'cliente@espam.edu.ec',
        nombres: 'Ana',
        apellidos: 'García',
        update: vi.fn().mockResolvedValue(true)
      };

      Cliente.findOne.mockImplementation(async () => mockUser);
      Empleado.findOne.mockImplementation(async () => null);
      emailService.sendPasswordResetEmail.mockRejectedValueOnce(new Error('Brevo service down'));

      const res = await request(app)
        .post('/api/v1/auth/forgot-password')
        .send({ email: 'cliente@espam.edu.ec' });

      expect(res.status).toBe(500);
      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/v1/auth/reset-password', () => {
    it('debe validar requerimientos de contraseña (mayúscula, número, especial, min 8)', async () => {
      const res = await request(app)
        .post('/api/v1/auth/reset-password')
        .send({ email: 'user@test.com', otp: '123456', newPassword: 'simple' });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('8 caracteres');
    });

    it('debe responder 400 si el OTP es inválido o ha expirado', async () => {
      Cliente.findOne.mockImplementation(async () => null);
      Empleado.findOne.mockImplementation(async () => null);

      const res = await request(app)
        .post('/api/v1/auth/reset-password')
        .send({ email: 'user@test.com', otp: '000000', newPassword: 'Password123!' });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('incorrecto o ha expirado');
    });

    it('debe restablecer la contraseña exitosamente si el OTP es válido', async () => {
      const mockUser = {
        id: 1,
        correo_electronico: 'user@test.com',
        update: vi.fn().mockResolvedValue(true)
      };

      Cliente.findOne.mockImplementation(async () => mockUser);
      Empleado.findOne.mockImplementation(async () => null);

      const res = await request(app)
        .post('/api/v1/auth/reset-password')
        .send({ email: 'user@test.com', otp: '123456', newPassword: 'NewPassword123!' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(mockUser.update).toHaveBeenCalled();
    });
  });
});
