import { loadTheaterData } from './loadTheaterData';
import { db } from './drizzle';

await loadTheaterData(db)
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Failed to load theater data:', error);
    process.exit(1);
  });