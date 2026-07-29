import { Router } from 'express';
import { getAllPagos, getPagoById, getPagoByPedido, createPago, updatePago, deletePago } from '../controllers/pagoController.js';
import { verifyToken, restrictTo } from '../middlewares/authMiddleware.js';

const router = Router();

router.use(verifyToken);

router.get('/', restrictTo('admin', 'empleado'), getAllPagos);
router.get('/pedido/:pedidoId', getPagoByPedido);
router.get('/:id', getPagoById);
router.post('/', restrictTo('cliente', 'admin', 'empleado'), createPago);
router.put('/:id', restrictTo('admin', 'empleado'), updatePago);
router.delete('/:id', restrictTo('admin'), deletePago);

export default router;