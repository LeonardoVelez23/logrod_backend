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

    // 1. Search in Clientes table first
    let user = await Cliente.findOne({
      where: {
        [Op.or]: [
          { correo_electronico: email.trim().toLowerCase() },
          { identificacion: email.trim() }
        ]
      }
    });

    let role = 'cliente';

    // 2. If not found in Clientes, search in Empleados table
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
        // If found in Empleados, determine if role is admin or empleado
        const cargo = user.cargo?.toLowerCase() || '';
        role = (cargo === 'admin' || cargo === 'administrador') ? 'admin' : 'empleado';
      }
    }

    // 3. If still not found, return invalid credentials
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas'
      });
    }

    // 4. Compare password hashes
    const isMatch = await bcrypt.compare(password, user.contrasenia);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas'
      });
    }

    // 5. Generate JWT token
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

    // Remove password hash from response
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
