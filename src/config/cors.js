/**
 * Orígenes web que pueden llamar a la API (RNF-04). La app móvil no usa
 * CORS. CORS_ORIGIN admite varios dominios separados por coma.
 * - Con CORS_ORIGIN: solo esos dominios.
 * - En desarrollo sin CORS_ORIGIN: cualquiera.
 * - En producción sin CORS_ORIGIN: ningún origen web.
 */
export const opcionesCors = ({ nodeEnv, corsOrigin }) => {
  const origenes = (corsOrigin ?? '')
    .split(',')
    .map((origen) => origen.trim())
    .filter(Boolean);

  if (origenes.includes('*')) return { origin: '*' };
  if (origenes.length > 0) return { origin: origenes };
  if (nodeEnv === 'production') {
    console.warn('WARNING: CORS_ORIGIN no está definido: la API no aceptará peticiones desde navegadores.');
    return { origin: false };
  }
  return { origin: '*' };
};
