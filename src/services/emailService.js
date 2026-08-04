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
 * @param {string} token - Token único de restablecimiento
 * @param {string} nombre - Nombre del usuario
 */
export const sendPasswordResetEmail = async (to, token, nombre) => {
  const resetUrl = `${config.frontendUrl}/reset-password?token=${token}`;

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Restablecer Contraseña - Sabor Politécnico</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          background-color: #111827;
          color: #f9fafb;
          margin: 0;
          padding: 0;
        }
        .container {
          max-width: 600px;
          margin: 40px auto;
          background-color: #1f2937;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5);
          border: 1px solid #374151;
        }
        .header {
          background: linear-gradient(135deg, #e11d48, #be123c);
          padding: 30px;
          text-align: center;
        }
        .header h1 {
          margin: 0;
          color: #ffffff;
          font-size: 24px;
          font-weight: 700;
        }
        .body {
          padding: 35px 30px;
          line-height: 1.6;
        }
        .body p {
          color: #d1d5db;
          font-size: 15px;
          margin-bottom: 20px;
        }
        .btn-container {
          text-align: center;
          margin: 30px 0;
        }
        .btn {
          display: inline-block;
          background: linear-gradient(135deg, #e11d48, #9f1239);
          color: #ffffff !important;
          text-decoration: none;
          padding: 14px 28px;
          font-size: 15px;
          font-weight: 600;
          border-radius: 8px;
          box-shadow: 0 4px 15px rgba(225, 29, 72, 0.4);
        }
        .footer {
          background-color: #111827;
          padding: 20px;
          text-align: center;
          font-size: 13px;
          color: #9ca3af;
          border-top: 1px solid #374151;
        }
        .note {
          font-size: 13px;
          color: #9ca3af;
          margin-top: 25px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🍽️ Sabor Politécnico</h1>
        </div>
        <div class="body">
          <p>Hola <strong>${nombre}</strong>,</p>
          <p>Hemos recibido una solicitud para restablecer la contraseña de tu cuenta en <strong>Sabor Politécnico</strong>.</p>
          <p>Para crear una nueva contraseña, haz clic en el siguiente botón:</p>
          
          <div class="btn-container">
            <a href="${resetUrl}" class="btn" target="_blank">Restablecer mi Contraseña</a>
          </div>
          
          <p class="note">⚠️ Este enlace de restablecimiento es válido únicamente durante <strong>1 hora</strong>. Si tú no solicitaste este cambio, puedes ignorar este correo de forma segura.</p>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} Sabor Politécnico. Todos los derechos reservados.</p>
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
        console.warn('Respuesta de Brevo API:', data);
      }
    } catch (brevoErr) {
      console.error('Error al conectar con la API de Brevo:', brevoErr);
    }
  }

  // 2. Si no hay BREVO_API_KEY ni SMTP_USER configurado, simulamos el envío en consola para desarrollo
  if (!config.smtpUser || !config.smtpPass) {
    console.log('\n------------------ [EMAIL DE PRUEBA (MODO SIMULADO)] ------------------');
    console.log(`Para: ${to}`);
    console.log(`Asunto: Restablece tu contraseña - Sabor Politécnico`);
    console.log(`Enlace de Restablecimiento: ${resetUrl}`);
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
