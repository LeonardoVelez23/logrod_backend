'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('Empleados', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      identificacion: {
        type: Sequelize.STRING(20),
        allowNull: false,
        unique: true
      },
      nombres: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      apellidos: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      correo_electronico: {
        type: Sequelize.STRING(150),
        allowNull: false,
        unique: true
      },
      telefono: {
        type: Sequelize.STRING(20),
        allowNull: true
      },
      cargo: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      turno_trabajo: {
        type: Sequelize.STRING(50),
        allowNull: true
      },
      contrasenia: {
        type: Sequelize.STRING(255),
        allowNull: false
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
    await queryInterface.dropTable('Empleados');
  }
};
