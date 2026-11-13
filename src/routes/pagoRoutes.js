import { Router } from 'express';
import { getAllPagos, getPagoById, getPagoByPedido, createPago, updatePago, deletePago } from '../controllers/pagoController.js';
import { prepararPagoPayphone } from '../controllers/payphoneController.js';
import { verifyToken, restrictTo } from '../middlewares/authMiddleware.js';

const router = Router();

router.use(verifyToken);

router.get('/', restrictTo('admin', 'empleado', 'cajero'), getAllPagos);
// Pago con tarjeta por Payphone (RF-22): devuelve el enlace de pago.
router.post('/payphone/preparar', restrictTo('cliente'), prepararPagoPayphone);
router.get('/pedido/:pedidoId', getPagoByPedido);
router.get('/:id', getPagoById);
router.post('/', restrictTo('cliente', 'admin', 'empleado', 'cajero', 'cocinero'), createPago);
router.put('/:id', restrictTo('admin', 'empleado', 'cajero'), updatePago);
router.delete('/:id', restrictTo('admin'), deletePago);

export default router;