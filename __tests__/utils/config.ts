
import { Options as SequelizeOptions } from 'sequelize';
export const postgresConfig: SequelizeOptions = {
  dialect: 'postgres',
  host: 'postgres.local',
  port: 5432,
  username: 'postgres',
  password: 'postgres',
  database: 'local',
  // schema: 'evntlog1',
  logging: false,
}

export const sqliteConfig: SequelizeOptions = {
  dialect: 'sqlite',
  storage: ':memory:',
  logging: false,
}
