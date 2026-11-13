'use strict';

// Contador de intentos fallidos del OTP de recuperación: tras 5 errores
// el código queda invalidado (evita adivinarlo por fuerza bruta).
const TABLAS = ['Clientes', 'Empleados'];

module.exports = {
  up: async (queryInterface, Sequelize) => {
    for (const tabla of TABLAS) {
      const columnas = await queryInterface.describeTable(tabla);
      if (!columnas.reset_password_attempts) {
        await queryInterface.addColumn(tabla, 'reset_password_attempts', {
          type: Sequelize.INTEGER,
          allowNull: false,
          defaultValue: 0
        });
      }
    }
  },

  down: async (queryInterface) => {
    for (const tabla of TABLAS) {
      await queryInterface.removeColumn(tabla, 'reset_password_attempts');
    }
  }
};
