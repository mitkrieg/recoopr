import { db } from '@/lib/db/drizzle';
import { theaters } from '@/lib/db/schema';
import { NextResponse } from 'next/server';
import { asc } from 'drizzle-orm';

// get all theaters
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

// create a new theater
export async function POST(request: Request) {
  const { name, venueSlug } = await request.json();

  try {
    const [newTheater] = await db.insert(theaters).values({ name, venueSlug }).returning();

    return NextResponse.json(newTheater, { status: 201 });
  } catch (error) {
    console.error('Error creating theater:', error);
    return NextResponse.json({ error: 'Failed to create theater' }, { status: 500 });
  }
}
