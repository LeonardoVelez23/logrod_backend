import { Router } from 'express';
import healthRoutes from './health.routes.js';
import categoriaRoutes from './categoriaRoutes.js';
import productoRoutes from './productoRoutes.js';
import clienteRoutes from './clienteRoutes.js';
import empleadoRoutes from './empleadoRoutes.js';

const router = Router();

router.use('/', healthRoutes);
router.use('/categorias', categoriaRoutes);
router.use('/productos', productoRoutes);
router.use('/clientes', clienteRoutes);
router.use('/empleados', empleadoRoutes);

export default router;