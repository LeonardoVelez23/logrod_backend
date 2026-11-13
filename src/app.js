import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

import { config } from './config/env.js';
import routes from './routes/index.js';
import paginasLegales from './routes/paginasLegales.js';
import { notFoundHandler } from './middlewares/notFoundHandler.js';
import { errorHandler } from './middlewares/errorHandler.js';
import { opcionesCors } from './config/cors.js';

const app = express();

// En producción la API va detrás del proxy de la plataforma de hosting:
// sin esto todas las peticiones tendrían la IP del proxy (y el límite de
// intentos sería compartido por todos los usuarios).
if (config.nodeEnv === 'production') {
  app.set('trust proxy', 1);
}

// Middlewares de seguridad y utilidad
app.use(helmet());
app.use(cors(opcionesCors(config)));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// Los textos se guardan tal cual: cada cliente (web, app, correo) escapa al
// mostrar. Escapar al guardar dejaba `O'Brien` como `O&#x27;Brien`.

if (config.nodeEnv === 'development') {
  app.use(morgan('dev'));
}

// Rutas base de la API
app.use('/api/v1', routes);

// Páginas públicas (HTML) de términos, privacidad y eliminación de cuenta:
// las tiendas de apps piden una URL que abra en el navegador.
app.use('/legal', paginasLegales);

// Middleware para rutas no encontradas (404)
app.use(notFoundHandler);

// Middleware centralizado de errores (500)
app.use(errorHandler);

export default app;
