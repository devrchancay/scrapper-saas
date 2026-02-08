import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from './schema';

const globalForDb = globalThis as unknown as {
  db: ReturnType<typeof createDb>;
};

function createDb() {
  return drizzle({
    connection: { connectionString: process.env.DATABASE_URL! },
    schema,
  });
}

export const db = globalForDb.db ?? createDb();

if (process.env.NODE_ENV !== 'production') {
  globalForDb.db = db;
}

export type Database = typeof db;
