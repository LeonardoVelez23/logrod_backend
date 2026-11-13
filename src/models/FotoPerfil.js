import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

/** Foto de perfil de un cliente (una por cliente). */
class FotoPerfil extends Model {}

FotoPerfil.init({
  cliente_id: {
    type: DataTypes.INTEGER,
    primaryKey: true
  },
  datos: {
    type: DataTypes.BLOB,
    allowNull: false
  },
  // image/jpeg, image/png o image/webp (según los bytes, no lo que diga el cliente).
  tipo: {
    type: DataTypes.STRING(20),
    allowNull: false
  }
}, {
  sequelize,
  modelName: 'FotoPerfil',
  tableName: 'FotosPerfil',
  timestamps: true
});

export default FotoPerfil;
