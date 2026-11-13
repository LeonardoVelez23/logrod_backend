import { execFileSync } from 'node:child_process';
import express from 'express';
import jwt from 'jsonwebtoken';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createAuthLimiter } from '../src/middlewares/rateLimiter.js';
import { api, auth } from './helpers.js';

describe('JWT', () => {
  it('rechaza tokens firmados con el antiguo secreto por defecto', async () => {
    const falso = jwt.sign({ id: 1, rol: 'admin' }, 'jwt_secret_resto_logrod_2026');

    const res = await api().get('/api/v1/empleados').set(auth(falso));

    expect(res.status).toBe(401);
  });

  it('el servidor no arranca sin JWT_SECRET', () => {
    const arrancar = () =>
      execFileSync(process.execPath, ['-e', "import('./src/config/env.js')"], {
        env: { ...process.env, JWT_SECRET: '' },
        stdio: 'pipe'
      });

    expect(arrancar).toThrow(/JWT_SECRET/);
  });
});

describe('Límite de intentos', () => {
  const appCon = (opciones) => {
    const app = express();
    app.use(express.json());
    app.post('/login', createAuthLimiter({ habilitado: true, ...opciones }), (req, res) =>
      res.json({ success: true })
    );
    return app;
  };

  it('responde 429 al superar el máximo para el mismo correo', async () => {
    const app = appCon({ max: 2 });
    const intento = () => request(app).post('/login').send({ email: 'ana@prueba.test' });

    expect((await intento()).status).toBe(200);
    expect((await intento()).status).toBe(200);
    const bloqueado = await intento();
    expect(bloqueado.status).toBe(429);
    expect(bloqueado.body.success).toBe(false);
  });

  it('el bloqueo de un correo no afecta a otro usuario de la misma IP', async () => {
    const app = appCon({ max: 1 });

    await request(app).post('/login').send({ email: 'ana@prueba.test' });
    const ana = await request(app).post('/login').send({ email: 'ana@prueba.test' });
    const beto = await request(app).post('/login').send({ email: 'beto@prueba.test' });

    expect(ana.status).toBe(429);
    expect(beto.status).toBe(200);
  });
});
