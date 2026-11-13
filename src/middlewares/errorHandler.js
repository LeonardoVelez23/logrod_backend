const MENSAJE_INTERNO = 'Error interno del servidor';

/**
 * Traduce un error a código HTTP y mensaje para el cliente. Los errores de
 * datos (JSON mal formado, validaciones, tipos o longitudes inválidas)
 * son 400; nunca se devuelve el texto interno de la base de datos.
 */
const clasificar = (err) => {
  if (err.type === 'entity.parse.failed') {
    return { status: 400, message: 'El cuerpo de la petición no es un JSON válido' };
  }
  if (err.type === 'entity.too.large') {
    return { status: 413, message: 'La petición es demasiado grande' };
  }

  switch (err.name) {
    case 'SequelizeValidationError':
      return { status: 400, message: err.errors?.[0]?.message || 'Datos inválidos' };
    case 'SequelizeUniqueConstraintError':
      return { status: 400, message: 'Ya existe un registro con esos datos' };
    case 'SequelizeForeignKeyConstraintError':
      return { status: 400, message: 'Uno de los registros indicados no existe o está en uso' };
    case 'SequelizeDatabaseError':
      // Clase 22 de Postgres: dato con formato, tipo o longitud inválidos.
      if (String(err.parent?.code ?? '').startsWith('22')) {
        return { status: 400, message: 'Algún dato tiene un formato o una longitud inválidos' };
      }
      break;
    default:
  }

  // Errores HTTP de Express/body-parser (status 4xx con expose).
  const status = err.status ?? err.statusCode;
  if (Number.isInteger(status) && status >= 400 && status < 500) {
    return { status, message: err.expose ? err.message : 'Petición inválida' };
  }

  return { status: 500, message: err.message || MENSAJE_INTERNO };
};

export const errorHandler = (err, req, res, _next) => {
  const { status, message } = clasificar(err);
  const enDesarrollo = process.env.NODE_ENV === 'development';

  if (status >= 500) console.error(err);

  res.status(status).json({
    success: false,
    message: status >= 500 && !enDesarrollo ? MENSAJE_INTERNO : message,
    ...(enDesarrollo && status >= 500 && { stack: err.stack })
  });
};
