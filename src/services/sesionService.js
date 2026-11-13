import { Cliente, Empleado } from '../models/index.js';
import { rolDeCargo } from '../utils/roles.js';

/**
 * Rol vigente del usuario de un token, leído de la base: así un cambio de
 * cargo aplica en la siguiente petición. Devuelve null si el usuario ya no
 * existe.
 */
export const rolVigente = async ({ id, rol }) => {
  if (rol === 'cliente') {
    // Una cuenta eliminada pierde el acceso aunque su token no haya vencido.
    const cliente = await Cliente.findByPk(id, { attributes: ['id', 'eliminado_en'] });
    return cliente && !cliente.eliminado_en ? 'cliente' : null;
  }
  const empleado = await Empleado.findByPk(id, { attributes: ['id', 'cargo'] });
  return empleado ? rolDeCargo(empleado.cargo) : null;
};
