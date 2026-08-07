import { describe, it, expect, vi, afterEach } from 'vitest';
import nodemailer from 'nodemailer';
import { sendPasswordResetEmail } from '../../src/services/emailService.js';
import { config } from '../../src/config/env.js';

vi.mock('nodemailer', () => {
  return {
    default: {
      createTransport: vi.fn().mockReturnValue({
        sendMail: vi.fn().mockResolvedValue({ messageId: '<mock-smtp-message-id>' })
      })
    }
  };
});

describe('emailService', () => {
  const originalFetch = global.fetch;
  const originalBrevoKey = config.brevoApiKey;
  const originalSmtpUser = config.smtpUser;
  const originalSmtpPass = config.smtpPass;

  afterEach(() => {
    global.fetch = originalFetch;
    config.brevoApiKey = originalBrevoKey;
    config.smtpUser = originalSmtpUser;
    config.smtpPass = originalSmtpPass;
    process.env.BREVO_API_KEY = '';
    vi.clearAllMocks();
  });

  it('debe enviar correo simulado en consola si no hay Brevo API Key ni SMTP configurado', async () => {
    config.brevoApiKey = '';
    config.smtpUser = '';
    config.smtpPass = '';

    const res = await sendPasswordResetEmail('test@espam.edu.ec', '123456', 'Juan Pérez');
    expect(res).toEqual({ success: true, simulated: true });
  });

  it('debe enviar correo mediante Brevo API si brevoApiKey está configurada', async () => {
    config.brevoApiKey = 'test_brevo_api_key';
    config.emailFrom = '"Sabor Politécnico" <admin@espam.edu.ec>';

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({ messageId: '<brevo-123>' })
    });

    const res = await sendPasswordResetEmail('test@espam.edu.ec', '654321', 'María López');

    expect(fetch).toHaveBeenCalled();
    expect(res).toEqual({ success: true, messageId: '<brevo-123>' });
  });

  it('debe lanzar un error si la API de Brevo responde con fallo', async () => {
    config.brevoApiKey = 'bad_key';
    config.smtpUser = '';
    config.smtpPass = '';

    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: vi.fn().mockResolvedValue({ message: 'Key not found' })
    });

    await expect(sendPasswordResetEmail('test@espam.edu.ec', '111222', 'Carlos')).rejects.toThrow();
  });

  it('debe enviar correo mediante SMTP si hay SMTP_USER y SMTP_PASS sin Brevo Key', async () => {
    config.brevoApiKey = '';
    config.smtpUser = 'user@smtp.com';
    config.smtpPass = 'pass123';

    const res = await sendPasswordResetEmail('test@espam.edu.ec', '999888', 'Pedro');

    expect(nodemailer.createTransport).toHaveBeenCalled();
    expect(res).toEqual({ success: true, messageId: '<mock-smtp-message-id>' });
  });
});
