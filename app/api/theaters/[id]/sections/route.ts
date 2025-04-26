import { db } from '@/lib/db/drizzle';
import { theaterSections } from '@/lib/db/schema';
import { NextResponse } from 'next/server';
import { eq, asc } from 'drizzle-orm';

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
    const sections = await db
      .select({
        id: theaterSections.id,
        name: theaterSections.name
      })
      .from(theaterSections)
      .where(eq(theaterSections.theaterId, theaterId))
      .orderBy(asc(theaterSections.name));

    return NextResponse.json(sections);
  } catch (error) {
    console.error(`Error fetching sections for theater ${theaterId}:`, error);
    return NextResponse.json(
      { error: 'Failed to fetch theater sections' },
      { status: 500 }
    );
  }
}