import { defineConfig } from 'vitest/config';

// Dos tipos de tests en tests/:
// - unit/ e integration/: simulan (vi.mock) los modelos, sin base de datos.
// - el resto: contra una base PostgreSQL aparte (logrod_test) que se recrea
//   con las migraciones en cada ejecución. Ver tests/globalSetup.js.
export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.js'],
    globalSetup: './tests/globalSetup.js',
    fileParallelism: false,
    testTimeout: 20000,
    hookTimeout: 60000,
    env: {
      NODE_ENV: 'test',
      DATABASE_URL:
        process.env.TEST_DATABASE_URL || 'postgres://logrod:logrod@localhost:5432/logrod_test',
      JWT_SECRET: 'secreto-solo-para-tests',
      RATE_LIMIT_ENABLED: 'false'
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.js'],
      exclude: ['src/index.js', 'src/seeders/**', 'src/migrations/**']
    }
  }
});
