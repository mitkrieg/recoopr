import { db } from '@/lib/db/drizzle';
import { theaterSections, theaters, theaterRows, theaterSeats } from '@/lib/db/schema';
import { NextResponse } from 'next/server';
import { eq, asc } from 'drizzle-orm';

// get all sections for a theater
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const theaterId = parseInt(params.id);
  const { searchParams } = new URL(request.url);
  const includeRows = searchParams.get('includeRows') === 'true';
  const includeSeats = searchParams.get('includeSeats') === 'true';

  if (isNaN(theaterId)) {
    return NextResponse.json(
      { error: 'Invalid theater ID' },
      { status: 400 }
    );
  }

  try {
    if (!includeRows) {
      // Default behavior - just return sections
      const sections = await db
        .select({
          id: theaterSections.id,
          name: theaterSections.name
        })
        .from(theaterSections)
        .where(eq(theaterSections.theaterId, theaterId))
        .orderBy(asc(theaterSections.name));

      return NextResponse.json(sections);
    } else {
      // Get sections with rows
      const sections = await db
        .select({
          id: theaterSections.id,
          name: theaterSections.name,
          theaterId: theaterSections.theaterId
        })
        .from(theaterSections)
        .where(eq(theaterSections.theaterId, theaterId))
        .orderBy(asc(theaterSections.name));

      const sectionsWithRows = await Promise.all(
        sections.map(async (section) => {
          const rows = await db
            .select({
              id: theaterRows.id,
              label: theaterRows.label,
              sectionId: theaterRows.sectionId
            })
            .from(theaterRows)
            .where(eq(theaterRows.sectionId, section.id))
            .orderBy(asc(theaterRows.label));

          // return rows only if seats are not requested
          if (!includeSeats) {
            return { ...section, rows };
          }

          const rowsWithSeats = await Promise.all(
            rows.map(async (row) => {
              const seats = await db
                .select({
                  id: theaterSeats.id,
                  seatNumber: theaterSeats.seatNumber,
                  rowId: theaterSeats.rowId,
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

      return NextResponse.json(sectionsWithRows);
    }
  } catch (error) {
    console.error(`Error fetching sections for theater ${theaterId}:`, error);
    return NextResponse.json(
      { error: 'Failed to fetch theater sections' },
      { status: 500 }
    );
  }
}

// create a new section for a theater
export async function POST(request: Request) {
  const { name, theaterId } = await request.json();

  if (isNaN(theaterId)) {
    return NextResponse.json(
      { error: 'Invalid theater ID' },
      { status: 400 }
    );
  } else if (!name) {
    return NextResponse.json(
      { error: 'Section name is required' },
      { status: 400 }
    );
  } else {
    const theater = await db.select().from(theaters).where(eq(theaters.id, theaterId));
    if (!theater) {
      return NextResponse.json(
        { error: 'Theater not found' },
        { status: 404 }
      );
    }
  }

  try {
    const [newSection] = await db.insert(theaterSections).values({
      name,
      theaterId,
      label: name
    }).returning();

    return NextResponse.json(newSection, { status: 201 });
  } catch (error) {
    console.error('Error creating section:', error);
    return NextResponse.json({ error: 'Failed to create section' }, { status: 500 });
  }
}

