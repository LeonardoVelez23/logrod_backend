'use strict';

module.exports = {
  up: async (queryInterface) => {
    // Postgres no permite renombrar/quitar valores de un ENUM existente, así que se reemplaza
    // el tipo completo. Los valores anteriores ('cliente', 'empleado', 'administrador') ya no
    // representan un rol de acceso real (nunca lo hicieron a nivel de login), así que todos los
    // registros existentes se migran a 'Persona externa' y el admin los corrige manualmente.
    await queryInterface.sequelize.query(`
      ALTER TYPE "enum_Clientes_tipo_cliente" RENAME TO "enum_Clientes_tipo_cliente_old";
    `);
    await queryInterface.sequelize.query(`
      CREATE TYPE "enum_Clientes_tipo_cliente" AS ENUM ('Estudiante', 'Docente', 'Personal Administrativo', 'Persona externa');
    `);
    await queryInterface.sequelize.query(`
      ALTER TABLE "Clientes"
      ALTER COLUMN "tipo_cliente" TYPE "enum_Clientes_tipo_cliente"
      USING ('Persona externa'::"enum_Clientes_tipo_cliente");
    `);
    await queryInterface.sequelize.query(`
      DROP TYPE "enum_Clientes_tipo_cliente_old";
    `);
  },

  down: async (queryInterface) => {
    await queryInterface.sequelize.query(`
      ALTER TYPE "enum_Clientes_tipo_cliente" RENAME TO "enum_Clientes_tipo_cliente_new";
    `);
    await queryInterface.sequelize.query(`
      CREATE TYPE "enum_Clientes_tipo_cliente" AS ENUM ('cliente', 'empleado', 'administrador');
    `);
    await queryInterface.sequelize.query(`
      ALTER TABLE "Clientes"
      ALTER COLUMN "tipo_cliente" TYPE "enum_Clientes_tipo_cliente"
      USING ('cliente'::"enum_Clientes_tipo_cliente");
    `);
    await queryInterface.sequelize.query(`
      DROP TYPE "enum_Clientes_tipo_cliente_new";
    `);
  }
};
