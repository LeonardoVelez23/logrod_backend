import { Cliente } from '../models/index.js';
import bcrypt from 'bcryptjs';

export const getAllClientes = async (req, res, next) => {
    try {
    const clientes = await Cliente.findAll({
      attributes: { exclude: ['contrasenia'] }, // No devolver la contraseña
        order: [['apellidos', 'ASC'], ['nombres', 'ASC']]
    });

    res.status(200).json({
        success: true,
        data: clientes
    });
    } catch (error) {
    next(error);
    }
};

export const getClienteById = async (req, res, next) => {
    try {
    const { id } = req.params;

    const cliente = await Cliente.findByPk(id, {
        attributes: { exclude: ['contrasenia'] }
    });

    if (!cliente) {
        return res.status(404).json({
        success: false,
        message: 'Cliente no encontrado'
        });
    }

    res.status(200).json({
        success: true,
        data: cliente
    });
    } catch (error) {
    next(error);
    }
};

export const createCliente = async (req, res, next) => {
    try {
    const { identificacion, nombres, apellidos, correo_electronico, telefono, tipo_cliente, contrasenia } = req.body;

    if (!identificacion || !nombres || !apellidos || !correo_electronico || !tipo_cliente || !contrasenia) {
        return res.status(400).json({
        success: false,
        message: 'Los campos identificacion, nombres, apellidos, correo_electronico, tipo_cliente y contrasenia son obligatorios'
        });
    }

    const tiposValidos = ['estudiante', 'docente', 'administrativo'];
    if (!tiposValidos.includes(tipo_cliente)) {
        return res.status(400).json({
        success: false,
        message: 'tipo_cliente debe ser: estudiante, docente o administrativo'
        });
    }

    const salt = await bcrypt.genSalt(10);
    const contraseniaHasheada = await bcrypt.hash(contrasenia, salt);

    const cliente = await Cliente.create({
        identificacion: identificacion.trim(),
        nombres: nombres.trim(),
        apellidos: apellidos.trim(),
        correo_electronico: correo_electronico.trim().toLowerCase(),
        telefono: telefono?.trim() || null,
        tipo_cliente,
        contrasenia: contraseniaHasheada
    });

    const { contrasenia: _, ...clienteSinPassword } = cliente.toJSON();

    res.status(201).json({
        success: true,
        message: 'Cliente creado correctamente',
        data: clienteSinPassword
    });
    } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
        return res.status(400).json({
        success: false,
        message: 'Ya existe un cliente con esa identificación o correo electrónico'
        });
    }
    if (error.name === 'SequelizeValidationError') {
        return res.status(400).json({
        success: false,
        message: error.errors[0]?.message || 'Error de validación'
        });
    }
    next(error);
    }
};

export const updateCliente = async (req, res, next) => {
    try {
    const { id } = req.params;
    const { identificacion, nombres, apellidos, correo_electronico, telefono, tipo_cliente, contrasenia } = req.body;

    const cliente = await Cliente.findByPk(id);

    if (!cliente) {
        return res.status(404).json({
        success: false,
        message: 'Cliente no encontrado'
        });
    }

    if (tipo_cliente) {
        const tiposValidos = ['estudiante', 'docente', 'administrativo'];
        if (!tiposValidos.includes(tipo_cliente)) {
        return res.status(400).json({
            success: false,
            message: 'tipo_cliente debe ser: estudiante, docente o administrativo'
        });
        }
    }

    let contraseniaUpdate = cliente.contrasenia;
    if (contrasenia) {
        const salt = await bcrypt.genSalt(10);
        contraseniaUpdate = await bcrypt.hash(contrasenia, salt);
    }

    await cliente.update({
        identificacion: identificacion?.trim() ?? cliente.identificacion,
        nombres: nombres?.trim() ?? cliente.nombres,
        apellidos: apellidos?.trim() ?? cliente.apellidos,
        correo_electronico: correo_electronico?.trim().toLowerCase() ?? cliente.correo_electronico,
        telefono: telefono !== undefined ? (telefono?.trim() || null) : cliente.telefono,
        tipo_cliente: tipo_cliente ?? cliente.tipo_cliente,
        contrasenia: contraseniaUpdate
    });

    const { contrasenia: _, ...clienteSinPassword } = cliente.toJSON();

    res.status(200).json({
        success: true,
        message: 'Cliente actualizado correctamente',
        data: clienteSinPassword
    });
    } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
        return res.status(400).json({
        success: false,
        message: 'Ya existe un cliente con esa identificación o correo electrónico'
        });
    }
    if (error.name === 'SequelizeValidationError') {
        return res.status(400).json({
        success: false,
        message: error.errors[0]?.message || 'Error de validación'
        });
    }
    next(error);
    }
};

export const deleteCliente = async (req, res, next) => {
    try {
    const { id } = req.params;

    const cliente = await Cliente.findByPk(id);

    if (!cliente) {
        return res.status(404).json({
        success: false,
        message: 'Cliente no encontrado'
        });
    }

    await cliente.destroy();

    res.status(200).json({
        success: true,
        message: 'Cliente eliminado correctamente'
    });
    } catch (error) {
    next(error);
    }
};