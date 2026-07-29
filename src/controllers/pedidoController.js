import { Pedido, DetallePedido, Cliente, Empleado, Producto, Categoria, sequelize } from '../models/index.js';

export const getAllPedidos = async (req, res, next) => {
    try {
    const pedidos = await Pedido.findAll({
        include: [
        {
            model: Cliente,
            as: 'cliente',
            attributes: ['id', 'nombres', 'apellidos', 'identificacion', 'correo_electronico']
        },
        {
            model: Empleado,
            as: 'empleadoResponsable',
            attributes: ['id', 'nombres', 'apellidos', 'cargo']
        },
        {
            model: DetallePedido,
            as: 'detalles',
            include: {
            model: Producto,
            as: 'producto',
            attributes: ['id', 'codigo', 'nombre', 'precio']
            }
        }
        ],
        order: [['createdAt', 'DESC']]
    });

    res.status(200).json({
        success: true,
        data: pedidos
    });
    } catch (error) {
    next(error);
    }
};

export const getPedidoById = async (req, res, next) => {
    try {
    const { id } = req.params;

    const pedido = await Pedido.findByPk(id, {
        include: [
        {
            model: Cliente,
            as: 'cliente',
            attributes: ['id', 'nombres', 'apellidos', 'identificacion', 'correo_electronico', 'telefono']
        },
        {
            model: Empleado,
            as: 'empleadoResponsable',
            attributes: ['id', 'nombres', 'apellidos', 'cargo']
        },
        {
            model: DetallePedido,
            as: 'detalles',
            include: {
            model: Producto,
            as: 'producto',
            attributes: ['id', 'codigo', 'nombre', 'precio'],
            include: {
                model: Categoria,
                as: 'categoria',
                attributes: ['id', 'nombre']
            }
            }
        }
        ]
    });

    if (!pedido) {
        return res.status(404).json({
        success: false,
        message: 'Pedido no encontrado'
        });
    }

    res.status(200).json({
        success: true,
        data: pedido
    });
    } catch (error) {
    next(error);
    }
};

export const createPedido = async (req, res, next) => {
    const t = await sequelize.transaction();

    try {
    const { fecha, hora, modalidad, cliente_id, empleado_id, detalles } = req.body;

    if (!fecha || !hora || !modalidad || !cliente_id || !detalles || !Array.isArray(detalles) || detalles.length === 0) {
        await t.rollback();
        return res.status(400).json({
        success: false,
        message: 'fecha, hora, modalidad, cliente_id y detalles (array con al menos 1 producto) son obligatorios'
        });
    }

    const modalidadesValidas = ['presencial', 'en línea'];
    if (!modalidadesValidas.includes(modalidad)) {
        await t.rollback();
        return res.status(400).json({
        success: false,
        message: 'modalidad debe ser: presencial o en línea'
        });
    }

    const cliente = await Cliente.findByPk(cliente_id, { transaction: t });
    if (!cliente) {
        await t.rollback();
        return res.status(400).json({
        success: false,
        message: 'El cliente indicado no existe'
        });
    }

    if (empleado_id) {
        const empleado = await Empleado.findByPk(empleado_id, { transaction: t });
        if (!empleado) {
        await t.rollback();
        return res.status(400).json({
            success: false,
            message: 'El empleado indicado no existe'
        });
        }
    }

    let valorTotal = 0;
    const detallesProcesados = [];

    for (const item of detalles) {
        if (!item.producto_id || !item.cantidad || item.cantidad < 1) {
        await t.rollback();
        return res.status(400).json({
            success: false,
            message: 'Cada detalle debe tener producto_id y cantidad >= 1'
        });
        }

        const producto = await Producto.findByPk(item.producto_id, { transaction: t });
        if (!producto) {
        await t.rollback();
        return res.status(400).json({
            success: false,
            message: `El producto con id ${item.producto_id} no existe`
        });
        }

        if (producto.estado === 'no disponible') {
        await t.rollback();
        return res.status(400).json({
            success: false,
            message: `El producto "${producto.nombre}" no está disponible`
        });
        }

        if (producto.cantidad_disponible < item.cantidad) {
        await t.rollback();
        return res.status(400).json({
            success: false,
            message: `Stock insuficiente para "${producto.nombre}". Disponible: ${producto.cantidad_disponible}`
        });
        }

        const precioUnitario = Number(producto.precio);
        const subtotal = precioUnitario * item.cantidad;
        valorTotal += subtotal;

        detallesProcesados.push({
        producto_id: item.producto_id,
        cantidad: item.cantidad,
        precio_unitario: precioUnitario,
        subtotal,
        producto
        });
    }

    const pedido = await Pedido.create({ fecha, hora, modalidad, estado: 'solicitado', valor_total: valorTotal, cliente_id, empleado_id: empleado_id || null }, { transaction: t });

    for (const item of detallesProcesados) {
        await DetallePedido.create({
        pedido_id: pedido.id,
        producto_id: item.producto_id,
        cantidad: item.cantidad,
        precio_unitario: item.precio_unitario,
        subtotal: item.subtotal
        }, { transaction: t });

        await item.producto.update({
        cantidad_disponible: item.producto.cantidad_disponible - item.cantidad
        }, { transaction: t });
    }

    await t.commit();

    const pedidoCreado = await Pedido.findByPk(pedido.id, {
        include: [
        {
            model: Cliente,
            as: 'cliente',
            attributes: ['id', 'nombres', 'apellidos', 'identificacion']
        },
        {
            model: DetallePedido,
            as: 'detalles',
            include: {
            model: Producto,
            as: 'producto',
            attributes: ['id', 'codigo', 'nombre', 'precio']
            }
        }
        ]
    });

    res.status(201).json({
        success: true,
        message: 'Pedido creado correctamente',
        data: pedidoCreado
    });
    } catch (error) {
    await t.rollback();
    next(error);
    }
};

export const updatePedido = async (req, res, next) => {
    try {
    const { id } = req.params;
    const { estado, empleado_id, modalidad } = req.body;

    const pedido = await Pedido.findByPk(id);

    if (!pedido) {
        return res.status(404).json({
        success: false,
        message: 'Pedido no encontrado'
        });
    }

    const estadosValidos = ['solicitado', 'confirmado', 'en preparación', 'listo', 'entregado', 'cancelado'];
    if (estado && !estadosValidos.includes(estado)) {
        return res.status(400).json({
        success: false,
        message: `estado debe ser uno de: ${estadosValidos.join(', ')}`
        });
    }

    if (empleado_id) {
        const empleado = await Empleado.findByPk(empleado_id);
        if (!empleado) {
        return res.status(400).json({
            success: false,
            message: 'El empleado indicado no existe'
        });
        }
    }

    if (modalidad) {
        const modalidadesValidas = ['presencial', 'en línea'];
        if (!modalidadesValidas.includes(modalidad)) {
        return res.status(400).json({
            success: false,
            message: 'modalidad debe ser: presencial o en línea'
        });
        }
    }

    await pedido.update({
        estado: estado ?? pedido.estado,
        empleado_id: empleado_id !== undefined ? empleado_id : pedido.empleado_id,
        modalidad: modalidad ?? pedido.modalidad
    });

    const pedidoActualizado = await Pedido.findByPk(id, {
        include: [
        {
            model: Cliente,
            as: 'cliente',
            attributes: ['id', 'nombres', 'apellidos']
        },
        {
            model: Empleado,
            as: 'empleadoResponsable',
            attributes: ['id', 'nombres', 'apellidos']
        },
        {
            model: DetallePedido,
            as: 'detalles',
            include: {
            model: Producto,
            as: 'producto',
            attributes: ['id', 'codigo', 'nombre']
            }
        }
        ]
    });

    res.status(200).json({
        success: true,
        message: 'Pedido actualizado correctamente',
        data: pedidoActualizado
    });
    } catch (error) {
    next(error);
    }
};

export const deletePedido = async (req, res, next) => {
    const t = await sequelize.transaction();

    try {
    const { id } = req.params;

    const pedido = await Pedido.findByPk(id, {
        include: [{ model: DetallePedido, as: 'detalles' }],
        transaction: t
    });

    if (!pedido) {
        await t.rollback();
        return res.status(404).json({
        success: false,
        message: 'Pedido no encontrado'
        });
    }

    for (const detalle of pedido.detalles) {
        const producto = await Producto.findByPk(detalle.producto_id, { transaction: t });
        if (producto) {
        await producto.update({
            cantidad_disponible: producto.cantidad_disponible + detalle.cantidad
        }, { transaction: t });
        }
    }

    await DetallePedido.destroy({ where: { pedido_id: id }, transaction: t });
    await pedido.destroy({ transaction: t });

    await t.commit();

    res.status(200).json({
        success: true,
        message: 'Pedido eliminado correctamente'
    });
    } catch (error) {
    await t.rollback();
    next(error);
    }
};