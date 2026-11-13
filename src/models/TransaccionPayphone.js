import { Model, DataTypes } from 'sequelize';
import { comoNumero } from './decimal.js';
import sequelize from '../config/database.js';

/** Un intento de pago con tarjeta por Payphone (RF-22). */
class TransaccionPayphone extends Model {}

TransaccionPayphone.init({
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  pedido_id: { type: DataTypes.INTEGER, allowNull: false },
  // Identificador que enviamos a Payphone (clientTransactionId).
  client_tx_id: { type: DataTypes.STRING(50), allowNull: false, unique: true },
  monto: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    get() {
      return comoNumero(this.getDataValue('monto'));
    }
  },
  estado: {
    type: DataTypes.ENUM('iniciada', 'aprobada', 'cancelada'),
    allowNull: false,
    defaultValue: 'iniciada'
  },
  // Id de la transacción en Payphone (llega a la URL de respuesta).
  payphone_id: { type: DataTypes.BIGINT, allowNull: true },
  codigo_autorizacion: { type: DataTypes.STRING(50), allowNull: true }
}, {
  sequelize,
  modelName: 'TransaccionPayphone',
  tableName: 'TransaccionesPayphone',
  timestamps: true
});

export default TransaccionPayphone;
