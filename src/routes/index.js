import { Router } from 'express';
import healthRoutes from './health.routes.js';
import categoriaRoutes from './categoriaRoutes.js';
import productoRoutes from './productoRoutes.js';
import clienteRoutes from './clienteRoutes.js';
import empleadoRoutes from './empleadoRoutes.js';
import pedidoRoutes from './pedidoRoutes.js';
import pagoRoutes from './pagoRoutes.js';
import authRoutes from './authRoutes.js';

const router = Router();

router.use('/', healthRoutes);
router.use('/auth', authRoutes);
router.use('/categorias', categoriaRoutes);
router.use('/productos', productoRoutes);
router.use('/clientes', clienteRoutes);
router.use('/empleados', empleadoRoutes);
router.use('/pedidos', pedidoRoutes);
router.use('/pagos', pagoRoutes);

export default router;