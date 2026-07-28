'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('Pagos', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      pedido_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        unique: true,
        references: {
          model: 'Pedidos',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      fecha: {
        type: Sequelize.DATE,
        allowNull: false
      },
      valor: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      },
      metodo_pago: {
        type: Sequelize.ENUM('efectivo', 'tarjeta', 'transferencia'),
        allowNull: false
      },
      numero_referencia: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      estado: {
        type: Sequelize.ENUM('pendiente', 'aprobado', 'rechazado'),
        allowNull: false,
        defaultValue: 'pendiente'
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('Pagos');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_Pagos_metodo_pago";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_Pagos_estado";');
  }
};
