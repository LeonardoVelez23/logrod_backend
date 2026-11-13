import { escaparHtml } from '../utils/html.js';

// Colores de marca (los mismos de la web y la app).
const COLORES = {
  accent: '#1A365D',
  accentLight: '#4A6FA5',
  fondo: '#F9F9FF',
  tarjeta: '#FFFFFF',
  texto: '#111C2C',
  textoSecundario: '#4A5568',
  tenue: '#718096',
  borde: '#E2E8F0',
  naranja: '#F6AD55'
};

const ENLACES = [
  ['terminos', 'Términos y condiciones'],
  ['privacidad', 'Política de privacidad'],
  ['eliminar-cuenta', 'Eliminar cuenta']
];

/** Página HTML pública de un documento `{tipo, titulo, version, secciones}`. */
export const paginaLegal = (documento) => {
  const e = escaparHtml;
  const secciones = documento.secciones
    .map(
      (s) =>
        `<section><h2>${e(s.titulo)}</h2>${s.parrafos.map((p) => `<p>${e(p)}</p>`).join('')}</section>`
    )
    .join('\n');
  const nav = ENLACES.map(
    ([tipo, texto]) =>
      `<a href="./${tipo}"${tipo === documento.tipo ? ' aria-current="page"' : ''}>${e(texto)}</a>`
  ).join('');

  return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${e(documento.titulo)} · Sabor Politécnico</title>
<style>
  :root { color-scheme: light; }
  * { box-sizing: border-box; }
  body { margin: 0; background: ${COLORES.fondo}; color: ${COLORES.texto};
    font: 16px/1.6 Inter, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; }
  header { background: ${COLORES.accent}; color: #fff; padding: 20px 16px; }
  header .marca { max-width: 760px; margin: 0 auto; font-weight: 700; font-size: 18px; }
  header .marca span { color: ${COLORES.naranja}; }
  nav { max-width: 760px; margin: 12px auto 0; display: flex; flex-wrap: wrap; gap: 8px; }
  nav a { color: #fff; text-decoration: none; font-size: 14px; padding: 4px 10px;
    border: 1px solid rgba(255,255,255,.35); border-radius: 999px; }
  nav a[aria-current="page"] { background: #fff; color: ${COLORES.accent}; }
  main { max-width: 760px; margin: 24px auto; padding: 24px 16px; background: ${COLORES.tarjeta};
    border: 1px solid ${COLORES.borde}; border-radius: 12px; }
  h1 { color: ${COLORES.accent}; font-size: 26px; line-height: 1.25; margin: 0 0 4px; }
  .version { color: ${COLORES.tenue}; font-size: 14px; margin: 0 0 8px; }
  h2 { font-size: 18px; margin: 28px 0 8px; color: ${COLORES.texto}; }
  p { color: ${COLORES.textoSecundario}; margin: 0 0 10px; }
  footer { text-align: center; color: ${COLORES.tenue}; font-size: 13px; padding: 0 16px 32px; }
  @media (min-width: 600px) { main { padding: 32px 40px; } }
</style>
</head>
<body>
<header>
  <div class="marca">Sabor <span>Politécnico</span></div>
  <nav>${nav}</nav>
</header>
<main>
  <h1>${e(documento.titulo)}</h1>
  <p class="version">Versión del ${e(documento.version)}</p>
${secciones}
</main>
<footer>Sabor Politécnico · Restaurante universitario</footer>
</body>
</html>`;
};
