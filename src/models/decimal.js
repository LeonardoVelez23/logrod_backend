/** Convierte un NUMERIC de Postgres (texto) a número para la API. */
export const comoNumero = (valor) => (valor === null || valor === undefined ? valor : Number(valor));
