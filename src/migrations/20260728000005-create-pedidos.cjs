'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('Pedidos', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      fecha: {
        type: Sequelize.DATEONLY,
        allowNull: false
      },
      hora: {
        type: Sequelize.TIME,
        allowNull: false
      },
      modalidad: {
        type: Sequelize.ENUM('presencial', 'en línea'),
        allowNull: false
      },
      estado: {
        type: Sequelize.ENUM('solicitado', 'confirmado', 'en preparación', 'listo', 'entregado', 'cancelado'),
        allowNull: false,
        defaultValue: 'solicitado'
      },
      valor_total: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.00
      },
      cliente_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Clientes',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      empleado_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'Empleados',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
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
    await queryInterface.dropTable('Pedidos');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_Pedidos_modalidad";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_Pedidos_estado";');
  }
};
