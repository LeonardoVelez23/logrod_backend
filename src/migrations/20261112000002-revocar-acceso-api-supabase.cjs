'use strict';

/**
 * Quita a los roles de la API de Supabase (`anon`, `authenticated`) todo
 * permiso sobre las tablas y secuencias de `public`, actuales y futuras.
 *
 * Complementa 20261112000001-habilitar-rls: RLS filtra filas en SELECT,
 * INSERT, UPDATE y DELETE, pero no aplica a TRUNCATE, y Supabase concede
 * por defecto todos los permisos a esos roles. Este backend no usa la API
 * REST de Supabase, así que no los necesitan.
 *
 * En un Postgres local esos roles no existen y la migración no hace nada.
 */
const ROLES = ['anon', 'authenticated'];

const paraCadaRol = (sentencias) => `
DO $$
DECLARE r text;
BEGIN
  FOREACH r IN ARRAY ARRAY['${ROLES.join("','")}'] LOOP
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = r) THEN
      ${sentencias}
    END IF;
  END LOOP;
END $$;`;

module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(
      paraCadaRol(`
      EXECUTE format('REVOKE ALL ON ALL TABLES IN SCHEMA public FROM %I', r);
      EXECUTE format('REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM %I', r);
      EXECUTE format('ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM %I', r);
      EXECUTE format('ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON SEQUENCES FROM %I', r);`)
    );
  },

  async down(queryInterface) {
    // Restaura los permisos por defecto de Supabase.
    await queryInterface.sequelize.query(
      paraCadaRol(`
      EXECUTE format('GRANT ALL ON ALL TABLES IN SCHEMA public TO %I', r);
      EXECUTE format('GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO %I', r);
      EXECUTE format('ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO %I', r);
      EXECUTE format('ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO %I', r);`)
    );
  }
};
