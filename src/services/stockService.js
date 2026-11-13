import { Producto } from '../models/index.js';

export const MAX_UNIDADES_POR_PRODUCTO = 50;

/** Error de regla de negocio: el controlador lo responde con `status`. */
export class ErrorNegocio extends Error {
  constructor(message, status = 400) {
    super(message);
    this.name = 'ErrorNegocio';
    this.status = status;
  }
}

/**
 * Valida las líneas del pedido y suma las cantidades de un mismo producto.
 * Devuelve un Map producto_id → cantidad total.
 */
export const agruparDetalles = (detalles) => {
  if (!Array.isArray(detalles) || detalles.length === 0) {
    throw new ErrorNegocio('detalles debe ser un array con al menos 1 producto');
  }

  const cantidades = new Map();
  for (const item of detalles) {
    const productoId = Number(item?.producto_id);
    const { cantidad } = item ?? {};
    if (!Number.isInteger(productoId) || productoId < 1 || !Number.isInteger(cantidad) || cantidad < 1) {
      throw new ErrorNegocio('Cada detalle debe tener producto_id y una cantidad entera >= 1');
    }
    cantidades.set(productoId, (cantidades.get(productoId) ?? 0) + cantidad);
  }

  for (const [productoId, cantidad] of cantidades) {
    if (cantidad > MAX_UNIDADES_POR_PRODUCTO) {
      throw new ErrorNegocio(
        `Cantidad máxima por producto: ${MAX_UNIDADES_POR_PRODUCTO} (producto id ${productoId})`
      );
    }
  }
  return cantidades;
};

/**
 * Bloquea (SELECT ... FOR UPDATE) las filas de los productos hasta que
 * termine la transacción. Siempre en orden de id para evitar deadlocks
 * entre pedidos simultáneos.
 */
const bloquearProductos = (ids, transaction) =>
  Producto.findAll({
    where: { id: [...ids] },
    order: [['id', 'ASC']],
    lock: transaction.LOCK.UPDATE,
    transaction
  });

/**
 * Comprueba existencia, disponibilidad y stock con las filas bloqueadas y
 * descuenta. Devuelve las líneas listas para DetallePedido y el total,
 * calculados con el precio vigente.
 */
export const reservarStock = async (cantidades, transaction) => {
  const productos = await bloquearProductos(cantidades.keys(), transaction);
  const porId = new Map(productos.map((p) => [p.id, p]));

  const lineas = [];
  let total = 0;
  for (const [productoId, cantidad] of cantidades) {
    const producto = porId.get(productoId);
    if (!producto) {
      throw new ErrorNegocio(`El producto con id ${productoId} no existe`);
    }
    if (producto.estado === 'no disponible') {
      throw new ErrorNegocio(`El producto "${producto.nombre}" no está disponible`);
    }
    if (producto.cantidad_disponible < cantidad) {
      throw new ErrorNegocio(
        `Stock insuficiente para "${producto.nombre}". Disponible: ${producto.cantidad_disponible}`
      );
    }

    const precioUnitario = Number(producto.precio);
    const subtotal = Math.round(precioUnitario * cantidad * 100) / 100;
    total += subtotal;
    lineas.push({ producto_id: productoId, cantidad, precio_unitario: precioUnitario, subtotal });
    await producto.decrement('cantidad_disponible', { by: cantidad, transaction });
  }

  return { lineas, total: Math.round(total * 100) / 100 };
};

/** Devuelve al stock las cantidades de las líneas de un pedido. */
export const devolverStock = async (detalles, transaction) => {
  const cantidades = new Map();
  for (const d of detalles) {
    cantidades.set(d.producto_id, (cantidades.get(d.producto_id) ?? 0) + d.cantidad);
  }
  if (cantidades.size === 0) return;

  const productos = await bloquearProductos(cantidades.keys(), transaction);
  for (const producto of productos) {
    await producto.increment('cantidad_disponible', {
      by: cantidades.get(producto.id),
      transaction
    });
  }
};
