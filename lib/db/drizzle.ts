import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import dotenv from 'dotenv';

dotenv.config();

const url =
  process.env.NODE_ENV === 'production' ? process.env.DATABASE_URL : process.env.LOCAL_DATABASE_URL;
if (!url)
  throw new Error(
    `Connection string to ${process.env.NODE_ENV ? 'Neon' : 'local'} Postgres not found.`
  );

// if (!process.env.POSTGRES_URL) {
//   throw new Error('POSTGRES_URL environment variable is not set');
// }

export const client = postgres(url);
export const db = drizzle(client, { schema });
