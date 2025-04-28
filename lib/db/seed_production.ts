import { loadTheaterData } from './loadTheaterData';
import { seed } from './seed';
import { users } from './schema';
import { eq } from 'drizzle-orm';
import { neonConfig, Pool } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { WebSocket } from 'ws';
import * as schema from './schema';

const url =
  process.env.NODE_ENV === 'production' ? process.env.DATABASE_URL : process.env.LOCAL_DATABASE_URL;
if (!url)
  throw new Error(
    `Connection string to ${process.env.NODE_ENV ? 'Neon' : 'local'} Postgres not found.`
  );

// Configure Neon based on environment
if (process.env.NODE_ENV === 'production') {
  neonConfig.webSocketConstructor = WebSocket;
  neonConfig.poolQueryViaFetch = true;
} else {
  neonConfig.wsProxy = (host) => `${host}:5433/v1`;
  neonConfig.useSecureWebSocket = false;
  neonConfig.pipelineTLS = false;
  neonConfig.pipelineConnect = false;
}

const pool = new Pool({ connectionString: url });
const db = drizzle(pool, { schema });

async function seedProduction() {
  try {
    console.log('Starting production seeding...');
    
    // Check if test user already exists
    const existingUser = await db.select().from(users).where(eq(users.email, 'test@test.com'));
    
    if (existingUser.length === 0) {
      // First seed the base data (users, teams, etc.)
      console.log('Seeding base data...');
      await seed(db);
    } else {
      console.log('Test user already exists, skipping base seeding...');
    }
    
    // Then load theater data
    console.log('Loading theater data...');
    await loadTheaterData(db);
    
    console.log('Production seeding completed successfully');
  } catch (error) {
    console.error('Error during production seeding:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run the seeding process
seedProduction()
  .then(() => {
    console.log('Seeding process finished. Exiting...');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Seeding process failed:', error);
    process.exit(1);
  }); 