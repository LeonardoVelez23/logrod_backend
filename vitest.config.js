import { defineConfig } from 'vitest/config';

// Los tests usan una base PostgreSQL aparte (logrod_test) que se recrea
// con las migraciones en cada ejecución. Ver tests/globalSetup.js.
export default defineConfig({
  test: {
    environment: 'node',
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
    }
  }
});
