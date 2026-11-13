'use strict';

/**
 * Eliminación de cuenta por el propio cliente (LOPDP; exigido por Google
 * Play y App Store). Sus datos personales se reemplazan y se marca la fecha;
 * los pedidos y pagos quedan anónimos para la contabilidad.
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('Clientes', 'eliminado_en', {
      type: Sequelize.DATE,
      allowNull: true
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('Clientes', 'eliminado_en');
  }
};
