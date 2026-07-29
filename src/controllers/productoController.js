import { Producto, Categoria } from '../models/index.js';

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

    if (!codigo || !nombre || precio === undefined || !categoria_id) {
        return res.status(400).json({
        success: false,
        message: 'Los campos codigo, nombre, precio y categoria_id son obligatorios'
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
        categoria_id
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

    const producto = await Producto.findByPk(id);

    if (!producto) {
        return res.status(404).json({
        success: false,
        message: 'Producto no encontrado'
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
        categoria_id: categoria_id ?? producto.categoria_id
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