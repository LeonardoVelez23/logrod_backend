import { execSync } from 'node:child_process';

// Recrea el esquema de la base de pruebas con las migraciones reales:
// así los tests también detectan migraciones que falten.
export default function setup() {
  const env = {
    ...process.env,
    NODE_ENV: 'development', // sequelize.cjs solo define development/production
    DATABASE_URL:
      process.env.TEST_DATABASE_URL || 'postgres://logrod:logrod@localhost:5432/logrod_test'
  };
  if (!env.DATABASE_URL.includes('_test')) {
    throw new Error(`Por seguridad, la base de pruebas debe llamarse *_test: ${env.DATABASE_URL}`);
  }
  execSync('npx sequelize-cli db:migrate:undo:all', { env, stdio: 'pipe' });
  execSync('npx sequelize-cli db:migrate', { env, stdio: 'pipe' });
}
