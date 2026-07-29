import { Router } from 'express';
import { getAllProductos, getProductoById, createProducto, updateProducto, deleteProducto
} from '../controllers/productoController.js';

const router = Router();

router.get('/', getAllProductos);
router.get('/:id', getProductoById);
router.post('/', createProducto);
router.put('/:id', updateProducto);
router.delete('/:id', deleteProducto);

export default router;