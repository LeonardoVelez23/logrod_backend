import sequelize from '../config/database.js';
import Categoria from './Categoria.js';
import Producto from './Producto.js';
import Cliente from './Cliente.js';
import Empleado from './Empleado.js';
import Pedido from './Pedido.js';
import DetallePedido from './DetallePedido.js';
import Pago from './Pago.js';

// --- Asociaciones ---

// Categoria <-> Producto (Uno a Muchos)
Categoria.hasMany(Producto, { foreignKey: 'categoria_id', as: 'productos' });
Producto.belongsTo(Categoria, { foreignKey: 'categoria_id', as: 'categoria' });

// Cliente <-> Pedido (Uno a Muchos)
Cliente.hasMany(Pedido, { foreignKey: 'cliente_id', as: 'pedidos' });
Pedido.belongsTo(Cliente, { foreignKey: 'cliente_id', as: 'cliente' });

// Empleado <-> Pedido (Uno a Muchos)
Empleado.hasMany(Pedido, { foreignKey: 'empleado_id', as: 'pedidosAsignados' });
Pedido.belongsTo(Empleado, { foreignKey: 'empleado_id', as: 'empleadoResponsable' });

// Pedido <-> DetallePedido (Uno a Muchos)
Pedido.hasMany(DetallePedido, { foreignKey: 'pedido_id', as: 'detalles' });
DetallePedido.belongsTo(Pedido, { foreignKey: 'pedido_id', as: 'pedido' });

// Producto <-> DetallePedido (Uno a Muchos)
Producto.hasMany(DetallePedido, { foreignKey: 'producto_id', as: 'detallesPedido' });
DetallePedido.belongsTo(Producto, { foreignKey: 'producto_id', as: 'producto' });

// Pedido <-> Producto (Muchos a Muchos a través de DetallePedido)
Pedido.belongsToMany(Producto, {
  through: DetallePedido,
  foreignKey: 'pedido_id',
  otherKey: 'producto_id',
  as: 'productos'
});
Producto.belongsToMany(Pedido, {
  through: DetallePedido,
  foreignKey: 'producto_id',
  otherKey: 'pedido_id',
  as: 'pedidos'
});

// Pedido <-> Pago (Uno a Uno)
Pedido.hasOne(Pago, { foreignKey: 'pedido_id', as: 'pago' });
Pago.belongsTo(Pedido, { foreignKey: 'pedido_id', as: 'pedido' });

// Exportar todos los modelos y la conexión
export {
  sequelize,
  Categoria,
  Producto,
  Cliente,
  Empleado,
  Pedido,
  DetallePedido,
  Pago
};
