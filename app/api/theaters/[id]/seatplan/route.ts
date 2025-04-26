import { db } from '@/lib/db/drizzle';
import { theaters, theaterSections, theaterRows, theaterSeats } from '@/lib/db/schema';
import { NextResponse } from 'next/server';
import { eq, asc } from 'drizzle-orm';

/**
 * Get the complete seat plan for a theater by ID
 * This endpoint returns all sections, rows, and seats for the given theater in a single request
 */
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const theaterId = parseInt(params.id);

  if (isNaN(theaterId)) {
    return NextResponse.json(
      { error: 'Invalid theater ID' },
      { status: 400 }
    );
  }

  try {
    // First verify the theater exists
    const theater = await db
      .select({
        id: theaters.id,
        name: theaters.name,
        venueSlug: theaters.venueSlug
      })
      .from(theaters)
      .where(eq(theaters.id, theaterId))
      .limit(1);

    if (!theater.length) {
      return NextResponse.json(
        { error: 'Theater not found' },
        { status: 404 }
      );
    }

    // Get all sections for this theater
    const sections = await db
      .select({
        id: theaterSections.id,
        name: theaterSections.name,
        categoryKey: theaterSections.categoryKey,
        color: theaterSections.color,
        theaterId: theaterSections.theaterId
      })
      .from(theaterSections)
      .where(eq(theaterSections.theaterId, theaterId))
      .orderBy(asc(theaterSections.name));

    // For each section, get all rows
    const sectionsWithRows = await Promise.all(
      sections.map(async (section) => {
        const rows = await db
          .select({
            id: theaterRows.id,
            label: theaterRows.label,
            displayLabel: theaterRows.displayLabel,
            sectionId: theaterRows.sectionId
          })
          .from(theaterRows)
          .where(eq(theaterRows.sectionId, section.id))
          .orderBy(asc(theaterRows.label));

        // For each row, get all seats
        const rowsWithSeats = await Promise.all(
          rows.map(async (row) => {
            const seats = await db
              .select({
                id: theaterSeats.id,
                seatNumber: theaterSeats.seatNumber,
                displayNumber: theaterSeats.displayNumber,
                price: theaterSeats.price,
                status: theaterSeats.status,
                accessible: theaterSeats.accessible,
                x: theaterSeats.x,
                y: theaterSeats.y
              })
              .from(theaterSeats)
              .where(eq(theaterSeats.rowId, row.id))
              .orderBy(asc(theaterSeats.seatNumber));

            return { ...row, seats };
          })
        );

        return { ...section, rows: rowsWithSeats };
      })
    );

    // Return the complete theater seat plan
    return NextResponse.json({
      theater: theater[0],
      sections: sectionsWithRows
    });
  } catch (error) {
    console.error(`Error fetching seat plan for theater ${theaterId}:`, error);
    return NextResponse.json(
      { error: 'Failed to fetch theater seat plan' },
      { status: 500 }
    );
  }
}
