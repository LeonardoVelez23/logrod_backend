import { DOCUMENTOS_LEGALES, VERSION_LEGAL } from '../legal/documentos.js';

/** Versión vigente y documentos disponibles (la app la envía al registrarse). */
export const getLegal = (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      version: VERSION_LEGAL,
      documentos: Object.values(DOCUMENTOS_LEGALES).map(({ tipo, titulo }) => ({ tipo, titulo }))
    }
  });
};

/** Un documento completo: `terminos` o `privacidad`. */
export const getDocumentoLegal = (req, res) => {
  const documento = Object.hasOwn(DOCUMENTOS_LEGALES, req.params.tipo)
    ? DOCUMENTOS_LEGALES[req.params.tipo]
    : null;

  if (!documento) {
    return res.status(404).json({
      success: false,
      message: 'Documento no encontrado. Usa "terminos" o "privacidad".'
    });
  }

  res.status(200).json({ success: true, data: documento });
};
