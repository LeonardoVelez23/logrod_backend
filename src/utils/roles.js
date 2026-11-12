/** Rol de un empleado según su cargo (RF-03). */
export const rolDeCargo = (cargo) => {
  const valor = cargo?.toLowerCase() || '';
  if (valor === 'admin' || valor === 'administrador') return 'admin';
  if (valor === 'mesero' || valor === 'cajero' || valor === 'cocinero') return valor;
  return 'empleado';
};
