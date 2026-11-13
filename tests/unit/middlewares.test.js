import { describe, it, expect, vi } from 'vitest';
import jwt from 'jsonwebtoken';
import { verifyToken, restrictTo } from '../../src/middlewares/authMiddleware.js';
import { notFoundHandler } from '../../src/middlewares/notFoundHandler.js';
import { errorHandler } from '../../src/middlewares/errorHandler.js';

// verifyToken consulta el rol vigente en la base; aquí se simula.
vi.mock('../../src/services/sesionService.js', () => ({
  rolVigente: vi.fn(async ({ rol }) => rol)
}));

const JWT_SECRET = process.env.JWT_SECRET || 'jwt_secret_resto_logrod_2026';

describe('authMiddleware', () => {
  describe('verifyToken', () => {
    it('debe responder 401 si no se proporciona el encabezado Authorization', async () => {
      const req = { headers: {} };
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn()
      };
      const next = vi.fn();

      await verifyToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        message: 'Acceso no autorizado. Token no proporcionado.'
      }));
      expect(next).not.toHaveBeenCalled();
    });

    it('debe responder 401 si el encabezado no empieza por Bearer', async () => {
      const req = { headers: { authorization: 'Basic 123456' } };
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn()
      };
      const next = vi.fn();

      await verifyToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false
      }));
    });

    it('debe procesar req.user y llamar a next() si el token es válido', async () => {
      const payload = { id: 1, rol: 'admin' };
      const token = jwt.sign(payload, JWT_SECRET);

      const req = { headers: { authorization: `Bearer ${token}` } };
      const res = {};
      const next = vi.fn();

      await verifyToken(req, res, next);

      expect(req.user).toBeDefined();
      expect(req.user.id).toBe(1);
      expect(req.user.rol).toBe('admin');
      expect(next).toHaveBeenCalled();
    });

    it('debe responder 401 si el token es inválido o expirado', async () => {
      const req = { headers: { authorization: 'Bearer token_invalido_123' } };
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn()
      };
      const next = vi.fn();

      await verifyToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        message: 'Token inválido o expirado'
      }));
    });
  });

  describe('restrictTo', () => {
    it('debe responder 403 si req.user no existe o no tiene un rol permitido', () => {
      const middleware = restrictTo('admin');
      const req = { user: { rol: 'cliente' } };
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn()
      };
      const next = vi.fn();

      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        message: 'No tiene permisos para realizar esta acción'
      }));
      expect(next).not.toHaveBeenCalled();
    });

    it('debe llamar a next() si el rol del usuario está permitido', () => {
      const middleware = restrictTo('admin', 'cajero');
      const req = { user: { rol: 'cajero' } };
      const res = {};
      const next = vi.fn();

      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });
  });
});

describe('notFoundHandler', () => {
  it('debe devolver 404 con el mensaje de ruta no encontrada', () => {
    const req = { originalUrl: '/api/v1/ruta-inexistente' };
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn()
    };

    notFoundHandler(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Ruta no encontrada - /api/v1/ruta-inexistente'
    });
  });
});

describe('errorHandler', () => {
  it('debe responder con el statusCode indicado en err.statusCode', () => {
    const err = { statusCode: 400, message: 'Bad request test', expose: true };
    const req = {};
    const res = {
      statusCode: 400,
      status: vi.fn().mockReturnThis(),
      json: vi.fn()
    };

    errorHandler(err, req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: false,
      message: 'Bad request test'
    }));
  });

  it('debe responder 500 sin exponer el mensaje interno si no hay statusCode', () => {
    const err = new Error('Database connection error');
    const req = {};
    const res = {
      statusCode: 200,
      status: vi.fn().mockReturnThis(),
      json: vi.fn()
    };

    errorHandler(err, req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: false,
      message: 'Error interno del servidor'
    }));
  });
});
