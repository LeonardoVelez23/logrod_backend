import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  corsOrigin: process.env.CORS_ORIGIN || '*',
  databaseUrl: process.env.DATABASE_URL,
  s3Endpoint: process.env.S3_ENDPOINT,
  s3Region: process.env.S3_REGION,
  s3AccessKeyId: process.env.S3_ACCESS_KEY_ID,
  s3SecretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
  s3Bucket: process.env.S3_BUCKET || 'productos',
  supabaseUrl: process.env.SUPABASE_URL,
  brevoApiKey: process.env.BREVO_API_KEY || '',
  smtpHost: process.env.SMTP_HOST || 'smtp-relay.brevo.com',
  smtpPort: parseInt(process.env.SMTP_PORT || '587', 10),
  smtpUser: process.env.SMTP_USER || '',
  smtpPass: process.env.SMTP_PASS || '',
  emailFrom: process.env.EMAIL_FROM || '"Sabor Politécnico" <no-reply@saborpolitecnico.com>',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:4200'
};
