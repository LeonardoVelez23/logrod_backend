import { Router } from 'express';
import { getAllEmpleados, getEmpleadoById, createEmpleado, updateEmpleado, deleteEmpleado } from '../controllers/empleadoController.js';
import { verifyToken, restrictTo } from '../middlewares/authMiddleware.js';

const router = Router();

// Protect all routes below
router.use(verifyToken);

router.get('/', restrictTo('admin'), getAllEmpleados);
router.get('/:id', restrictTo('admin', 'empleado'), getEmpleadoById);
router.post('/', restrictTo('admin'), createEmpleado);
router.put('/:id', restrictTo('admin'), updateEmpleado);
router.delete('/:id', restrictTo('admin'), deleteEmpleado);

export default router;