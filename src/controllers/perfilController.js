import { Cliente, FotoPerfil } from '../models/index.js';
import { updateCliente } from './clienteController.js';

/** Tamaño máximo de la foto ya decodificada (la app la envía de 512 px). */
export const MAX_BYTES_FOTO = 600 * 1024;

/**
 * Perfil del cliente autenticado (RF-06): mismas reglas que
 * /clientes/:id, sin que la app tenga que conocer su id.
 */
const conMiId = (handler) => (req, res, next) => {
  req.params.id = String(req.user.id);
  return handler(req, res, next);
};

export const getPerfil = async (req, res, next) => {
  try {
    const cliente = await Cliente.findByPk(req.user.id, {
      attributes: { exclude: ['contrasenia'] },
      include: { model: FotoPerfil, as: 'foto', attributes: ['updatedAt'] }
    });
    if (!cliente) {
      return res.status(404).json({ success: false, message: 'Cliente no encontrado' });
    }
    const { foto, ...datos } = cliente.toJSON();
    res.status(200).json({
      success: true,
      data: { ...datos, foto_actualizada_en: foto?.updatedAt ?? null }
    });
  } catch (error) {
    next(error);
  }
};

export const updatePerfil = conMiId(updateCliente);

/** Tipo de imagen según sus primeros bytes. */
const tipoDeImagen = (bytes) => {
  if (bytes.length > 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return 'image/jpeg';
  }
  if (bytes.length > 8 && bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) {
    return 'image/png';
  }
  if (
    bytes.length > 12 &&
    bytes.subarray(0, 4).toString('ascii') === 'RIFF' &&
    bytes.subarray(8, 12).toString('ascii') === 'WEBP'
  ) {
    return 'image/webp';
  }
  return null;
};

const BASE64 = /^[A-Za-z0-9+/]+={0,2}$/;

/** PUT /perfil/foto  body {imagen: base64} — JPEG, PNG o WebP. */
export const putFoto = async (req, res, next) => {
  try {
    const { imagen } = req.body ?? {};
    if (typeof imagen !== 'string' || !BASE64.test(imagen)) {
      return res.status(400).json({ success: false, message: 'Envía la imagen en base64' });
    }
    const bytes = Buffer.from(imagen, 'base64');
    if (bytes.length > MAX_BYTES_FOTO) {
      return res.status(400).json({ success: false, message: 'La imagen es demasiado grande (máximo 600 KB)' });
    }
    const tipo = tipoDeImagen(bytes);
    if (!tipo) {
      return res.status(400).json({ success: false, message: 'La imagen debe ser JPEG, PNG o WebP' });
    }

    await FotoPerfil.upsert({ cliente_id: req.user.id, datos: bytes, tipo });
    const foto = await FotoPerfil.findByPk(req.user.id, { attributes: ['updatedAt'] });
    res.status(200).json({
      success: true,
      message: 'Foto actualizada',
      data: { foto_actualizada_en: foto.updatedAt }
    });
  } catch (error) {
    next(error);
  }
};

/** GET /perfil/foto → {tipo, imagen: base64, actualizada_en} o 404. */
export const getFoto = async (req, res, next) => {
  try {
    const foto = await FotoPerfil.findByPk(req.user.id);
    if (!foto) {
      return res.status(404).json({ success: false, message: 'No tienes foto de perfil' });
    }
    res.status(200).json({
      success: true,
      data: {
        tipo: foto.tipo,
        imagen: Buffer.from(foto.datos).toString('base64'),
        actualizada_en: foto.updatedAt
      }
    });
  } catch (error) {
    next(error);
  }
};

export const deleteFoto = async (req, res, next) => {
  try {
    await FotoPerfil.destroy({ where: { cliente_id: req.user.id } });
    res.status(200).json({ success: true, message: 'Foto eliminada' });
  } catch (error) {
    next(error);
  }
};
