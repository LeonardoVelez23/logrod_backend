import { Router } from 'express';
import { getAllPagos, getPagoById, getPagoByPedido, createPago, updatePago, deletePago } from '../controllers/pagoController.js';

const router = Router();

router.get('/', getAllPagos);
router.get('/pedido/:pedidoId', getPagoByPedido);
router.get('/:id', getPagoById);
router.post('/', createPago);
router.put('/:id', updatePago);
router.delete('/:id', deletePago);

export default router;