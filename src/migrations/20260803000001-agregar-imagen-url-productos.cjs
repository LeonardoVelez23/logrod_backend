'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Productos', 'imagen_url', {
      type: Sequelize.TEXT,
      allowNull: true
    });
  },

  down: async (queryInterface) => {
    await queryInterface.removeColumn('Productos', 'imagen_url');
  }
};