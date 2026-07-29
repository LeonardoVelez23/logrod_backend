import { Pago, Pedido, Cliente } from '../models/index.js';

export const getAllPagos = async (req, res, next) => {
    try {
    const pagos = await Pago.findAll({
        include: {
        model: Pedido,
        as: 'pedido',
        attributes: ['id', 'fecha', 'hora', 'valor_total', 'estado', 'modalidad'],
        include: {
            model: Cliente,
            as: 'cliente',
            attributes: ['id', 'nombres', 'apellidos', 'identificacion']
        }
        },
        order: [['fecha', 'DESC']]
    });

    res.status(200).json({
        success: true,
        data: pagos
    });
    } catch (error) {
    next(error);
    }
};

export const getPagoById = async (req, res, next) => {
    try {
    const { id } = req.params;

    const pago = await Pago.findByPk(id, {
        include: {
        model: Pedido,
        as: 'pedido',
        attributes: ['id', 'fecha', 'hora', 'valor_total', 'estado', 'modalidad'],
        include: {
            model: Cliente,
            as: 'cliente',
            attributes: ['id', 'nombres', 'apellidos', 'identificacion', 'correo_electronico']
        }
        }
    });

    if (!pago) {
        return res.status(404).json({
        success: false,
        message: 'Pago no encontrado'
        });
    }

    res.status(200).json({
        success: true,
        data: pago
    });
    } catch (error) {
    next(error);
    }
};

export const getPagoByPedido = async (req, res, next) => {
    try {
    const { pedidoId } = req.params;

    const pago = await Pago.findOne({
        where: { pedido_id: pedidoId },
        include: {
        model: Pedido,
        as: 'pedido',
        attributes: ['id', 'fecha', 'valor_total', 'estado']
        }
    });

    if (!pago) {
        return res.status(404).json({
        success: false,
        message: 'No se encontró pago para este pedido'
        });
    }

    res.status(200).json({
        success: true,
        data: pago
    });
    } catch (error) {
    next(error);
    }
};

export const createPago = async (req, res, next) => {
    try {
    const { pedido_id, fecha, valor, metodo_pago,numero_referencia, estado } = req.body;

    if (!pedido_id || !fecha || valor === undefined || !metodo_pago) {
        return res.status(400).json({
        success: false,
        message: 'pedido_id, fecha, valor y metodo_pago son obligatorios'
        });
    }

    const metodosValidos = ['efectivo', 'tarjeta', 'transferencia'];
    if (!metodosValidos.includes(metodo_pago)) {
        return res.status(400).json({
        success: false,
        message: 'metodo_pago debe ser: efectivo, tarjeta o transferencia'
        });
    }

    const pedido = await Pedido.findByPk(pedido_id);
    if (!pedido) {
        return res.status(400).json({
        success: false,
        message: 'El pedido indicado no existe'
        });
    }

    const estadosQueYaAvanzaron = ['en preparación', 'listo', 'entregado'];
    if (pedido.estado === 'cancelado') {
        return res.status(400).json({
        success: false,
        message: 'No se puede registrar pago: el pedido está cancelado y no requiere pago'
        });
    }

    const pagoExistente = await Pago.findOne({ where: { pedido_id } });
    if (pagoExistente) {
        return res.status(400).json({
        success: false,
        message: 'Este pedido ya tiene un pago registrado'
        });
    }

    const estadoFinal = estado || 'pendiente';

    if (estadoFinal === 'aprobado') {
        const pagoAprobado = await Pago.findOne({
        where: {
            pedido_id,
            estado: 'aprobado'
        }
        });
        if (pagoAprobado) {
        return res.status(400).json({
            success: false,
            message: 'Este pedido ya tiene un pago aprobado'
        });
        }
    }

    const pago = await Pago.create({ 
    pedido_id, fecha, valor, metodo_pago,
    numero_referencia: numero_referencia?.trim() || null, 
    estado: estado || 'pendiente' 
    });

    const pagoCreado = await Pago.findByPk(pago.id, {
        include: {
        model: Pedido,
        as: 'pedido',
        attributes: ['id', 'fecha', 'valor_total', 'estado']
        }
    });

    res.status(201).json({
        success: true,
        message: 'Pago registrado correctamente',
        data: pagoCreado
    });
    } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
        return res.status(400).json({
        success: false,
        message: 'Este pedido ya tiene un pago registrado'
        });
    }
    next(error);
    }
};

export const updatePago = async (req, res, next) => {
    try {
    const { id } = req.params;
    const { fecha, valor, metodo_pago, numero_referencia, estado } = req.body;

    const pago = await Pago.findByPk(id, {
        include: {
        model: Pedido,
        as: 'pedido'
        }
    });

    if (!pago) {
        return res.status(404).json({
        success: false,
        message: 'Pago no encontrado'
        });
    }

    if (pago.pedido?.estado === 'cancelado' && estado === 'aprobado') {
        return res.status(400).json({
        success: false,
        message: 'No se puede aprobar un pago de un pedido cancelado'
        });
    }

    if (metodo_pago) {
        const metodosValidos = ['efectivo', 'tarjeta', 'transferencia'];
        if (!metodosValidos.includes(metodo_pago)) {
        return res.status(400).json({
            success: false,
            message: 'metodo_pago debe ser: efectivo, tarjeta o transferencia'
        });
        }
    }

    if (estado) {
        const estadosValidos = ['pendiente', 'aprobado', 'rechazado'];
        if (!estadosValidos.includes(estado)) {
        return res.status(400).json({
            success: false,
            message: 'estado debe ser: pendiente, aprobado o rechazado'
        });
        }

        if (estado === 'aprobado') {
        const pagoAprobado = await Pago.findOne({
            where: {
            pedido_id: pago.pedido_id,
            estado: 'aprobado'
            }
        });

        if (pagoAprobado && pagoAprobado.id !== pago.id) {
            return res.status(400).json({
            success: false,
            message: 'Este pedido ya tiene un pago aprobado'
            });
        }
        }
        
    }
    
    await pago.update({
        fecha: fecha ?? pago.fecha,
        valor: valor ?? pago.valor,
        metodo_pago: metodo_pago ?? pago.metodo_pago,
        numero_referencia: numero_referencia !== undefined
        ? (numero_referencia?.trim() || null)
        : pago.numero_referencia,
        estado: estado ?? pago.estado
    });

    const pagoActualizado = await Pago.findByPk(id, {
        include: {
        model: Pedido,
        as: 'pedido',
        attributes: ['id', 'fecha', 'valor_total', 'estado']
        }
    });

    res.status(200).json({
        success: true,
        message: 'Pago actualizado correctamente',
        data: pagoActualizado
    });
    } catch (error) {
    next(error);
    }
};

export const deletePago = async (req, res, next) => {
    try {
    const { id } = req.params;

    const pago = await Pago.findByPk(id);

    if (!pago) {
        return res.status(404).json({
        success: false,
        message: 'Pago no encontrado'
        });
    }

    await pago.destroy();

    res.status(200).json({
        success: true,
        message: 'Pago eliminado correctamente'
    });
    } catch (error) {
    next(error);
    }
};