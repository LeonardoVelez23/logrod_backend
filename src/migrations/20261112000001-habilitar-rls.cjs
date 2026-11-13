'use strict';

/**
 * Activa Row Level Security en todas las tablas, sin políticas.
 *
 * Supabase publica el esquema `public` en su API REST (PostgREST) con la
 * clave `anon`, que no es secreta. Sin RLS, cualquiera con esa clave podía
 * leer y modificar clientes, empleados (hash de contraseña incluido),
 * pedidos y pagos sin pasar por este backend.
 *
 * Con RLS activo y sin políticas, los roles `anon` y `authenticated` no ven
 * ninguna fila. El backend no se ve afectado: se conecta como dueño de las
 * tablas (`postgres` en Supabase, `logrod` en local), y el dueño omite RLS
 * mientras no se use FORCE ROW LEVEL SECURITY.
 */
const TABLAS = [
  'Categorias',
  'Productos',
  'Clientes',
  'Empleados',
  'Pedidos',
  'DetallePedidos',
  'Pagos',
  'SequelizeMeta'
];

module.exports = {
  async up(queryInterface) {
    for (const tabla of TABLAS) {
      await queryInterface.sequelize.query(
        `ALTER TABLE IF EXISTS "${tabla}" ENABLE ROW LEVEL SECURITY;`
      );
    }
  },

  async down(queryInterface) {
    for (const tabla of TABLAS) {
      await queryInterface.sequelize.query(
        `ALTER TABLE IF EXISTS "${tabla}" DISABLE ROW LEVEL SECURITY;`
      );
    }
  }
};
