import { Cliente, Empleado } from '../models/index.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Op } from 'sequelize';
import crypto from 'crypto';
import { sendPasswordResetEmail } from '../services/emailService.js';
import { config } from '../config/env.js';

const JWT_SECRET = process.env.JWT_SECRET || 'jwt_secret_resto_logrod_2026';

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
      JWT_SECRET,
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

    // Buscar en Clientes y luego en Empleados
    let user = await Cliente.findOne({ where: { correo_electronico: cleanEmail } });

    if (!user) {
      user = await Empleado.findOne({ where: { correo_electronico: cleanEmail } });
    }

    // Validar si el usuario/correo existe en el sistema
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'El correo electrónico ingresado no se encuentra registrado en el sistema.'
      });
    }

    // Si ya existe un OTP válido y no ha expirado, reutilizarlo (evitar sobrescribir)
    let otp = user.reset_password_token;
    let otpExpires = user.reset_password_expires;
    const now = new Date();

    if (!otp || !otpExpires || otpExpires <= now) {
      // Generar nuevo OTP de 6 dígitos solo si no hay uno vigente
      otp = Math.floor(100000 + Math.random() * 900000).toString();
      otpExpires = new Date(now.getTime() + 15 * 60 * 1000); // 15 minutos

      await user.update({
        reset_password_token: otp,
        reset_password_expires: otpExpires
      });
    }

    if (config.nodeEnv === 'development') {
      console.log('\n=================================================');
      console.log(`🔑 [CÓDIGO OTP ENVIADO A ${user.correo_electronico}]: ${otp}`);
      console.log('=================================================\n');
    }

    // Enviar correo con el OTP (nuevo o reutilizado)
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
    const cleanOtp = otp.trim();

    // Buscar en Clientes por email + OTP válido
    let user = await Cliente.findOne({
      where: {
        correo_electronico: cleanEmail,
        reset_password_token: cleanOtp,
        reset_password_expires: { [Op.gt]: new Date() }
      }
    });

    // Buscar en Empleados si no se encontró en Clientes
    if (!user) {
      user = await Empleado.findOne({
        where: {
          correo_electronico: cleanEmail,
          reset_password_token: cleanOtp,
          reset_password_expires: { [Op.gt]: new Date() }
        }
      });
    }

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'El código ingresado es incorrecto o ha expirado. Solicita uno nuevo.'
      });
    }

    // Hashear la nueva contraseña
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Actualizar contraseña y limpiar OTP
    await user.update({
      contrasenia: hashedPassword,
      reset_password_token: null,
      reset_password_expires: null
    });

    res.status(200).json({
      success: true,
      message: '¡Contraseña restablecida con éxito! Ya puedes iniciar sesión con tu nueva clave.'
    });
  } catch (error) {
    next(error);
  }
};

export { login as authLogin };

