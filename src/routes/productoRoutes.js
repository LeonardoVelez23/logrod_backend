import { Router } from 'express';
import { getAllProductos, getProductoById, createProducto, updateProducto, deleteProducto, uploadImagenProducto } from '../controllers/productoController.js';
import { verifyToken, restrictTo } from '../middlewares/authMiddleware.js';
import { uploadImagen } from '../middlewares/uploadMiddleware.js';

const router = Router();

router.get('/', getAllProductos);
router.get('/:id', getProductoById);
router.post('/', verifyToken, restrictTo('admin', 'empleado', 'cajero', 'cocinero'), createProducto);
router.put('/:id', verifyToken, restrictTo('admin', 'empleado', 'cajero', 'cocinero'), updateProducto);
router.post('/:id/imagen', verifyToken, restrictTo('admin', 'empleado', 'cajero', 'cocinero'), uploadImagen, uploadImagenProducto);
router.delete('/:id', verifyToken, restrictTo('admin'), deleteProducto);

export default router;