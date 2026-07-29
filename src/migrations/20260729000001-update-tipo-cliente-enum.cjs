'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Para PostgreSQL, se añaden los nuevos valores al ENUM existente si aún no existen.
    await queryInterface.sequelize.query(`
      DO $$
      BEGIN
        IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_Clientes_tipo_cliente') THEN
          ALTER TYPE "enum_Clientes_tipo_cliente" ADD VALUE IF NOT EXISTS 'cliente';
          ALTER TYPE "enum_Clientes_tipo_cliente" ADD VALUE IF NOT EXISTS 'empleado';
          ALTER TYPE "enum_Clientes_tipo_cliente" ADD VALUE IF NOT EXISTS 'administrador';
        END IF;
      END
      $$;
    `);
  },

  down: async (queryInterface, Sequelize) => {
    // No es necesario revertir adicion de valores enum en PostgreSQL
  }
};
