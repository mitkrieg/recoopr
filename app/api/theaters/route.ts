import { db } from '@/lib/db/drizzle';
import { theaters } from '@/lib/db/schema';
import { NextResponse } from 'next/server';
import { asc } from 'drizzle-orm';

export async function GET() {
  try {
    const theaterList = await db.select({
      id: theaters.id,
      name: theaters.name,
      venueSlug: theaters.venueSlug
    })
    .from(theaters)
    .orderBy(asc(theaters.name));

    return NextResponse.json(theaterList);
  } catch (error) {
    console.error('Error fetching theaters:', error);
    return NextResponse.json({ error: 'Failed to fetch theaters' }, { status: 500 });
  }
} 
