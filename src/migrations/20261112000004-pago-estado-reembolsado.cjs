'use strict';

/**
 * Nuevo estado de pago `reembolsado`: al cancelar un pedido con pago
 * aprobado, el dinero debe devolverse y deja de contar como ingreso
 * (RN-04, RN-13).
 */
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(
      `ALTER TYPE "enum_Pagos_estado" ADD VALUE IF NOT EXISTS 'reembolsado';`
    );
  },

  // Postgres no permite quitar un valor de un ENUM: se recrea el tipo.
  async down(queryInterface) {
    await queryInterface.sequelize.query(`
      UPDATE "Pagos" SET estado = 'rechazado' WHERE estado = 'reembolsado';
      ALTER TYPE "enum_Pagos_estado" RENAME TO "enum_Pagos_estado_old";
      CREATE TYPE "enum_Pagos_estado" AS ENUM ('pendiente', 'aprobado', 'rechazado');
      ALTER TABLE "Pagos" ALTER COLUMN estado DROP DEFAULT;
      ALTER TABLE "Pagos" ALTER COLUMN estado TYPE "enum_Pagos_estado"
        USING estado::text::"enum_Pagos_estado";
      ALTER TABLE "Pagos" ALTER COLUMN estado SET DEFAULT 'pendiente';
      DROP TYPE "enum_Pagos_estado_old";
    `);
  }
};
