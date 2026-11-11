import { Cliente, Empleado } from '../models/index.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Op } from 'sequelize';
import { sendPasswordResetEmail } from '../services/emailService.js';
import { config } from '../config/env.js';
import { emitirOtp, verificarOtp, otpLimpio } from '../services/otpService.js';

const buscarPorCorreo = async (correo) =>
  (await Cliente.findOne({ where: { correo_electronico: correo } })) ??
  (await Empleado.findOne({ where: { correo_electronico: correo } }));

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Por favor, ingrese su correo/identificación y contraseña'
      });
    }

    let user = await Cliente.findOne({
      where: {
        [Op.or]: [
          { correo_electronico: email.trim().toLowerCase() },
          { identificacion: email.trim() }
        ]
      }
    });

    let role = 'cliente';

    if (!user) {
      user = await Empleado.findOne({
        where: {
          [Op.or]: [
            { correo_electronico: email.trim().toLowerCase() },
            { identificacion: email.trim() }
          ]
        }
      });
      
      if (user) {
        const cargo = user.cargo?.toLowerCase() || '';
        if (cargo === 'admin' || cargo === 'administrador') {
          role = 'admin';
        } else if (cargo === 'mesero') {
          role = 'mesero';
        } else if (cargo === 'cajero') {
          role = 'cajero';
        } else if (cargo === 'cocinero') {
          role = 'cocinero';
        } else {
          role = 'empleado';
        }
      }
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas'
      });
    }

    const isMatch = await bcrypt.compare(password, user.contrasenia);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas'
      });
    }

    const token = jwt.sign(
      {
        id: user.id,
        identificacion: user.identificacion,
        nombres: user.nombres,
        apellidos: user.apellidos,
        correo_electronico: user.correo_electronico,
        rol: role
      },
      config.jwtSecret,
      { expiresIn: '8h' }
    );

    const userData = user.toJSON();
    delete userData.contrasenia;

    res.status(200).json({
      success: true,
      message: 'Inicio de sesión exitoso',
      token,
      user: {
        ...userData,
        rol: role
      }
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Solicitar enlace de recuperación de contraseña
 */
export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Por favor, ingrese su correo electrónico'
      });
    }

    const cleanEmail = email.trim().toLowerCase();

    const user = await buscarPorCorreo(cleanEmail);

    // Por seguridad, responder éxito genérico incluso si el correo no existe
    if (!user) {
      return res.status(200).json({
        success: true,
        message: 'Si el correo está registrado, recibirás el código de verificación.'
      });
    }

    // Cada solicitud genera un código nuevo e invalida el anterior.
    const otp = await emitirOtp(user);

    if (config.nodeEnv === 'development') {
      console.log('\n=================================================');
      console.log(`🔑 [CÓDIGO OTP ENVIADO A ${user.correo_electronico}]: ${otp}`);
      console.log('=================================================\n');
    }

    // Enviar correo con el OTP
    try {
      await sendPasswordResetEmail(user.correo_electronico, otp, `${user.nombres} ${user.apellidos}`);
    } catch (emailError) {
      console.error('Error enviando OTP de recuperación:', emailError);
      return res.status(500).json({
        success: false,
        message: 'No se pudo enviar el código de verificación. Inténtalo de nuevo más tarde.'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Si el correo está registrado, recibirás el código de verificación.'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Restablecer contraseña mediante token
 */
export const resetPassword = async (req, res, next) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Correo, código OTP y nueva contraseña son requeridos'
      });
    }

    // Validar fortaleza de la contraseña
    if (newPassword.length < 8) {
      return res.status(400).json({ success: false, message: 'La contraseña debe tener al menos 8 caracteres.' });
    }
    if (!/[A-Z]/.test(newPassword)) {
      return res.status(400).json({ success: false, message: 'La contraseña debe incluir al menos una letra mayúscula.' });
    }
    if (!/[0-9]/.test(newPassword)) {
      return res.status(400).json({ success: false, message: 'La contraseña debe incluir al menos un número.' });
    }
    if (!/[^A-Za-z0-9]/.test(newPassword)) {
      return res.status(400).json({ success: false, message: 'La contraseña debe incluir al menos un carácter especial.' });
    }

    const cleanEmail = email.trim().toLowerCase();

    const user = await buscarPorCorreo(cleanEmail);

    if (!user || !(await verificarOtp(user, otp))) {
      return res.status(400).json({
        success: false,
        message: 'El código ingresado es incorrecto o ha expirado. Solicita uno nuevo.'
      });
    }

    // Hashear la nueva contraseña
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Actualizar contraseña y limpiar OTP
    await user.update({ contrasenia: hashedPassword, ...otpLimpio });

    res.status(200).json({
      success: true,
      message: '¡Contraseña restablecida con éxito! Ya puedes iniciar sesión con tu nueva clave.'
    });
  } catch (error) {
    next(error);
  }
};

export { login as authLogin };

