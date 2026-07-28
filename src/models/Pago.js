import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

class Pago extends Model {}

Pago.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  pedido_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true, // One-to-one relationship constraint
    references: {
      model: 'Pedidos',
      key: 'id'
    }
  },
  fecha: {
    type: DataTypes.DATE,
    allowNull: false
  },
  valor: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  metodo_pago: {
    type: DataTypes.ENUM('efectivo', 'tarjeta', 'transferencia'),
    allowNull: false
  },
  numero_referencia: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  estado: {
    type: DataTypes.ENUM('pendiente', 'aprobado', 'rechazado'),
    allowNull: false,
    defaultValue: 'pendiente'
  }
}, {
  sequelize,
  modelName: 'Pago',
  tableName: 'Pagos',
  timestamps: true
});

export default Pago;
