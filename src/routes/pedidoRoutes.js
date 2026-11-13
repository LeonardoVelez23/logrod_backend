import { Router } from 'express';
import { getAllPedidos, getPedidoById, createPedido, updatePedido, deletePedido, getPedidoStats, getMisPedidos } from '../controllers/pedidoController.js';
import { verifyToken, restrictTo } from '../middlewares/authMiddleware.js';

const router = Router();

router.use(verifyToken);

router.get('/stats', restrictTo('admin', 'empleado', 'cajero'), getPedidoStats);
router.get('/mios', restrictTo('cliente'), getMisPedidos);
router.get('/', restrictTo('cliente', 'admin', 'empleado', 'cajero', 'cocinero', 'mesero'), getAllPedidos);
router.get('/:id', getPedidoById);
router.post('/', restrictTo('cliente', 'admin', 'empleado', 'cajero', 'mesero'), createPedido);
// Una vez hecho el pedido, el cliente no puede cancelarlo ni modificarlo.
router.put('/:id', restrictTo('admin', 'empleado', 'cajero', 'cocinero'), updatePedido);
router.delete('/:id', restrictTo('admin'), deletePedido);

export default router;