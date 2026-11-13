import { Cliente } from '../models/index.js';
import { errorDeContrasenia } from '../utils/password.js';
import bcrypt from 'bcryptjs';
import { verificarOtp, otpLimpio } from '../services/otpService.js';
import { VERSION_LEGAL } from '../legal/documentos.js';

export const getAllClientes = async (req, res, next) => {
    try {
    const clientes = await Cliente.findAll({
        attributes: { exclude: ['contrasenia'] },
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

    // Un cliente solo puede ver su propio perfil.
    if (req.user.rol === 'cliente' && String(req.user.id) !== String(id)) {
        return res.status(403).json({
        success: false,
        message: 'No tiene permisos para ver este perfil'
        });
    }

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
    const {
        identificacion, nombres, apellidos, correo_electronico, telefono, tipo_cliente, contrasenia,
        acepta_terminos, version_legal
    } = req.body;

    if (!identificacion || !nombres || !apellidos || !correo_electronico || !tipo_cliente || !contrasenia) {
        return res.status(400).json({
        success: false,
        message: 'Los campos identificacion, nombres, apellidos, correo_electronico, tipo_cliente y contrasenia son obligatorios'
        });
    }

    const tiposValidos = ['Estudiante', 'Docente', 'Personal Administrativo', 'Persona externa'];
    if (!tiposValidos.includes(tipo_cliente)) {
        return res.status(400).json({
        success: false,
        message: 'tipo_cliente debe ser: Estudiante, Docente, Personal Administrativo o Persona externa'
        });
    }

    const errorContrasenia = errorDeContrasenia(contrasenia);
    if (errorContrasenia) {
        return res.status(400).json({ success: false, message: errorContrasenia });
    }

    // Quien se registra acepta los términos y la política de datos vigentes
    // (LOPDP). El personal que crea un cliente desde el panel no acepta por él.
    const esPersonal = Boolean(req.user) && req.user.rol !== 'cliente';
    let aceptacionLegal = {};
    if (!esPersonal) {
        if (acepta_terminos !== true) {
            return res.status(400).json({
            success: false,
            message: 'Debes aceptar los términos y condiciones y la política de protección de datos'
            });
        }
        if (version_legal !== VERSION_LEGAL) {
            return res.status(400).json({
            success: false,
            message: 'Los términos y condiciones se actualizaron. Revísalos y acéptalos de nuevo.'
            });
        }
        aceptacionLegal = { legal_version: VERSION_LEGAL, legal_aceptado_en: new Date() };
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
        contrasenia: contraseniaHasheada,
        ...aceptacionLegal
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
    const { identificacion, nombres, apellidos, correo_electronico, telefono, tipo_cliente, contrasenia, otp } = req.body;

    if (req.user && req.user.rol !== 'admin' && String(req.user.id) !== String(id)) {
      return res.status(403).json({
        success: false,
        message: 'No tiene permisos para modificar este perfil'
      });
    }

    const cliente = await Cliente.findByPk(id);

    if (!cliente) {
        return res.status(404).json({
        success: false,
        message: 'Cliente no encontrado'
        });
    }

    if (tipo_cliente) {
        const tiposValidos = ['Estudiante', 'Docente', 'Personal Administrativo', 'Persona externa'];
        if (!tiposValidos.includes(tipo_cliente)) {
        return res.status(400).json({
            success: false,
            message: 'tipo_cliente debe ser: Estudiante, Docente, Personal Administrativo o Persona externa'
        });
        }
    }

    let cambioContrasenia = {};

    if (contrasenia) {
        // La política se revisa antes del OTP para no gastar un intento.
        const errorContrasenia = errorDeContrasenia(contrasenia);
        if (errorContrasenia) {
            return res.status(400).json({ success: false, message: errorContrasenia });
        }

        // El administrador cambia la contraseña de otro usuario sin OTP; quien
        // cambia la suya propia necesita el código enviado a su correo.
        const cambioPorAdmin = req.user.rol === 'admin';

        if (!cambioPorAdmin && !otp) {
            return res.status(400).json({
                success: false,
                message: 'Se requiere el código OTP de verificación para cambiar la contraseña.'
            });
        }

        if (!cambioPorAdmin && !(await verificarOtp(cliente, otp))) {
            return res.status(400).json({
                success: false,
                message: 'El código OTP es incorrecto o ha expirado. Solicita uno nuevo.'
            });
        }

        const salt = await bcrypt.genSalt(10);
        cambioContrasenia = { contrasenia: await bcrypt.hash(contrasenia, salt), ...otpLimpio };
    }

    await cliente.update({
        identificacion: identificacion?.trim() ?? cliente.identificacion,
        nombres: nombres?.trim() ?? cliente.nombres,
        apellidos: apellidos?.trim() ?? cliente.apellidos,
        correo_electronico: correo_electronico?.trim().toLowerCase() ?? cliente.correo_electronico,
        telefono: telefono !== undefined ? (telefono?.trim() || null) : cliente.telefono,
        tipo_cliente: tipo_cliente ?? cliente.tipo_cliente,
        ...cambioContrasenia
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