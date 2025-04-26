import postgres from 'postgres';
import dotenv from 'dotenv';

dotenv.config();

if (!process.env.POSTGRES_URL) {
  throw new Error('POSTGRES_URL environment variable is not set');
}

const sql = postgres(process.env.POSTGRES_URL);

async function dropTables() {
  try {
    // Drop all tables in the correct order (respecting foreign key constraints)
    await sql`DROP TABLE IF EXISTS activity_logs CASCADE`;
    await sql`DROP TABLE IF EXISTS invitations CASCADE`;
    await sql`DROP TABLE IF EXISTS team_members CASCADE`;
    await sql`DROP TABLE IF EXISTS teams CASCADE`;
    await sql`DROP TABLE IF EXISTS users CASCADE`;
    await sql`DROP TABLE IF EXISTS theater_seats CASCADE`;
    await sql`DROP TABLE IF EXISTS theater_rows CASCADE`;
    await sql`DROP TABLE IF EXISTS theater_sections CASCADE`;
    await sql`DROP TABLE IF EXISTS theaters CASCADE`;
    
    console.log('Successfully dropped all tables');
  } catch (error) {
    console.error('Error dropping tables:', error);
  } finally {
    await sql.end();
  }
}

dropTables(); 