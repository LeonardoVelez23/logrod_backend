import { Empleado } from '../models/index.js';

export const getAllEmpleados = async (req, res, next) => {
    try {
    const empleados = await Empleado.findAll({
        attributes: { exclude: ['contrasenia'] },
        order: [['apellidos', 'ASC'], ['nombres', 'ASC']]
    });

    res.status(200).json({
        success: true,
        data: empleados
    });
    } catch (error) {
    next(error);
    }
};

export const getEmpleadoById = async (req, res, next) => {
    try {
    const { id } = req.params;

    const empleado = await Empleado.findByPk(id, {
        attributes: { exclude: ['contrasenia'] }
    });

    if (!empleado) {
        return res.status(404).json({
        success: false,
        message: 'Empleado no encontrado'
        });
    }

    res.status(200).json({
        success: true,
        data: empleado
    });
    } catch (error) {
    next(error);
    }
};

export const createEmpleado = async (req, res, next) => {
    try {
    const { identificacion, nombres, apellidos, orreo_electronico, telefono, cargo, turno_trabajo, contrasenia } = req.body;

    if (!identificacion || !nombres || !apellidos || !correo_electronico || !contrasenia) {
        return res.status(400).json({
        success: false,
        message: 'Los campos identificacion, nombres, apellidos, correo_electronico y contrasenia son obligatorios'
        });
    }

    const empleado = await Empleado.create({
        identificacion: identificacion.trim(),
        nombres: nombres.trim(),
        apellidos: apellidos.trim(),
        correo_electronico: correo_electronico.trim().toLowerCase(),
        telefono: telefono?.trim() || null,
        cargo: cargo?.trim() || null,
        turno_trabajo: turno_trabajo?.trim() || null,
        contrasenia
    });

    const { contrasenia: _, ...empleadoSinPassword } = empleado.toJSON();

    res.status(201).json({
        success: true,
        message: 'Empleado creado correctamente',
        data: empleadoSinPassword
    });
    } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
        return res.status(400).json({
        success: false,
        message: 'Ya existe un empleado con esa identificación o correo electrónico'
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

export const updateEmpleado = async (req, res, next) => {
    try {
    const { id } = req.params;
    const { identificacion, nombres, apellidos, correo_electronico, telefono, cargo, turno_trabajo, contrasenia } = req.body;

    const empleado = await Empleado.findByPk(id);

    if (!empleado) {
        return res.status(404).json({
        success: false,
        message: 'Empleado no encontrado'
        });
    }

    await empleado.update({
        identificacion: identificacion?.trim() ?? empleado.identificacion,
        nombres: nombres?.trim() ?? empleado.nombres,
        apellidos: apellidos?.trim() ?? empleado.apellidos,
        correo_electronico: correo_electronico?.trim().toLowerCase() ?? empleado.correo_electronico,
        telefono: telefono !== undefined ? (telefono?.trim() || null) : empleado.telefono,
        cargo: cargo !== undefined ? (cargo?.trim() || null) : empleado.cargo,
        turno_trabajo: turno_trabajo !== undefined ? (turno_trabajo?.trim() || null) : empleado.turno_trabajo,
        contrasenia: contrasenia ?? empleado.contrasenia
    });

    const { contrasenia: _, ...empleadoSinPassword } = empleado.toJSON();

    res.status(200).json({
        success: true,
        message: 'Empleado actualizado correctamente',
        data: empleadoSinPassword
    });
    } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
        return res.status(400).json({
        success: false,
        message: 'Ya existe un empleado con esa identificación o correo electrónico'
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

export const deleteEmpleado = async (req, res, next) => {
    try {
    const { id } = req.params;

    const empleado = await Empleado.findByPk(id);

    if (!empleado) {
        return res.status(404).json({
        success: false,
        message: 'Empleado no encontrado'
        });
    }

    await empleado.destroy();

    res.status(200).json({
        success: true,
        message: 'Empleado eliminado correctamente'
    });
    } catch (error) {
    next(error);
    }
};