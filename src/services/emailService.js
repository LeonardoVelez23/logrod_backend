import nodemailer from 'nodemailer';
import { config } from '../config/env.js';

// Crear el transportador SMTP
const createTransporter = () => {
  return nodemailer.createTransport({
    host: config.smtpHost,
    port: config.smtpPort,
    secure: config.smtpPort === 465, // true para 465, false para 587
    auth: {
      user: config.smtpUser,
      pass: config.smtpPass
    }
  });
};

/**
 * Enviar correo de restablecimiento de contraseña
 * @param {string} to - Dirección de correo del destinatario
 * @param {string} otp - Código OTP de 6 dígitos para verificación
 * @param {string} nombre - Nombre del usuario
 */
export const sendPasswordResetEmail = async (to, otp, nombre) => {

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Código de verificación - Sabor Politécnico</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          background-color: #111827;
          color: #f9fafb;
          margin: 0;
          padding: 0;
        }
        .container {
          max-width: 560px;
          margin: 40px auto;
          background-color: #1f2937;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 10px 40px rgba(0,0,0,0.5);
          border: 1px solid #374151;
        }
        .header {
          background: linear-gradient(135deg, #e11d48, #be123c);
          padding: 32px 30px;
          text-align: center;
        }
        .header h1 {
          margin: 0;
          color: #fff;
          font-size: 22px;
          font-weight: 700;
          letter-spacing: 0.5px;
        }
        .header p {
          margin: 6px 0 0;
          color: rgba(255,255,255,0.75);
          font-size: 13px;
        }
        .body {
          padding: 36px 32px 28px;
          line-height: 1.7;
        }
        .body p {
          color: #d1d5db;
          font-size: 15px;
          margin-bottom: 18px;
        }
        .otp-box {
          background: linear-gradient(135deg, #111827, #1a2332);
          border: 2px solid #e11d48;
          border-radius: 14px;
          padding: 28px 20px;
          text-align: center;
          margin: 28px 0;
          box-shadow: 0 0 30px rgba(225,29,72,0.15);
        }
        .otp-label {
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 2px;
          color: #9ca3af;
          margin-bottom: 12px;
        }
        .otp-code {
          font-size: 52px;
          font-weight: 800;
          letter-spacing: 14px;
          color: #f9fafb;
          font-family: 'Courier New', monospace;
          text-shadow: 0 0 20px rgba(225,29,72,0.4);
        }
        .otp-expiry {
          margin-top: 12px;
          font-size: 12px;
          color: #f87171;
          font-weight: 600;
        }
        .note {
          font-size: 13px;
          color: #9ca3af;
          margin-top: 20px;
          padding: 14px 16px;
          background-color: #111827;
          border-radius: 8px;
          border-left: 3px solid #374151;
        }
        .footer {
          background-color: #111827;
          padding: 18px 20px;
          text-align: center;
          font-size: 12px;
          color: #6b7280;
          border-top: 1px solid #374151;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🍽️ Sabor Politécnico</h1>
          <p>Restablecimiento de contraseña</p>
        </div>
        <div class="body">
          <p>Hola <strong style="color:#f9fafb">${nombre}</strong>,</p>
          <p>Recibimos una solicitud para restablecer la contraseña de tu cuenta. Usa el siguiente código de verificación:</p>

          <div class="otp-box">
            <div class="otp-label">Tu código de verificación</div>
            <div class="otp-code">${otp}</div>
            <div class="otp-expiry">⏱ Válido por 15 minutos</div>
          </div>

          <p>Ingresa este código en la pantalla de recuperación de contraseña de <strong style="color:#f9fafb">Sabor Politécnico</strong> junto con tu nueva contraseña.</p>

          <div class="note">
            🔒 Si tú no solicitaste este cambio, puedes ignorar este correo. Tu contraseña actual permanecerá sin cambios.
          </div>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} Sabor Politécnico — ESPAM Manuel Félix López</p>
        </div>
      </div>
    </body>
    </html>
  `;

  // 1. Si existe una clave BREVO_API_KEY, enviar mediante la API REST v3 de Brevo
  if (config.brevoApiKey) {
    try {
      // Extraer nombre y correo del remitente desde config.emailFrom
      let senderEmail = process.env.BREVO_SENDER_EMAIL || 'admin@logrod.com';
      let senderName = 'Sabor Politécnico';

      if (config.emailFrom) {
        const match = config.emailFrom.match(/(?:"?([^"]*)"?\s)?<?([^>]+)>?/);
        if (match) {
          if (match[1]) senderName = match[1].trim();
          if (match[2]) senderEmail = match[2].trim();
        }
      }

      const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'api-key': config.brevoApiKey,
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          sender: { name: senderName, email: senderEmail },
          to: [{ email: to, name: nombre }],
          subject: 'Restablecer tu contraseña - Sabor Politécnico',
          htmlContent: htmlContent
        })
      });

      const data = await response.json();
      if (response.ok) {
        console.log(`Correo de recuperación enviado exitosamente a ${to} vía Brevo API. ID: ${data.messageId}`);
        return { success: true, messageId: data.messageId };
      } else {
        console.warn(' Respuesta de error de Brevo API:', data);
        throw new Error(`Brevo API Error (${response.status}): ${data.message || JSON.stringify(data)}`);
      }
    } catch (brevoErr) {
      console.error('Error al conectar con la API de Brevo:', brevoErr);
      throw brevoErr;
    }
  }

  // 2. Si no hay BREVO_API_KEY ni SMTP_USER configurado, simulamos el envío en consola para desarrollo
  if (!config.smtpUser || !config.smtpPass) {
    console.log('\n------------------ [EMAIL DE PRUEBA (MODO SIMULADO)] ------------------');
    console.log(`Para: ${to}`);
    console.log(`Asunto: Restablece tu contraseña - Sabor Politécnico`);
    console.log(`Código OTP: ${otp}`);
    console.log('-------------------------------------------------------------------------\n');
    return { success: true, simulated: true };
  }

  const transporter = createTransporter();

  const mailOptions = {
    from: config.emailFrom,
    to,
    subject: 'Restablecer tu contraseña - Sabor Politécnico',
    html: htmlContent
  };

  const info = await transporter.sendMail(mailOptions);
  console.log(`Correo de recuperación enviado a ${to}. ID: ${info.messageId}`);
  return { success: true, messageId: info.messageId };
};
