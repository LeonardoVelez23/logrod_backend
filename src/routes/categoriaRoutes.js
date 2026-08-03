import { Router } from 'express';
import { getAllCategorias, getCategoriaById, createCategoria, updateCategoria, deleteCategoria
} from '../controllers/categoriaController.js';
import { verifyToken, restrictTo } from '../middlewares/authMiddleware.js';

const router = Router();

router.get('/', getAllCategorias);
router.get('/:id', getCategoriaById);
router.post('/', verifyToken, restrictTo('admin', 'empleado', 'cajero'), createCategoria);
router.put('/:id', verifyToken, restrictTo('admin', 'empleado', 'cajero'), updateCategoria);
router.delete('/:id', verifyToken, restrictTo('admin'), deleteCategoria);

export default router;