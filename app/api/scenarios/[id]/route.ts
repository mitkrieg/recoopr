import { db } from '@/lib/db/drizzle';
import { scenarios } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { NextResponse, NextRequest } from 'next/server';

// get a scenario by id
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const scenarioId = parseInt(id);

  if (isNaN(scenarioId)) {
    return NextResponse.json({ error: 'Invalid scenario ID' }, { status: 400 });
  }

  try {
    const scenario = await db.select().from(scenarios).where(eq(scenarios.id, scenarioId)).limit(1);
    
    if (scenario.length === 0) {
      return NextResponse.json({ error: 'Scenario not found' }, { status: 404 });
    }
    
    return NextResponse.json(scenario[0]);
  } catch (error) {
    console.error(`Error fetching scenario ${scenarioId}:`, error);
    return NextResponse.json({ error: 'Failed to fetch scenario' }, { status: 500 });
  }
} 