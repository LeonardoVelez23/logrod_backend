import { Router } from 'express';
import { retornoPayphone } from '../controllers/payphoneController.js';

const router = Router();

// URL de respuesta de Payphone (PAYPHONE_RESPONSE_URL): <servidor>/pagos/payphone/retorno
router.get('/retorno', retornoPayphone);

export default router;
