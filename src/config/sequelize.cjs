require('dotenv').config();

module.exports = {
  development: {
    url: process.env.DATABASE_URL,
    dialect: 'postgres',
    // Igual que src/config/database.js: SSL solo con Supabase.
    // Un Postgres local (compose.yaml) no acepta SSL.
    dialectOptions: {
      ssl: process.env.DATABASE_URL?.includes('supabase')
        ? { require: true, rejectUnauthorized: false }
        : false
    }
  },
  production: {
    url: process.env.DATABASE_URL,
    dialect: 'postgres',
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    }
  }
};
