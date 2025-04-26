import { db } from './drizzle';
import { theaters, theaterSections, theaterRows, theaterSeats } from './schema';
import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';
import { v5 as uuidv5 } from 'uuid';
import { eq, and } from 'drizzle-orm';
interface VenueSection {
  label: string;
  subChart?: {
    rows?: Array<{
      label: string;
      displayLabel?: string;
      seats?: Array<{
        label: string;
        displayLabel?: string;
        accessible?: boolean;
        restrictedView?: boolean;
      }>;
    }>;
  };
}

const THEATER_DATA_DIR = path.join(process.cwd(), 'lib/db/scraped_data');
const UUID_NAMESPACE = '6ba7b810-9dad-11d1-80b4-00c04fd430c8'; // UUID namespace for deterministic generation

function cleanTheaterName(name: string): string {
  // Remove location markers (e.g., "NYC - ", "NY - ")
  let cleaned = name.replace(/^(?:[A-Z]+(?: - | -))/, '');
  
  // Split by " - " and look for the theater part
  const parts = cleaned.split(' - ');
  
  // Find the part that contains "Theatre" or "Theater", or contains a hyphenated name
  const theaterPart = parts.find(part => 
    part.includes('Theatre') || 
    part.includes('Theater') ||
    /[A-Za-z]+-[A-Za-z]+/.test(part) // Check for hyphenated names
  );
  
  if (theaterPart) {
    // If we found a theater part, clean it up
    cleaned = theaterPart
      // Remove parenthetical show names and status markers
      .replace(/\s*\([^)]*\)/g, '')
      // Remove " - " followed by show names, but preserve hyphenated names
      .replace(/(?<!-)\s*-\s*[^-]*$/, '')
      // Remove " - OFFICIAL", " - sectioned", etc.
      .replace(/\s*-\s*(?:OFFICIAL|sectioned|master|Copy|AV Update|TESSITURA|SECTIONED).*$/, '')
      // Remove trailing spaces and dashes
      .replace(/\s*-\s*$/, '')
      .trim();
  } else {
    // If no theater word found, just take the first part and clean it
    cleaned = parts[0]
      .replace(/\s*\([^)]*\)/g, '')
      .replace(/(?<!-)\s*-\s*[^-]*$/, '')
      .trim();
  }
  
  return cleaned;
}

async function loadTheaterData() {
  try {
    // First, clear existing data
    console.log('Clearing existing data...');
    await db.delete(theaterSeats);
    await db.delete(theaterRows);
    await db.delete(theaterSections);
    await db.delete(theaters);
    console.log('Existing data cleared successfully');

    // Load the CSV file to get basic theater information
    const csvData = fs.readFileSync(path.join(THEATER_DATA_DIR, 'theater_data.csv'), 'utf-8');
    const records = parse(csvData, {
      columns: true,
      skip_empty_lines: true,
    });

    let totalSeats = 0;

    // Load each theater's data
    for (const record of records) {
      const theaterName = record.theater;
      const jsonPath = path.join(THEATER_DATA_DIR, `${theaterName}.json`);
      
      if (!fs.existsSync(jsonPath)) {
        console.log(`No JSON file found for theater: ${theaterName}`);
        continue;
      }

      const jsonData = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
      const venueData = jsonData.venue.venueChartData;
      
      // Clean the theater name
      const cleanedName = cleanTheaterName(venueData.name);
      console.log(`Original name: ${venueData.name}`);
      console.log(`Cleaned name: ${cleanedName}`);
      
      // Insert theater record
      const [theater] = await db.insert(theaters).values({
        name: cleanedName,
        url: record.url || '',
        venueId: uuidv5(venueData.name, UUID_NAMESPACE) || null,
        venueSlug: theaterName,
      }).returning();

      let theaterSeatCount = 0;

      // Process sections from both categories and subChart
      const sectionsToProcess = new Set<{ label: string; key?: number; color?: string; parentSection?: string }>();

      // // Add sections from categories
      // if (venueData.categories?.list) {
      //   for (const category of venueData.categories.list) {
      //     sectionsToProcess.add({
      //       label: category.label.toUpperCase(),
      //       key: category.key,
      //       color: category.color,
      //     });
      //   }
      // }

      // Add sections from subChart if they're not already in the set
      if (venueData.subChart?.sections) {
        for (const section of venueData.subChart.sections) {
          if (!section.subChart) {
            sectionsToProcess.add({
              label: section.label.toUpperCase(),
            });
            continue;
          }
          // sectionsToProcess.add({
          //   label: section.label.toUpperCase(),
          // });
          for (const row of section.subChart.rows) {
            sectionsToProcess.add({
              label: row.sectionLabel ? row.sectionLabel.toUpperCase() : section.label.toUpperCase(),
              parentSection: section.label.toUpperCase(),
            });
          }
        }
      }

      // Process all sections
      for (const sectionData of sectionsToProcess) {
        
        // Skip sections with "CAN CAN!" in their name
        if (sectionData.label.includes('CAN CAN!')) {
          console.log(`Skipping section: ${sectionData.label}`);
          continue;
        }

        // Check if section already exists
        const existingSection = await db.select().from(theaterSections).where(
          and(
            eq(theaterSections.label, sectionData.label),
            eq(theaterSections.theaterId, theater.id)
          )
        );

        let section;
        if (existingSection.length === 0) {
          // Create new section if it doesn't exist
          [section] = await db.insert(theaterSections).values({
            theaterId: theater.id,
            name: sectionData.label,
            categoryKey: sectionData.key || null,
            label: sectionData.label,
            parentSection: sectionData.parentSection || null,
            color: sectionData.color || null,
          }).returning();
        } else {
          section = existingSection[0];
        }
      }

      for (const parentSection of venueData.subChart?.sections) {
        for (const row of parentSection.subChart.rows) {
          const sectionLabel = row.sectionLabel ? row.sectionLabel.toUpperCase() : parentSection.label.toUpperCase();
          
          // Find the existing section
          const [section] = await db.select().from(theaterSections).where(
            and(
              eq(theaterSections.label, sectionLabel),
              eq(theaterSections.theaterId, theater.id)
            )
          );

          if (!section) {
            console.error(`Section not found for label: ${sectionLabel}`);
            continue;
          }

          const [rowRecord] = await db.insert(theaterRows).values({
            sectionId: section.id,
            label: row.label,
            displayLabel: row.displayLabel || null,
          }).returning();

          if (row.seats) {
            const rowSeatCount = row.seats.length;
            theaterSeatCount += rowSeatCount;

            for (const seat of row.seats) {
              await db.insert(theaterSeats).values({
                rowId: rowRecord.id,
                seatNumber: seat.label,
                displayNumber: `${row.label}${seat.label}`,
                price: null,
                status: 'available',
                accessible: seat.accessible || false,
                x: seat.x,
                y: seat.y
              });
            }
          }
        }
      }

      totalSeats += theaterSeatCount;
      console.log(`Loaded ${theaterSeatCount} seats for theater: ${theaterName}`);
      // break;
    }

    console.log(`\nTotal seats loaded across all theaters: ${totalSeats}`);
    console.log('Theater data loading completed successfully');
  } catch (error) {
    console.error('Error loading theater data:', error);
    throw error;
  }
}

// Run the loader
loadTheaterData()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Failed to load theater data:', error);
    process.exit(1);
  }); 