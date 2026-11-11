import rateLimit from 'express-rate-limit';
import { config } from '../config/env.js';

const QUINCE_MINUTOS = 15 * 60 * 1000;

const correoDe = (req) => String(req.body?.email ?? '').trim().toLowerCase();

/**
 * Limita intentos en /auth. La clave combina IP y correo para no bloquear
 * a todo el campus (muchos usuarios salen por la misma IP) y, a la vez,
 * frenar ataques contra una cuenta concreta.
 */
export const createAuthLimiter = ({
  max,
  windowMs = QUINCE_MINUTOS,
  porCorreo = false,
  habilitado = config.rateLimitEnabled
}) =>
  rateLimit({
    windowMs,
    limit: max,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    keyGenerator: (req) => (porCorreo ? correoDe(req) || req.ip : `${req.ip}|${correoDe(req)}`),
    skip: () => !habilitado,
    handler: (req, res) =>
      res.status(429).json({
        success: false,
        message: 'Demasiados intentos. Espera unos minutos e inténtalo de nuevo.'
      })
  });

// Login: por IP + correo.
export const loginLimiter = createAuthLimiter({ max: 10 });
// Solicitar OTP: por correo (evita llenar de correos a alguien).
export const forgotPasswordLimiter = createAuthLimiter({ max: 5, porCorreo: true });
// Usar OTP: por correo. Además, el OTP se invalida tras 5 intentos fallidos.
export const resetPasswordLimiter = createAuthLimiter({ max: 10, porCorreo: true });
