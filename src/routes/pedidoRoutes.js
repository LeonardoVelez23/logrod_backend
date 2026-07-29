import { Router } from 'express';
import { getAllPedidos, getPedidoById, createPedido, updatePedido, deletePedido } from '../controllers/pedidoController.js';
import { verifyToken, restrictTo } from '../middlewares/authMiddleware.js';

const router = Router();

router.use(verifyToken);

router.get('/', restrictTo('admin', 'empleado'), getAllPedidos);
router.get('/:id', getPedidoById);
router.post('/', restrictTo('cliente', 'admin', 'empleado'), createPedido);
router.put('/:id', restrictTo('admin', 'empleado'), updatePedido);
router.delete('/:id', restrictTo('admin'), deletePedido);

export default router;