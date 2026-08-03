import { Router } from 'express';
import { getAllPagos, getPagoById, getPagoByPedido, createPago, updatePago, deletePago } from '../controllers/pagoController.js';
import { verifyToken, restrictTo } from '../middlewares/authMiddleware.js';

const router = Router();

router.use(verifyToken);

router.get('/', restrictTo('admin', 'empleado', 'cajero', 'cocinero'), getAllPagos);
router.get('/pedido/:pedidoId', getPagoByPedido);
router.get('/:id', getPagoById);
router.post('/', restrictTo('cliente', 'admin', 'empleado', 'cajero', 'cocinero'), createPago);
router.put('/:id', restrictTo('admin', 'empleado', 'cajero', 'cocinero'), updatePago);
router.delete('/:id', restrictTo('admin'), deletePago);

export default router;