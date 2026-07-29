import { Router } from 'express';
import { getAllPedidos, getPedidoById, createPedido, updatePedido, deletePedido } from '../controllers/pedidoController.js';

const router = Router();

router.get('/', getAllPedidos);
router.get('/:id', getPedidoById);
router.post('/', createPedido);
router.put('/:id', updatePedido);
router.delete('/:id', deletePedido);

export default router;