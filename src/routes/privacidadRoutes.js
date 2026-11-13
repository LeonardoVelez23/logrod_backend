import { Router } from 'express';
import { getMisDatos, eliminarMiCuenta } from '../controllers/privacidadController.js';
import { verifyToken, restrictTo } from '../middlewares/authMiddleware.js';

const router = Router();

router.use(verifyToken, restrictTo('cliente'));

router.get('/mis-datos', getMisDatos);
router.delete('/mi-cuenta', eliminarMiCuenta);

export default router;
