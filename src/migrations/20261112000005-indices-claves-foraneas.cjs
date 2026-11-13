'use strict';

/**
 * Postgres no indexa las claves foráneas por sí solo. Sin estos índices,
 * "mis pedidos", el detalle de un pedido, el catálogo por categoría y las
 * estadísticas por fecha recorren tablas completas al crecer los datos.
 * Idempotente.
 */
const INDICES = [
  ['Pedidos', 'cliente_id'],
  ['Pedidos', 'empleado_id'],
  ['Pedidos', 'empleado_preparacion_id'],
  ['Pedidos', 'fecha'],
  ['DetallePedidos', 'pedido_id'],
  ['DetallePedidos', 'producto_id'],
  ['Productos', 'categoria_id']
];

const nombre = (tabla, columna) => `${tabla.toLowerCase()}_${columna}_idx`;

module.exports = {
  async up(queryInterface) {
    for (const [tabla, columna] of INDICES) {
      await queryInterface.sequelize.query(
        `CREATE INDEX IF NOT EXISTS "${nombre(tabla, columna)}" ON "${tabla}" ("${columna}");`
      );
    }
  },

  async down(queryInterface) {
    for (const [tabla, columna] of INDICES) {
      await queryInterface.sequelize.query(`DROP INDEX IF EXISTS "${nombre(tabla, columna)}";`);
    }
  }
};
