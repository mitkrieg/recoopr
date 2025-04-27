import { db } from '@/lib/db/drizzle';
import { theaterRows } from '@/lib/db/schema';
import { NextResponse, NextRequest } from 'next/server';
import { eq, asc } from 'drizzle-orm';

// get a row by id
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const rowId = parseInt(id);

  if (isNaN(rowId)) {
    return NextResponse.json(
      { error: 'Invalid row ID' },
      { status: 400 }
    );
  }

  try {
    const row = await db.select().from(theaterRows).where(eq(theaterRows.id, rowId));
    return NextResponse.json(row);
  } catch (error) {
    console.error(`Error fetching row ${rowId}:`, error);
    return NextResponse.json({ error: 'Failed to fetch row' }, { status: 500 });
  }
}


// update a row by id
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const rowId = parseInt(id);

  if (isNaN(rowId)) {
    return NextResponse.json(
      { error: 'Invalid row ID' },
      { status: 400 }
    );
  }

  try {
    const { label } = await request.json();
    await db.update(theaterRows).set({ label }).where(eq(theaterRows.id, rowId));
    return NextResponse.json({ message: 'Row updated successfully' }, { status: 200 });
  } catch (error) {
    console.error(`Error updating row ${rowId}:`, error);
    return NextResponse.json({ error: 'Failed to update row' }, { status: 500 });
  }
}


