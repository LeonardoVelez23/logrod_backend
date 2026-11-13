import { escaparHtml } from '../utils/html.js';

const COLORES = {
  accent: '#1A365D',
  fondo: '#F9F9FF',
  tarjeta: '#FFFFFF',
  texto: '#111C2C',
  textoSecundario: '#4A5568',
  borde: '#E2E8F0',
  naranja: '#F6AD55',
  exito: '#10B981',
  peligro: '#EF4444'
};

const ICONOS = { aprobado: '✓', cancelado: '✕', error: '!' };

/**
 * Página que ve el cliente en el navegador al volver de Payphone, con un
 * botón para regresar a la app. Sin JavaScript: la CSP de Helmet no permite
 * scripts en línea, y abrir la app necesita que el usuario toque el botón.
 */
export const paginaResultadoPago = ({ tipo, titulo, mensaje, enlaceApp }) => {
  const e = escaparHtml;
  const color = tipo === 'aprobado' ? COLORES.exito : tipo === 'cancelado' ? COLORES.textoSecundario : COLORES.peligro;
  return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${e(titulo)} · Sabor Politécnico</title>
<style>
  :root { color-scheme: light; }
  * { box-sizing: border-box; }
  body { margin: 0; min-height: 100vh; background: ${COLORES.fondo}; color: ${COLORES.texto};
    font: 16px/1.6 Inter, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; }
  header { background: ${COLORES.accent}; color: #fff; padding: 20px 16px; font-weight: 700; font-size: 18px; text-align: center; }
  header span { color: ${COLORES.naranja}; }
  main { max-width: 440px; margin: 32px auto; padding: 32px 24px; background: ${COLORES.tarjeta};
    border: 1px solid ${COLORES.borde}; border-radius: 16px; text-align: center; }
  .icono { width: 64px; height: 64px; margin: 0 auto 16px; border-radius: 50%; background: ${color};
    color: #fff; font-size: 34px; line-height: 64px; font-weight: 700; }
  h1 { font-size: 22px; margin: 0 0 8px; color: ${COLORES.texto}; }
  p { color: ${COLORES.textoSecundario}; margin: 0 0 24px; }
  a.boton { display: block; padding: 14px; border-radius: 12px; background: ${COLORES.accent}; color: #fff;
    text-decoration: none; font-weight: 600; }
</style>
</head>
<body>
<header>Sabor <span>Politécnico</span></header>
<main>
  <div class="icono" aria-hidden="true">${ICONOS[tipo] ?? '!'}</div>
  <h1>${e(titulo)}</h1>
  <p>${e(mensaje)}</p>
  ${enlaceApp ? `<a class="boton" href="${e(enlaceApp)}">Volver a la app</a>` : ''}
</main>
</body>
</html>`;
};
