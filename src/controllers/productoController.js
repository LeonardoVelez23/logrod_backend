import { Producto, Categoria } from '../models/index.js';

// Las imágenes están en los assets de la app móvil: solo se guarda el nombre
// del archivo, sin extensión (assets/images/productos/<imagen_codigo>.webp).
const IMAGEN_CODIGO_REGEX = /^[a-z0-9_]{1,60}$/;
const MENSAJE_IMAGEN_CODIGO =
    'imagen_codigo solo admite minúsculas, números y guion bajo (máx. 60), p. ej. bandeja_paisa';

/** undefined = no se envió; '' o null = quitar la imagen; texto = código. */
const leerImagenCodigo = (valor) => {
    if (valor === undefined) return { valor: undefined };
    if (valor === null || String(valor).trim() === '') return { valor: null };
    const codigo = String(valor).trim();
    return IMAGEN_CODIGO_REGEX.test(codigo) ? { valor: codigo } : { error: MENSAJE_IMAGEN_CODIGO };
};

export const getAllProductos = async (req, res, next) => {
    try {
    const productos = await Producto.findAll({
        include: {
        model: Categoria,
        as: 'categoria',
        attributes: ['id', 'nombre']
        },
        order: [['nombre', 'ASC']]
    });

    res.status(200).json({
        success: true,
        data: productos
    });
    } catch (error) {
    next(error);
    }
};

export const getProductoById = async (req, res, next) => {
    try {
    const { id } = req.params;

    const producto = await Producto.findByPk(id, {
        include: {
        model: Categoria,
        as: 'categoria',
        attributes: ['id', 'nombre']
        }
    });

    if (!producto) {
        return res.status(404).json({
        success: false,
        message: 'Producto no encontrado'
        });
    }

    res.status(200).json({
        success: true,
        data: producto
    });
    } catch (error) {
    next(error);
    }
};

export const createProducto = async (req, res, next) => {
    try {
    const { codigo, nombre, descripcion, precio, cantidad_disponible, estado, categoria_id } = req.body;
    const imagen = leerImagenCodigo(req.body.imagen_codigo);

    if (!codigo || !nombre || precio === undefined || !categoria_id) {
        return res.status(400).json({
        success: false,
        message: 'Los campos codigo, nombre, precio y categoria_id son obligatorios'
        });
    }

    if (Number(precio) <= 0) {
        return res.status(400).json({
        success: false,
        message: 'El precio debe ser mayor a 0'
        });
    }

    if (cantidad_disponible !== undefined && Number(cantidad_disponible) < 0) {
        return res.status(400).json({
        success: false,
        message: 'La cantidad disponible no puede ser negativa'
        });
    }

    if (imagen.error) {
        return res.status(400).json({
        success: false,
        message: imagen.error
        });
    }

    if (estado && !['disponible', 'no disponible'].includes(estado)) {
        return res.status(400).json({
        success: false,
        message: 'estado debe ser: disponible o no disponible'
        });
    }

    const categoria = await Categoria.findByPk(categoria_id);
    if (!categoria) {
        return res.status(400).json({
        success: false,
        message: 'La categoría indicada no existe'
        });
    }

    const producto = await Producto.create({
        codigo: codigo.trim(),
        nombre: nombre.trim(),
        descripcion: descripcion?.trim() || null,
        precio,
        cantidad_disponible: cantidad_disponible ?? 0,
        estado: estado || 'disponible',
        categoria_id,
        imagen_codigo: imagen.valor ?? null
    });

    const productoCreado = await Producto.findByPk(producto.id, {
        include: {
        model: Categoria,
        as: 'categoria',
        attributes: ['id', 'nombre']
        }
    });

    res.status(201).json({
        success: true,
        message: 'Producto creado correctamente',
        data: productoCreado
    });
    } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
        return res.status(400).json({
        success: false,
        message: 'Ya existe un producto con ese código'
        });
    }
    next(error);
    }
};

export const updateProducto = async (req, res, next) => {
    try {
    const { id } = req.params;
    const { codigo, nombre, descripcion, precio, cantidad_disponible, estado, categoria_id } = req.body;
    const imagen = leerImagenCodigo(req.body.imagen_codigo);

    const producto = await Producto.findByPk(id);

    if (!producto) {
        return res.status(404).json({
        success: false,
        message: 'Producto no encontrado'
        });
    }

    if (precio !== undefined && Number(precio) <= 0) {
        return res.status(400).json({
        success: false,
        message: 'El precio debe ser mayor a 0'
        });
    }

    if (cantidad_disponible !== undefined && Number(cantidad_disponible) < 0) {
        return res.status(400).json({
        success: false,
        message: 'La cantidad disponible no puede ser negativa'
        });
    }

    if (imagen.error) {
        return res.status(400).json({
        success: false,
        message: imagen.error
        });
    }

    if (estado && !['disponible', 'no disponible'].includes(estado)) {
        return res.status(400).json({
        success: false,
        message: 'estado debe ser: disponible o no disponible'
        });
    }

    if (categoria_id) {
        const categoria = await Categoria.findByPk(categoria_id);
        if (!categoria) {
        return res.status(400).json({
            success: false,
            message: 'La categoría indicada no existe'
        });
        }
    }

    await producto.update({
        codigo: codigo?.trim() ?? producto.codigo,
        nombre: nombre?.trim() ?? producto.nombre,
        descripcion: descripcion !== undefined ? descripcion?.trim() || null : producto.descripcion,
        precio: precio ?? producto.precio,
        cantidad_disponible: cantidad_disponible ?? producto.cantidad_disponible,
        estado: estado ?? producto.estado,
        categoria_id: categoria_id ?? producto.categoria_id,
        imagen_codigo: imagen.valor !== undefined ? imagen.valor : producto.imagen_codigo
    });

    const productoActualizado = await Producto.findByPk(id, {
        include: {
        model: Categoria,
        as: 'categoria',
        attributes: ['id', 'nombre']
        }
    });

    res.status(200).json({
        success: true,
        message: 'Producto actualizado correctamente',
        data: productoActualizado
    });
    } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
        return res.status(400).json({
        success: false,
        message: 'Ya existe un producto con ese código'
        });
    }
    next(error);
    }
};

export const deleteProducto = async (req, res, next) => {
    try {
    const { id } = req.params;

    const producto = await Producto.findByPk(id);

    if (!producto) {
        return res.status(404).json({
        success: false,
        message: 'Producto no encontrado'
        });
    }

    await producto.destroy();

    res.status(200).json({
        success: true,
        message: 'Producto eliminado correctamente'
    });
    } catch (error) {
    next(error);
    }
};