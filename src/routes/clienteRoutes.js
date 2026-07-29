import { Router } from 'express';
import { getAllClientes, getClienteById, createCliente, updateCliente, deleteCliente } from '../controllers/clienteController.js';
import { verifyToken, restrictTo } from '../middlewares/authMiddleware.js';

const router = Router();

router.use(verifyToken);

router.get('/', restrictTo('admin'), getAllClientes);
router.post('/', restrictTo('admin'), createCliente);
router.get('/:id', restrictTo('admin', 'cliente'), getClienteById);
router.put('/:id', restrictTo('admin', 'cliente'), updateCliente);
router.delete('/:id', restrictTo('admin'), deleteCliente);

export default router;