import { config } from '../config/env.js';

/**
 * Fecha (YYYY-MM-DD) y hora (HH:MM:SS) locales del restaurante, sin
 * depender de la zona horaria del servidor (Railway corre en UTC).
 */
export const ahoraLocal = (instante = new Date(), zona = config.zonaHoraria) => {
  const partes = Object.fromEntries(
    new Intl.DateTimeFormat('en-CA', {
      timeZone: zona,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hourCycle: 'h23'
    })
      .formatToParts(instante)
      .map(({ type, value }) => [type, value])
  );
  return {
    fecha: `${partes.year}-${partes.month}-${partes.day}`,
    hora: `${partes.hour}:${partes.minute}:${partes.second}`
  };
};
