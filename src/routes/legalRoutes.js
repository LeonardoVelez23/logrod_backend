import { Router } from 'express';
import { getLegal, getDocumentoLegal } from '../controllers/legalController.js';

const router = Router();

// Públicas: se leen antes de registrarse.
router.get('/', getLegal);
router.get('/:tipo', getDocumentoLegal);

export default router;
