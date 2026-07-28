import { Sequelize } from 'sequelize';
import { config } from './env.js';

if (!config.databaseUrl) {
  console.warn('WARNING: DATABASE_URL variable is not defined in the environment.');
}

const sequelize = new Sequelize(config.databaseUrl, {
  dialect: 'postgres',
  logging: config.nodeEnv === 'development' ? console.log : false,
  dialectOptions: {
    ssl: config.nodeEnv === 'production' || config.databaseUrl?.includes('supabase.co') ? {
      require: true,
      rejectUnauthorized: false
    } : false
  }
});

export default sequelize;
export { sequelize };
