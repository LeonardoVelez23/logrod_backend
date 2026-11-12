/**
 * Política de contraseñas (RNF-05): al menos 8 caracteres, una mayúscula,
 * un número y un carácter especial. Devuelve el mensaje del primer
 * requisito que falta, o null si la contraseña es válida.
 */
export const errorDeContrasenia = (contrasenia) => {
  if (typeof contrasenia !== 'string' || contrasenia.length < 8) {
    return 'La contraseña debe tener al menos 8 caracteres.';
  }
  if (!/[A-Z]/.test(contrasenia)) return 'La contraseña debe incluir al menos una letra mayúscula.';
  if (!/[0-9]/.test(contrasenia)) return 'La contraseña debe incluir al menos un número.';
  if (!/[^A-Za-z0-9]/.test(contrasenia)) {
    return 'La contraseña debe incluir al menos un carácter especial.';
  }
  return null;
};
