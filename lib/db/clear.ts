import { db } from './drizzle';
import { theaters, theaterSeats } from './schema';

async function clearTheaterData() {
  try {
    await db.delete(theaterSeats);
    await db.delete(theaters);
    console.log('Theater data cleared successfully');
  } catch (error) {
    console.error('Error clearing theater data:', error);
    throw error;
  }
}

clearTheaterData()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Failed to clear theater data:', error);
    process.exit(1);
  }); 