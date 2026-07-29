import { Cliente, Empleado } from '../models/index.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Op } from 'sequelize';
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
        role = (cargo === 'admin' || cargo === 'administrador') ? 'admin' : 'empleado';
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
export { login as authLogin };
