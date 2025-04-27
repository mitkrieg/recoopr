import { db } from '@/lib/db/drizzle';
import { theaters } from '@/lib/db/schema';
import { NextResponse, NextRequest } from 'next/server';
import { eq } from 'drizzle-orm';

// get a theater by id
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const theaterId = parseInt(id);

  if (isNaN(theaterId)) {
    return NextResponse.json(
      { error: 'Invalid theater ID' },
      { status: 400 }
    );
  }

  try {
    const theater = await db.select().from(theaters).where(eq(theaters.id, theaterId));

    return NextResponse.json(theater);
  } catch (error) {
    console.error(`Error fetching theater ${theaterId}:`, error);
    return NextResponse.json(
      { error: 'Failed to fetch theater sections' },
      { status: 500 }
    );
  }
}

// update a theater by id
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const theaterId = parseInt(id);

  if (isNaN(theaterId)) {
    return NextResponse.json(
      { error: 'Invalid theater ID' },
      { status: 400 }
    );
  }

  try {
    const { name, venueSlug } = await request.json();

    await db.update(theaters).set({ name, venueSlug }).where(eq(theaters.id, theaterId));

    return NextResponse.json({ message: 'Theater updated successfully' }, { status: 200 });
  } catch (error) {
    console.error(`Error updating theater ${theaterId}:`, error);
    return NextResponse.json(
      { error: 'Failed to update theater' },
      { status: 500 }
    );
  }
}

// delete a theater by id
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const theaterId = parseInt(id);

  if (isNaN(theaterId)) {
    return NextResponse.json(
      { error: 'Invalid theater ID' },
      { status: 400 }
    );
  }

  try {
    await db.delete(theaters).where(eq(theaters.id, theaterId));

    return NextResponse.json({ message: 'Theater deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error(`Error deleting theater ${theaterId}:`, error);
    return NextResponse.json(
      { error: 'Failed to delete theater' },
      { status: 500 }
    );
  }
}