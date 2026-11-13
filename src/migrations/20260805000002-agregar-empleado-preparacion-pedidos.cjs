'use strict';

// El modelo Pedido usa empleado_preparacion_id (cocinero que prepara el
// pedido, RF-18), pero ninguna migración creaba la columna: en una base
// nueva fallaba la creación de pedidos. Idempotente.
module.exports = {
  up: async (queryInterface, Sequelize) => {
    const columnas = await queryInterface.describeTable('Pedidos');
    if (columnas.empleado_preparacion_id) return;
    await queryInterface.addColumn('Pedidos', 'empleado_preparacion_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: { model: 'Empleados', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });
  },

  down: async (queryInterface) => {
    await queryInterface.removeColumn('Pedidos', 'empleado_preparacion_id');
  }
};
