import { Router } from 'express';
import { deleteFoto, getFoto, getPerfil, putFoto, updatePerfil } from '../controllers/perfilController.js';
import { verifyToken, restrictTo } from '../middlewares/authMiddleware.js';

const router = Router();

// Perfil del cliente de la sesión (app móvil).
router.use(verifyToken, restrictTo('cliente'));

router.get('/', getPerfil);
router.put('/', updatePerfil);
router.get('/foto', getFoto);
router.put('/foto', putFoto);
router.delete('/foto', deleteFoto);

export default router;
