import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

class Categoria extends Model {}

Categoria.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nombre: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true
  }
}, {
  sequelize,
  modelName: 'Categoria',
  tableName: 'Categorias',
  timestamps: true
});

export default Categoria;
