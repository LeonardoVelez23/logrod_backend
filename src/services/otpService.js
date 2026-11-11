import crypto from 'crypto';
import { config } from '../config/env.js';

export const OTP_TTL_MS = 15 * 60 * 1000; // 15 minutos (RN-15)
export const OTP_MAX_ATTEMPTS = 5;

// Se guarda un HMAC del código, no el código: con una copia de la base de
// datos no se puede usar ni adivinar sin el secreto del servidor.
const hashOtp = (otp) =>
  crypto.createHmac('sha256', config.jwtSecret).update(String(otp)).digest('hex');

export const otpLimpio = {
  reset_password_token: null,
  reset_password_expires: null,
  reset_password_attempts: 0
};

/**
 * Genera un OTP nuevo de 6 dígitos para el usuario (Cliente o Empleado),
 * invalida el anterior y devuelve el código en claro para enviarlo por correo.
 */
export const emitirOtp = async (user) => {
  const otp = crypto.randomInt(0, 1_000_000).toString().padStart(6, '0');
  await user.update({
    reset_password_token: hashOtp(otp),
    reset_password_expires: new Date(Date.now() + OTP_TTL_MS),
    reset_password_attempts: 0
  });
  return otp;
};

/**
 * Comprueba el OTP. Un intento fallido suma 1 al contador; al llegar a
 * OTP_MAX_ATTEMPTS el código deja de servir aunque no haya vencido.
 * No limpia el OTP: quien lo use debe guardar `otpLimpio` junto al cambio.
 */
export const verificarOtp = async (user, otp) => {
  if (
    !user.reset_password_token ||
    !user.reset_password_expires ||
    new Date(user.reset_password_expires) <= new Date() ||
    user.reset_password_attempts >= OTP_MAX_ATTEMPTS
  ) {
    return false;
  }

  const codigo = String(otp ?? '').trim();
  const esperado = Buffer.from(user.reset_password_token, 'utf8');
  const recibido = Buffer.from(hashOtp(codigo), 'utf8');
  const valido =
    /^\d{6}$/.test(codigo) &&
    esperado.length === recibido.length &&
    crypto.timingSafeEqual(esperado, recibido);

  if (!valido) {
    await user.increment('reset_password_attempts');
    return false;
  }
  return true;
};
