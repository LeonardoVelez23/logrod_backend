'use strict';

// Los modelos Cliente y Empleado usan reset_password_token y
// reset_password_expires (OTP de recuperación), pero ninguna migración
// creaba esas columnas. Es idempotente: en bases donde ya se agregaron
// a mano no hace nada.
const TABLAS = ['Clientes', 'Empleados'];

module.exports = {
  up: async (queryInterface, Sequelize) => {
    for (const tabla of TABLAS) {
      const columnas = await queryInterface.describeTable(tabla);
      if (!columnas.reset_password_token) {
        await queryInterface.addColumn(tabla, 'reset_password_token', {
          type: Sequelize.STRING(255),
          allowNull: true
        });
      }
      if (!columnas.reset_password_expires) {
        await queryInterface.addColumn(tabla, 'reset_password_expires', {
          type: Sequelize.DATE,
          allowNull: true
        });
      }
    }
  },

  down: async (queryInterface) => {
    for (const tabla of TABLAS) {
      await queryInterface.removeColumn(tabla, 'reset_password_expires');
      await queryInterface.removeColumn(tabla, 'reset_password_token');
    }
  }
};
