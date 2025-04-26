import { db } from '@/lib/db/drizzle';
import { theaterRows, theaterSeats } from '@/lib/db/schema';
import { NextResponse } from 'next/server';
import { eq, asc } from 'drizzle-orm';

// get all seats for a row by id
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const rowId = parseInt(params.id);

  if (isNaN(rowId)) {
    return NextResponse.json(
      { error: 'Invalid row ID' },
      { status: 400 }
    );
  }

  try {
    const seats = await db.select().from(theaterSeats).where(eq(theaterSeats.rowId, rowId));
    return NextResponse.json(seats);
  } catch (error) {
    console.error(`Error fetching seats for row ${rowId}:`, error);
    return NextResponse.json({ error: 'Failed to fetch seats' }, { status: 500 });
  }
}

// create a new seat for a row by id
export async function POST(request: Request) {
  const { rowId, seatNumber } = await request.json();

  if (isNaN(rowId)) {
    return NextResponse.json(
      { error: 'Invalid row ID' },
      { status: 400 }
    );
  } else if (!seatNumber || seatNumber === '') {
    return NextResponse.json(
      { error: 'Seat number is required' },
      { status: 400 }
    );
  }

  const row = await db.query.theaterRows.findFirst({
    where: eq(theaterRows.id, rowId),
  });

  if (!row) {
    return NextResponse.json({ error: 'Row not found' }, { status: 404 });
  }

  const displayNumber = row.label + seatNumber;


  try {
    const [newSeat] = await db.insert(theaterSeats).values({ rowId, seatNumber, displayNumber }).returning();
    return NextResponse.json(newSeat, { status: 201 });
  } catch (error) {
    console.error(`Error creating seat for row ${rowId}:`, error);
    return NextResponse.json({ error: 'Failed to create seat' }, { status: 500 });
  }
}




