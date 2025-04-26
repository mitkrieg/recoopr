import { db } from '@/lib/db/drizzle';
import { theaterRows, theaterSections } from '@/lib/db/schema';
import { NextResponse } from 'next/server';
import { eq, asc } from 'drizzle-orm';

// get all rows for a section by id
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const sectionId = parseInt(params.id);

  if (isNaN(sectionId)) {
    return NextResponse.json(
      { error: 'Invalid section ID' },
      { status: 400 }
    );
  }

  try {
    const rows = await db.select().from(theaterRows).where(eq(theaterRows.sectionId, sectionId));
    return NextResponse.json(rows);
  } catch (error) {
    console.error(`Error fetching rows for section ${sectionId}:`, error);
    return NextResponse.json({ error: 'Failed to fetch rows' }, { status: 500 });
  }
}



// create a new row for a section by id
export async function POST(request: Request) {
  const { name, sectionId } = await request.json();

  if (isNaN(sectionId)) {
    return NextResponse.json(
      { error: 'Invalid section ID' },
      { status: 400 }
    );
  } else if (!name || name === '') {
    return NextResponse.json(
      { error: 'Row name is required' },
      { status: 400 }
    );
  }

  try {
    const [newRow] = await db.insert(theaterRows).values({ label: name, sectionId }).returning();
    return NextResponse.json(newRow, { status: 201 });
  } catch (error) {
    console.error('Error creating row:', error);
    return NextResponse.json({ error: 'Failed to create row' }, { status: 500 });
  }
}

    