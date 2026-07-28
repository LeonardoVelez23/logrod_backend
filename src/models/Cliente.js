import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

class Cliente extends Model {}

Cliente.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  identificacion: {
    type: DataTypes.STRING(20),
    allowNull: false,
    unique: true
  },
  nombres: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  apellidos: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  correo_electronico: {
    type: DataTypes.STRING(150),
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  telefono: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  tipo_cliente: {
    type: DataTypes.ENUM('estudiante', 'docente', 'administrativo'),
    allowNull: false
  },
  contrasenia: {
    type: DataTypes.STRING(255),
    allowNull: false
  }
}, {
  sequelize,
  modelName: 'Cliente',
  tableName: 'Clientes',
  timestamps: true
});

export default Cliente;
