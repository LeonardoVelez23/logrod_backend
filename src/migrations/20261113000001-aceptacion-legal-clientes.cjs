'use strict';

/**
 * Aceptación de los términos y la política de datos (LOPDP, RNF-21): qué
 * versión aceptó el cliente al registrarse y cuándo. Null en los clientes
 * creados antes de esta migración o por el personal desde el panel.
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('Clientes', 'legal_version', {
      type: Sequelize.STRING(20),
      allowNull: true
    });
    await queryInterface.addColumn('Clientes', 'legal_aceptado_en', {
      type: Sequelize.DATE,
      allowNull: true
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('Clientes', 'legal_aceptado_en');
    await queryInterface.removeColumn('Clientes', 'legal_version');
  }
};
