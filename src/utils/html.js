/**
 * Escapa texto para insertarlo en HTML (p. ej. la plantilla de correo).
 * Los datos se guardan tal cual en la base; cada cliente (web, app,
 * correo) escapa al mostrar.
 */
export const escaparHtml = (texto) =>
  String(texto ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
