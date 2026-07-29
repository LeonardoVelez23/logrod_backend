import { Router } from 'express';
import { getAllProductos, getProductoById, createProducto, updateProducto, deleteProducto } from '../controllers/productoController.js';
import { verifyToken, restrictTo } from '../middlewares/authMiddleware.js';

const router = Router();

router.get('/', getAllProductos);
router.get('/:id', getProductoById);
router.post('/', verifyToken, restrictTo('admin', 'empleado'), createProducto);
router.put('/:id', verifyToken, restrictTo('admin', 'empleado'), updateProducto);
router.delete('/:id', verifyToken, restrictTo('admin'), deleteProducto);

export default router;