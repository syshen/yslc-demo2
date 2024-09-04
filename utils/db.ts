/* Only can be imported in the server side code */
import { Pool } from 'pg';
import { Kysely, PostgresDialect } from 'kysely';
import { Database } from './database';

export const db = new Kysely<Database>({
  dialect: new PostgresDialect({
    pool: new Pool({
      user: process.env.DB_USER,
      host: process.env.DB_HOST,
      ssl: {
        rejectUnauthorized: false,
      },
      database: process.env.DB_NAME,
      password: process.env.DB_PASSWORD,
      port: parseInt(process.env.DB_PORT || '5432', 10),
    }),
  }),
});

export * from './database';
export { PaymentOption, PaymentState, OrderState } from './types';
