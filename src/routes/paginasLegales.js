import { Router } from 'express';
import { DOCUMENTOS_LEGALES, ELIMINAR_CUENTA } from '../legal/documentos.js';
import { paginaLegal } from '../legal/paginas.js';

const router = Router();

// URLs para Google Play / App Store: <servidor>/legal/privacidad, etc.
const PAGINAS = { ...DOCUMENTOS_LEGALES, 'eliminar-cuenta': ELIMINAR_CUENTA };

for (const [ruta, documento] of Object.entries(PAGINAS)) {
  const html = paginaLegal(documento);
  router.get(`/${ruta}`, (req, res) => {
    res.type('html').set('Cache-Control', 'public, max-age=3600').send(html);
  });
}

export default router;
