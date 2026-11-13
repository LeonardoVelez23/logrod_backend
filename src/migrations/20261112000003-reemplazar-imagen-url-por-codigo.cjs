'use strict';

/**
 * Las imágenes de producto pasan a vivir en los assets de la app móvil.
 * La base solo guarda el nombre del archivo (`imagen_codigo`, p. ej.
 * `bandeja_paisa` → assets/images/productos/bandeja_paisa.webp) y se
 * retira `imagen_url` junto con la subida a Supabase Storage.
 *
 * Idempotente. El `down` recrea `imagen_url` vacía: las URLs no se
 * recuperan.
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    const columnas = await queryInterface.describeTable('Productos');
    if (!columnas.imagen_codigo) {
      await queryInterface.addColumn('Productos', 'imagen_codigo', {
        type: Sequelize.STRING(60),
        allowNull: true
      });
    }
    if (columnas.imagen_url) {
      await queryInterface.removeColumn('Productos', 'imagen_url');
    }
  },

  async down(queryInterface, Sequelize) {
    const columnas = await queryInterface.describeTable('Productos');
    if (!columnas.imagen_url) {
      await queryInterface.addColumn('Productos', 'imagen_url', {
        type: Sequelize.TEXT,
        allowNull: true
      });
    }
    if (columnas.imagen_codigo) {
      await queryInterface.removeColumn('Productos', 'imagen_codigo');
    }
  }
};
