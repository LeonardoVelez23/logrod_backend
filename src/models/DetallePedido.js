import { Model, DataTypes } from 'sequelize';
import { comoNumero } from './decimal.js';
import sequelize from '../config/database.js';

class DetallePedido extends Model {}

DetallePedido.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  pedido_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Pedidos',
      key: 'id'
    }
  },
  producto_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Productos',
      key: 'id'
    }
  },
  cantidad: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1
  },
  precio_unitario: {
    type: DataTypes.DECIMAL(10, 2),
    // Postgres devuelve NUMERIC como texto ("6.00"); la API envía número.
    get() {
      return comoNumero(this.getDataValue('precio_unitario'));
    },
    allowNull: false
  },
  subtotal: {
    type: DataTypes.DECIMAL(10, 2),
    // Postgres devuelve NUMERIC como texto ("6.00"); la API envía número.
    get() {
      return comoNumero(this.getDataValue('subtotal'));
    },
    allowNull: false
  }
}, {
  sequelize,
  modelName: 'DetallePedido',
  tableName: 'DetallePedidos',
  timestamps: true
});

export default DetallePedido;
