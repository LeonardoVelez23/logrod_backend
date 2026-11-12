import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';
import { Cliente, Empleado } from '../models/index.js';
import { rolDeCargo } from '../utils/roles.js';

const noAutorizado = (res, message) => res.status(401).json({ success: false, message });

/**
 * Verifica el JWT y carga el rol vigente desde la base: un cambio de cargo
 * aplica en la siguiente petición y un usuario eliminado pierde el acceso,
 * sin esperar a que venza el token.
 */
export const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return noAutorizado(res, 'Acceso no autorizado. Token no proporcionado.');
  }

  let decoded;
  try {
    decoded = jwt.verify(authHeader.split(' ')[1], config.jwtSecret);
  } catch {
    return noAutorizado(res, 'Token inválido o expirado');
  }

  try {
    const esCliente = decoded.rol === 'cliente';
    const usuario = esCliente
      ? await Cliente.findByPk(decoded.id, { attributes: ['id'] })
      : await Empleado.findByPk(decoded.id, { attributes: ['id', 'cargo'] });

    if (!usuario) {
      return noAutorizado(res, 'La sesión ya no es válida. Inicia sesión de nuevo.');
    }

    // Contiene id, identificacion, nombres, apellidos, correo_electronico y rol.
    req.user = { ...decoded, rol: esCliente ? 'cliente' : rolDeCargo(usuario.cargo) };
    next();
  } catch (error) {
    next(error);
  }
};

export const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.rol)) {
      return res.status(403).json({
        success: false,
        message: 'No tiene permisos para realizar esta acción'
      });
    }
    next();
  };
};
