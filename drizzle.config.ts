import type { Config } from 'drizzle-kit';

const url =
  process.env.NODE_ENV === 'production' ? process.env.DATABASE_URL : process.env.LOCAL_DATABASE_URL;
if (!url)
  throw new Error(
    `Connection string to ${process.env.NODE_ENV ? 'Neon' : 'local'} Postgres not found.`
  );

export default {
  schema: './lib/db/schema.ts',
  out: './lib/db/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: url,
  },
} satisfies Config;
