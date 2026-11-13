'use strict';

/**
 * Foto de perfil del cliente (opcional). Va en su propia tabla para no
 * cargar los bytes cada vez que se lee un cliente. Se borra con el cliente
 * y al eliminar la cuenta.
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('FotosPerfil', {
      cliente_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        references: { model: 'Clientes', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      datos: { type: Sequelize.BLOB, allowNull: false },
      tipo: { type: Sequelize.STRING(20), allowNull: false },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false }
    });
    // Igual que el resto de tablas: sin acceso por la API REST de Supabase.
    await queryInterface.sequelize.query(
      'ALTER TABLE "FotosPerfil" ENABLE ROW LEVEL SECURITY;'
    );
  },

  async down(queryInterface) {
    await queryInterface.dropTable('FotosPerfil');
  }
};
