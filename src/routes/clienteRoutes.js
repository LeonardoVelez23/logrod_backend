import { Router } from 'express';
import { getAllClientes, getClienteById, createCliente, updateCliente, deleteCliente } from '../controllers/clienteController.js';
import { verifyToken, restrictTo, tokenOpcional } from '../middlewares/authMiddleware.js';

const router = Router();

// Registro público; el personal también crea clientes desde el panel.
router.post('/', tokenOpcional, createCliente);
router.get('/', verifyToken, restrictTo('admin', 'empleado', 'cajero', 'mesero'), getAllClientes);
router.get('/:id', verifyToken, restrictTo('admin', 'cliente'), getClienteById);
router.put('/:id', verifyToken, restrictTo('admin', 'cliente'), updateCliente);
router.delete('/:id', verifyToken, restrictTo('admin'), deleteCliente);

export default router;