import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

import { config } from './config/env.js';
import routes from './routes/index.js';
import { notFoundHandler } from './middlewares/notFoundHandler.js';
import { errorHandler } from './middlewares/errorHandler.js';

const app = express();

// Middlewares de seguridad y utilidad
app.use(helmet());
app.use(cors({ origin: config.corsOrigin }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (config.nodeEnv === 'development') {
  app.use(morgan('dev'));
}

// Rutas base de la API
app.use('/api/v1', routes);

// Middleware para rutas no encontradas (404)
app.use(notFoundHandler);

// Middleware centralizado de errores (500)
app.use(errorHandler);

export default app;
