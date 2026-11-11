import { Empleado } from '../models/index.js';
import bcrypt from 'bcryptjs';
import { verificarOtp, otpLimpio } from '../services/otpService.js';

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

    // El personal que no es admin solo puede ver su propio perfil.
    if (req.user.rol !== 'admin' && String(req.user.id) !== String(id)) {
        return res.status(403).json({
        success: false,
        message: 'No tiene permisos para ver este perfil'
        });
    }

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
    const { identificacion, nombres, apellidos, correo_electronico, telefono, cargo, turno_trabajo, contrasenia } = req.body;

    if (!identificacion || !nombres || !apellidos || !correo_electronico || !contrasenia) {
        return res.status(400).json({
        success: false,
        message: 'Los campos identificacion, nombres, apellidos, correo_electronico y contrasenia son obligatorios'
        });
    }

    const salt = await bcrypt.genSalt(10);
    const contraseniaHasheada = await bcrypt.hash(contrasenia, salt);

    const empleado = await Empleado.create({
        identificacion: identificacion.trim(),
        nombres: nombres.trim(),
        apellidos: apellidos.trim(),
        correo_electronico: correo_electronico.trim().toLowerCase(),
        telefono: telefono?.trim() || null,
        cargo: cargo?.trim() || null,
        turno_trabajo: turno_trabajo?.trim() || null,
        contrasenia: contraseniaHasheada
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
    const { identificacion, nombres, apellidos, correo_electronico, telefono, cargo, turno_trabajo, contrasenia, otp } = req.body;

    if (req.user && req.user.rol !== 'admin' && String(req.user.id) !== String(id)) {
      return res.status(403).json({
        success: false,
        message: 'No tiene permisos para modificar este perfil'
      });
    }

    const empleado = await Empleado.findByPk(id);

    if (!empleado) {
        return res.status(404).json({
        success: false,
        message: 'Empleado no encontrado'
        });
    }

    // Solo el administrador cambia cargo y turno: el cargo define el rol,
    // así que un empleado podría darse permisos de admin.
    if (req.user.rol !== 'admin') {
        const normalizar = (valor) => (valor === undefined ? undefined : valor?.trim() || null);
        const cambiaCargo = cargo !== undefined && normalizar(cargo) !== empleado.cargo;
        const cambiaTurno =
            turno_trabajo !== undefined && normalizar(turno_trabajo) !== empleado.turno_trabajo;
        if (cambiaCargo || cambiaTurno) {
            return res.status(403).json({
                success: false,
                message: 'Solo el administrador puede cambiar el cargo o el turno de trabajo'
            });
        }
    }

    let cambioContrasenia = {};

    if (contrasenia) {
        if (!otp) {
            return res.status(400).json({
                success: false,
                message: 'Se requiere el código OTP de verificación para cambiar la contraseña.'
            });
        }

        if (!(await verificarOtp(empleado, otp))) {
            return res.status(400).json({
                success: false,
                message: 'El código OTP es incorrecto o ha expirado. Solicita uno nuevo.'
            });
        }

        const salt = await bcrypt.genSalt(10);
        cambioContrasenia = { contrasenia: await bcrypt.hash(contrasenia, salt), ...otpLimpio };
    }

    await empleado.update({
        identificacion: identificacion?.trim() ?? empleado.identificacion,
        nombres: nombres?.trim() ?? empleado.nombres,
        apellidos: apellidos?.trim() ?? empleado.apellidos,
        correo_electronico: correo_electronico?.trim().toLowerCase() ?? empleado.correo_electronico,
        telefono: telefono !== undefined ? (telefono?.trim() || null) : empleado.telefono,
        cargo: cargo !== undefined ? (cargo?.trim() || null) : empleado.cargo,
        turno_trabajo: turno_trabajo !== undefined ? (turno_trabajo?.trim() || null) : empleado.turno_trabajo,
        ...cambioContrasenia
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