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
    let isCliente = true;

    if (!user) {
      user = await Empleado.findOne({ where: { correo_electronico: cleanEmail } });
      isCliente = false;
    }

    // Por seguridad, responder éxito genérico incluso si el correo no existe
    if (!user) {
      return res.status(200).json({
        success: true,
        message: 'Si el correo electrónico está registrado, recibirás las instrucciones para restablecer tu contraseña.'
      });
    }

    // Generar token único seguro y fecha de expiración (1 hora)
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hora de vigencia

    await user.update({
      reset_password_token: resetToken,
      reset_password_expires: resetExpires
    });

    // Enviar correo electrónico
    try {
      await sendPasswordResetEmail(user.correo_electronico, resetToken, `${user.nombres} ${user.apellidos}`);
    } catch (emailError) {
      console.error('Error enviando correo de recuperación:', emailError);
      return res.status(500).json({
        success: false,
        message: 'No se pudo enviar el correo de recuperación. Inténtalo de nuevo más tarde.'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Si el correo electrónico está registrado, recibirás las instrucciones para restablecer tu contraseña.'
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
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Token y nueva contraseña son requeridos'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'La contraseña debe tener al menos 6 caracteres'
      });
    }

    // Buscar en Clientes
    let user = await Cliente.findOne({
      where: {
        reset_password_token: token,
        reset_password_expires: { [Op.gt]: new Date() }
      }
    });

    // Buscar en Empleados si no se encontró en Clientes
    if (!user) {
      user = await Empleado.findOne({
        where: {
          reset_password_token: token,
          reset_password_expires: { [Op.gt]: new Date() }
        }
      });
    }

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'El enlace de restablecimiento es inválido o ha expirado. Por favor, solicita uno nuevo.'
      });
    }

    // Hashear la nueva contraseña
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Actualizar contraseña y limpiar token de recuperación
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

