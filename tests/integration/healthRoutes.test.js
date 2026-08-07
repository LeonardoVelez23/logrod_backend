import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import app from '../../src/app.js';

vi.mock('../../src/models/index.js', () => ({
  Cliente: { findOne: vi.fn() },
  Empleado: { findOne: vi.fn() },
  Categoria: { findAll: vi.fn() },
  Producto: { findAll: vi.fn() },
  Pedido: { findAll: vi.fn() },
  DetallePedido: { findAll: vi.fn() },
  Pago: { findAll: vi.fn() }
}));

describe('Health & Error Handling Routes', () => {
  it('GET /api/v1/health debe responder status 200 OK', async () => {
    const res = await request(app).get('/api/v1/health');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toContain('Backend API operando correctamente');
  });

  it('debe responder 404 para rutas inexistentes', async () => {
    const res = await request(app).get('/api/v1/ruta-no-existe-xyz');
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('Ruta no encontrada');
  });
});
