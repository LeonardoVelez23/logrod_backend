import { Op } from 'sequelize';
import { Pedido, DetallePedido, Cliente, Empleado, Producto, Categoria, Pago, sequelize } from '../models/index.js';
import { ErrorNegocio, agruparDetalles, devolverStock, reservarStock } from '../services/stockService.js';
import { ahoraLocal } from '../utils/reloj.js';

const MODALIDADES = ['presencial', 'en línea'];
const ATRIBUTOS_CLIENTE = ['id', 'nombres', 'apellidos', 'identificacion', 'correo_electronico', 'telefono'];
const ATRIBUTOS_EMPLEADO = ['id', 'nombres', 'apellidos', 'cargo'];
const ATRIBUTOS_PRODUCTO = ['id', 'codigo', 'nombre', 'precio', 'imagen_codigo'];

const TRANSICIONES = {
    'solicitado': ['confirmado', 'en preparación', 'cancelado'],
    'confirmado': ['en preparación', 'cancelado'],
    'en preparación': ['listo', 'cancelado'],
    'listo': ['entregado', 'cancelado'],
    'entregado': [],
    'cancelado': []
};
const ESTADOS_CON_RESPONSABLE = ['confirmado', 'en preparación', 'listo', 'entregado'];

const includeCompleto = ({ conCategoria = false } = {}) => [
    { model: Cliente, as: 'cliente', attributes: ATRIBUTOS_CLIENTE },
    { model: Empleado, as: 'empleadoResponsable', attributes: ATRIBUTOS_EMPLEADO },
    { model: Empleado, as: 'empleadoPreparacion', attributes: ATRIBUTOS_EMPLEADO },
    {
        model: DetallePedido,
        as: 'detalles',
        include: {
            model: Producto,
            as: 'producto',
            attributes: ATRIBUTOS_PRODUCTO,
            ...(conCategoria && {
                include: { model: Categoria, as: 'categoria', attributes: ['id', 'nombre'] }
            })
        }
    }
];

/** Deshace la transacción y responde los errores de negocio; el resto va al errorHandler. */
const responderError = async (t, error, res, next) => {
    if (t && !t.finished) await t.rollback();
    if (error instanceof ErrorNegocio) {
        return res.status(error.status).json({ success: false, message: error.message });
    }
    return next(error);
};

/** null/'' → sin empleado; un id → debe existir. */
const empleadoValido = async (id, campo, transaction) => {
    if (id === undefined || id === null || id === '') return null;
    const empleado = await Empleado.findByPk(id, { transaction });
    if (!empleado) throw new ErrorNegocio(`El empleado indicado en ${campo} no existe`);
    return empleado.id;
};

export const getAllPedidos = async (req, res, next) => {
    try {
        const pedidos = await Pedido.findAll({
            include: includeCompleto(),
            order: [['createdAt', 'DESC']]
        });
        res.status(200).json({ success: true, data: pedidos });
    } catch (error) {
        next(error);
    }
};

/** Pedidos del cliente autenticado (app móvil y Seguimiento de la web). */
export const getMisPedidos = async (req, res, next) => {
    try {
        const pedidos = await Pedido.findAll({
            where: { cliente_id: req.user.id },
            include: [
                {
                    model: DetallePedido,
                    as: 'detalles',
                    include: { model: Producto, as: 'producto', attributes: ATRIBUTOS_PRODUCTO }
                },
                { model: Pago, as: 'pago', attributes: ['id', 'fecha', 'valor', 'metodo_pago', 'estado'] }
            ],
            order: [['id', 'DESC']]
        });
        res.status(200).json({ success: true, data: pedidos });
    } catch (error) {
        next(error);
    }
};

export const getPedidoById = async (req, res, next) => {
    try {
        const pedido = await Pedido.findByPk(req.params.id, {
            include: includeCompleto({ conCategoria: true })
        });

        if (!pedido) {
            return res.status(404).json({ success: false, message: 'Pedido no encontrado' });
        }

        // Un cliente solo puede ver sus propios pedidos.
        if (req.user.rol === 'cliente' && pedido.cliente_id !== req.user.id) {
            return res.status(403).json({ success: false, message: 'No tiene permisos para ver este pedido' });
        }

        res.status(200).json({ success: true, data: pedido });
    } catch (error) {
        next(error);
    }
};

/**
 * El cliente del pedido sale del token (o del cuerpo, si lo registra el
 * personal), y la fecha y hora del reloj del servidor. El stock se descuenta
 * con las filas de producto bloqueadas: dos pedidos simultáneos no pueden
 * vender la misma unidad.
 */
export const createPedido = async (req, res, next) => {
    const t = await sequelize.transaction();

    try {
        const { modalidad, detalles } = req.body;

        if (!MODALIDADES.includes(modalidad)) {
            throw new ErrorNegocio('modalidad debe ser: presencial o en línea');
        }
        const cantidades = agruparDetalles(detalles);

        const esCliente = req.user.rol === 'cliente';
        const clienteId = esCliente ? req.user.id : req.body.cliente_id;
        if (!clienteId) {
            throw new ErrorNegocio('cliente_id es obligatorio para registrar un pedido a nombre de un cliente');
        }
        const cliente = await Cliente.findByPk(clienteId, { transaction: t });
        if (!cliente) throw new ErrorNegocio('El cliente indicado no existe');

        // Un cliente no asigna personal a su pedido.
        const empleadoId = esCliente ? null : await empleadoValido(req.body.empleado_id, 'empleado_id', t);
        const empleadoPreparacionId = esCliente
            ? null
            : await empleadoValido(req.body.empleado_preparacion_id, 'empleado_preparacion_id', t);

        const { lineas, total } = await reservarStock(cantidades, t);
        const { fecha, hora } = ahoraLocal();

        const pedido = await Pedido.create(
            {
                fecha,
                hora,
                modalidad,
                estado: 'solicitado',
                valor_total: total,
                cliente_id: cliente.id,
                empleado_id: empleadoId,
                empleado_preparacion_id: empleadoPreparacionId
            },
            { transaction: t }
        );
        await DetallePedido.bulkCreate(
            lineas.map((linea) => ({ ...linea, pedido_id: pedido.id })),
            { transaction: t }
        );

        await t.commit();

        const pedidoCreado = await Pedido.findByPk(pedido.id, { include: includeCompleto() });
        res.status(201).json({
            success: true,
            message: 'Pedido creado correctamente',
            data: pedidoCreado
        });
    } catch (error) {
        return responderError(t, error, res, next);
    }
};

/**
 * Solo el personal avanza estados, asigna responsables o cancela: una vez
 * hecho el pedido, el cliente no puede cancelarlo (lo impide la ruta). El
 * pedido se bloquea para que dos cancelaciones simultáneas no devuelvan el
 * stock dos veces.
 */
export const updatePedido = async (req, res, next) => {
    const t = await sequelize.transaction();

    try {
        const { id } = req.params;
        const { estado, empleado_id, empleado_preparacion_id, modalidad } = req.body;
        const rol = req.user?.rol?.toLowerCase();

        const pedido = await Pedido.findByPk(id, { lock: t.LOCK.UPDATE, transaction: t });
        if (!pedido) throw new ErrorNegocio('Pedido no encontrado', 404);

        if (estado) {
            if (estado === 'cancelado' && rol === 'cocinero') {
                throw new ErrorNegocio('Los cocineros no tienen permiso para cancelar pedidos', 403);
            }
            const permitidos = TRANSICIONES[pedido.estado] || [];
            if (!permitidos.includes(estado)) {
                throw new ErrorNegocio(
                    `No se puede cambiar de "${pedido.estado}" a "${estado}". Transiciones válidas: ${permitidos.join(', ') || 'ninguna (estado final)'}`
                );
            }
        }

        const nuevoEstado = estado ?? pedido.estado;
        const nuevoEmpleado = empleado_id !== undefined ? empleado_id : pedido.empleado_id;
        if (ESTADOS_CON_RESPONSABLE.includes(nuevoEstado) && !nuevoEmpleado) {
            throw new ErrorNegocio('Debe asignar un empleado responsable para este estado del pedido');
        }
        if (empleado_id) await empleadoValido(empleado_id, 'empleado_id', t);
        if (empleado_preparacion_id) {
            await empleadoValido(empleado_preparacion_id, 'empleado_preparacion_id', t);
        }
        if (modalidad && !MODALIDADES.includes(modalidad)) {
            throw new ErrorNegocio('modalidad debe ser: presencial o en línea');
        }

        if (estado === 'cancelado') {
            const detalles = await DetallePedido.findAll({ where: { pedido_id: pedido.id }, transaction: t });
            await devolverStock(detalles, t);

            // Un pago pendiente ya no se cobrará; uno aprobado debe devolverse
            // y deja de contar como ingreso.
            const pago = await Pago.findOne({
                where: { pedido_id: pedido.id },
                lock: t.LOCK.UPDATE,
                transaction: t
            });
            if (pago?.estado === 'pendiente') {
                await pago.update({ estado: 'rechazado' }, { transaction: t });
            } else if (pago?.estado === 'aprobado') {
                await pago.update({ estado: 'reembolsado' }, { transaction: t });
            }
        }

        await pedido.update(
            {
                estado: nuevoEstado,
                empleado_id: nuevoEmpleado,
                empleado_preparacion_id:
                    empleado_preparacion_id !== undefined ? empleado_preparacion_id || null : pedido.empleado_preparacion_id,
                modalidad: modalidad ?? pedido.modalidad
            },
            { transaction: t }
        );

        await t.commit();

        const pedidoActualizado = await Pedido.findByPk(id, { include: includeCompleto() });
        res.status(200).json({
            success: true,
            message: 'Pedido actualizado correctamente',
            data: pedidoActualizado
        });
    } catch (error) {
        return responderError(t, error, res, next);
    }
};

export const deletePedido = async (req, res, next) => {
    const t = await sequelize.transaction();

    try {
        const { id } = req.params;
        const pedido = await Pedido.findByPk(id, { lock: t.LOCK.UPDATE, transaction: t });
        if (!pedido) throw new ErrorNegocio('Pedido no encontrado', 404);

        if (!['solicitado', 'cancelado'].includes(pedido.estado)) {
            throw new ErrorNegocio('Solo se pueden eliminar pedidos en estado solicitado o cancelado');
        }
        // El pago (rechazado o reembolsado) es parte del registro contable.
        if (await Pago.count({ where: { pedido_id: pedido.id }, transaction: t })) {
            throw new ErrorNegocio('No se puede eliminar un pedido que tiene un pago registrado');
        }

        const detalles = await DetallePedido.findAll({ where: { pedido_id: pedido.id }, transaction: t });
        // Al cancelar ya se devolvió el stock.
        if (pedido.estado !== 'cancelado') {
            await devolverStock(detalles, t);
        }

        await DetallePedido.destroy({ where: { pedido_id: pedido.id }, transaction: t });
        await pedido.destroy({ transaction: t });
        await t.commit();

        res.status(200).json({ success: true, message: 'Pedido eliminado correctamente' });
    } catch (error) {
        return responderError(t, error, res, next);
    }
};

export const getPedidoStats = async (req, res, next) => {
    try {
        // Filtro opcional por fecha del pedido: ?desde=YYYY-MM-DD&hasta=YYYY-MM-DD
        // (se puede mandar solo uno de los dos). Sin ninguno, se calcula sobre todo el histórico.
        const { desde, hasta } = req.query;

        const esFechaValida = (valor) => {
            if (!valor) return true;
            if (!/^\d{4}-\d{2}-\d{2}$/.test(valor)) return false;
            const fecha = new Date(valor);
            const [anio, mes, dia] = valor.split('-').map(Number);
            return !Number.isNaN(fecha.getTime())
                && fecha.getUTCFullYear() === anio
                && fecha.getUTCMonth() + 1 === mes
                && fecha.getUTCDate() === dia;
        };

        if (!esFechaValida(desde) || !esFechaValida(hasta)) {
            return res.status(400).json({
                success: false,
                message: 'Parámetros de fecha inválidos. Formato esperado YYYY-MM-DD'
            });
        }

        let pedidoWhere;
        if (desde && hasta) {
            pedidoWhere = { fecha: { [Op.between]: [desde, hasta] } };
        } else if (desde) {
            pedidoWhere = { fecha: { [Op.gte]: desde } };
        } else if (hasta) {
            pedidoWhere = { fecha: { [Op.lte]: hasta } };
        }

        const totalOrders = await Pedido.count(pedidoWhere ? { where: pedidoWhere } : undefined);

        let totalRevenue;
        if (pedidoWhere) {
            const pedidosFiltrados = await Pedido.findAll({ where: pedidoWhere, attributes: ['id'] });
            const idsFiltrados = pedidosFiltrados.map(p => p.id);
            const totalRevenueResult = idsFiltrados.length > 0
                ? await Pago.sum('valor', { where: { estado: 'aprobado', pedido_id: { [Op.in]: idsFiltrados } } })
                : 0;
            totalRevenue = Number(totalRevenueResult || 0);
        } else {
            const totalRevenueResult = await Pago.sum('valor', { where: { estado: 'aprobado' } });
            totalRevenue = Number(totalRevenueResult || 0);
        }

        // Los clientes registrados son un total global, no dependen del rango de fechas del pedido
        const totalClients = await Cliente.count();

        // Distribución por estado
        const distributionRaw = await Pedido.findAll({
            attributes: [
                'estado',
                [sequelize.fn('COUNT', sequelize.col('id')), 'count']
            ],
            where: pedidoWhere,
            group: ['estado']
        });

        const orderStatusDistribution = {};
        distributionRaw.forEach(item => {
            orderStatusDistribution[item.estado] = Number(item.getDataValue('count'));
        });

        const estadosPosibles = ['solicitado', 'confirmado', 'en preparación', 'listo', 'entregado', 'cancelado'];
        estadosPosibles.forEach(estado => {
            if (orderStatusDistribution[estado] === undefined) {
                orderStatusDistribution[estado] = 0;
            }
        });

        // Distribución por modalidad
        const modalityRaw = await Pedido.findAll({
            attributes: [
                'modalidad',
                [sequelize.fn('COUNT', sequelize.col('id')), 'count']
            ],
            where: pedidoWhere,
            group: ['modalidad']
        });

        const modalityDistribution = {
            presencial: 0,
            'en línea': 0,
            desconocida: 0
        };

        modalityRaw.forEach(item => {
            const modalidad = item.modalidad;
            const count = Number(item.getDataValue('count'));

            if (modalidad === 'presencial' || modalidad === 'en línea') {
                modalityDistribution[modalidad] = count;
            } else {
                // Cualquier modalidad no reconocida se acumula en "desconocida"
                modalityDistribution.desconocida += count;
            }
        });

        // Productos más populares
        const popularProducts = await DetallePedido.findAll({
            attributes: [
                'producto_id',
                [sequelize.fn('SUM', sequelize.col('cantidad')), 'total_vendido']
            ],
            include: [
                {
                    model: Producto,
                    as: 'producto',
                    attributes: ['nombre', 'precio']
                },
                {
                    model: Pedido,
                    as: 'pedido',
                    attributes: [],
                    // Los pedidos cancelados no son ventas.
                    where: { ...pedidoWhere, estado: { [Op.ne]: 'cancelado' } }
                }
            ],
            group: ['producto_id', 'producto.id'],
            order: [[sequelize.fn('SUM', sequelize.col('cantidad')), 'DESC']],
            limit: 5
        });

        const formattedPopular = popularProducts.map(item => ({
            id: item.producto_id,
            nombre: item.producto?.nombre || 'Producto Desconocido',
            precio: Number(item.producto?.precio || 0),
            totalVendido: Number(item.getDataValue('total_vendido'))
        }));

        res.status(200).json({
            success: true,
            data: {
                totalOrders,
                totalRevenue,
                totalClients,
                orderStatusDistribution,
                modalityDistribution,
                popularProducts: formattedPopular
            }
        });
    } catch (error) {
        next(error);
    }
};