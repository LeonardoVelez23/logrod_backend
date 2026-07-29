import { Router } from 'express';
import healthRoutes from './health.routes.js';
import categoriaRoutes from './categoriaRoutes.js';

const router = Router();

router.use('/', healthRoutes);
router.use('/categorias', categoriaRoutes);

export default router;