import { db } from '@/lib/db/drizzle';
import { theaterRows } from '@/lib/db/schema';
import { NextResponse } from 'next/server';
import { eq, asc } from 'drizzle-orm';

// get all rows
export async function GET() {
  const rows = await db.select().from(theaterRows).orderBy(asc(theaterRows.label));
  return NextResponse.json(rows);
}

