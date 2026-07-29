import { Categoria } from '../models/index.js';

export const getAllCategorias = async (req, res, next) => {
    try {
    const categorias = await Categoria.findAll({
        order: [['nombre', 'ASC']]
    });

    res.status(200).json({
        success: true,
        data: categorias
    });
    } catch (error) {
    next(error);
    }
};

export const getCategoriaById = async (req, res, next) => {
    try {
    const { id } = req.params;

    const categoria = await Categoria.findByPk(id);

    if (!categoria) {
        return res.status(404).json({
        success: false,
        message: 'Categoría no encontrada'
        });
    }

    res.status(200).json({
        success: true,
        data: categoria
    });
    } catch (error) {
    next(error);
    }
};

export const createCategoria = async (req, res, next) => {
    try {
    const { nombre } = req.body;

    if (!nombre || nombre.trim() === '') {
        return res.status(400).json({
        success: false,
        message: 'El nombre de la categoría es obligatorio'
        });
    }

    const categoria = await Categoria.create({
        nombre: nombre.trim()
    });

    res.status(201).json({
        success: true,
        message: 'Categoría creada correctamente',
        data: categoria
    });
    } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
        return res.status(400).json({
        success: false,
        message: 'Ya existe una categoría con ese nombre'
        });
    }
    next(error);
    }
};

export const updateCategoria = async (req, res, next) => {
    try {
    const { id } = req.params;
    const { nombre } = req.body;

    const categoria = await Categoria.findByPk(id);

    if (!categoria) {
        return res.status(404).json({
        success: false,
        message: 'Categoría no encontrada'
        });
    }

    if (!nombre || nombre.trim() === '') {
        return res.status(400).json({
        success: false,
        message: 'El nombre de la categoría es obligatorio'
        });
    }

    await categoria.update({
        nombre: nombre.trim()
    });

    res.status(200).json({
        success: true,
        message: 'Categoría actualizada correctamente',
        data: categoria
    });
    } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
        return res.status(400).json({
        success: false,
        message: 'Ya existe una categoría con ese nombre'
        });
    }
    next(error);
    }
};

export const deleteCategoria = async (req, res, next) => {
    try {
    const { id } = req.params;

    const categoria = await Categoria.findByPk(id);

    if (!categoria) {
        return res.status(404).json({
        success: false,
        message: 'Categoría no encontrada'
        });
    }

    await categoria.destroy();

    res.status(200).json({
        success: true,
        message: 'Categoría eliminada correctamente'
    });
    } catch (error) {
    next(error);
    }
};