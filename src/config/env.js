import dotenv from 'dotenv';

dotenv.config();

// Sin secreto propio cualquiera podría firmar tokens válidos (p. ej. de admin).
if (!process.env.JWT_SECRET) {
  throw new Error(
    'JWT_SECRET no está definido. Agrégalo al .env (ver .env.example) o a las variables del servidor.'
  );
}

export const config = {
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  corsOrigin: process.env.CORS_ORIGIN || '*',
  databaseUrl: process.env.DATABASE_URL,
  jwtSecret: process.env.JWT_SECRET,
  // Límite de peticiones en /auth. Solo se desactiva en los tests.
  rateLimitEnabled: process.env.RATE_LIMIT_ENABLED !== 'false',
  // Zona horaria del restaurante: fecha y hora de los pedidos.
  zonaHoraria: process.env.APP_TIMEZONE || 'America/Guayaquil',
  brevoApiKey: process.env.BREVO_API_KEY || '',
  smtpHost: process.env.SMTP_HOST || 'smtp-relay.brevo.com',
  smtpPort: parseInt(process.env.SMTP_PORT || '587', 10),
  smtpUser: process.env.SMTP_USER || '',
  smtpPass: process.env.SMTP_PASS || '',
  emailFrom: process.env.EMAIL_FROM || '"Sabor Politécnico" <no-reply@saborpolitecnico.com>',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:4200'
};
