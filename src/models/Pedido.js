import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

class Pedido extends Model {}

Pedido.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  fecha: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  hora: {
    type: DataTypes.TIME,
    allowNull: false
  },
  modalidad: {
    type: DataTypes.ENUM('presencial', 'en línea'),
    allowNull: false
  },
  estado: {
    type: DataTypes.ENUM('solicitado', 'confirmado', 'en preparación', 'listo', 'entregado', 'cancelado'),
    allowNull: false,
    defaultValue: 'solicitado'
  },
  valor_total: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00
  },
  cliente_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Clientes',
      key: 'id'
    }
  },
  empleado_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'Empleados',
      key: 'id'
    }
  }
}, {
  sequelize,
  modelName: 'Pedido',
  tableName: 'Pedidos',
  timestamps: true
});

export default Pedido;
