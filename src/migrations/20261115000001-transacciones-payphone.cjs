'use strict';

/**
 * Intentos de pago con tarjeta por Payphone (RF-22). Cada intento tiene su
 * propio `client_tx_id`; cuando Payphone lo aprueba se registra el Pago del
 * pedido. No guarda datos de la tarjeta ni del titular.
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('TransaccionesPayphone', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      pedido_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'Pedidos', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      client_tx_id: { type: Sequelize.STRING(50), allowNull: false, unique: true },
      monto: { type: Sequelize.DECIMAL(10, 2), allowNull: false },
      estado: {
        type: Sequelize.ENUM('iniciada', 'aprobada', 'cancelada'),
        allowNull: false,
        defaultValue: 'iniciada'
      },
      payphone_id: { type: Sequelize.BIGINT, allowNull: true },
      codigo_autorizacion: { type: Sequelize.STRING(50), allowNull: true },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false }
    });
    await queryInterface.addIndex('TransaccionesPayphone', ['pedido_id']);
    // Igual que el resto de tablas: sin acceso por la API REST de Supabase.
    await queryInterface.sequelize.query(
      'ALTER TABLE "TransaccionesPayphone" ENABLE ROW LEVEL SECURITY;'
    );
  },

  async down(queryInterface) {
    await queryInterface.dropTable('TransaccionesPayphone');
    await queryInterface.sequelize.query(
      'DROP TYPE IF EXISTS "enum_TransaccionesPayphone_estado";'
    );
  }
};
