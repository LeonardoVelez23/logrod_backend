import { Router } from 'express';
import { getAllEmpleados, getEmpleadoById, createEmpleado, updateEmpleado, deleteEmpleado } from '../controllers/empleadoController.js';

const router = Router();

router.get('/', getAllEmpleados);
router.get('/:id', getEmpleadoById);
router.post('/', createEmpleado);
router.put('/:id', updateEmpleado);
router.delete('/:id', deleteEmpleado);

export default router;