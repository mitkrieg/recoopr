import { db } from '@/lib/db/drizzle';
import { theaterSections } from '@/lib/db/schema';
import { NextResponse } from 'next/server';
import { eq, asc } from 'drizzle-orm';

// get all sections
export async function GET() {
  const sections = await db.select().from(theaterSections).orderBy(asc(theaterSections.name));
  return NextResponse.json(sections);
}