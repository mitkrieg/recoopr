import { db } from '@/lib/db/drizzle';
import { productions, scenarios } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

// get all scenarios for a production
export async function GET(
    request:NextRequest, 
    { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const productionId = parseInt(id);

  if (isNaN(productionId)) {
    return NextResponse.json({ error: 'Invalid production ID' }, { status: 400 });
  }

  try {
    const scenariosList = await db.select().from(scenarios).where(eq(scenarios.productionId, productionId));
    return NextResponse.json(scenariosList);
  } catch (error) {
    console.error(`Error fetching scenarios for production ${productionId}:`, error);
    return NextResponse.json({ error: 'Failed to fetch scenarios' }, { status: 500 });
  }
}

// create a new scenario for a production
export async function POST(
    request: NextRequest, 
    { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const productionId = parseInt(id);

  if (isNaN(productionId)) {
    return NextResponse.json({ error: 'Invalid production ID' }, { status: 400 });
  }

  try {
    const { name, description, theaterId } = await request.json();
    
    if (!name || !theaterId) {
      return NextResponse.json({ error: 'Name and theater ID are required' }, { status: 400 });
    }

    const newScenario = await db.insert(scenarios)
      .values({ 
        name, 
        description, 
        productionId, 
        theaterId 
      })
      .returning();
      
    return NextResponse.json(newScenario);
  } catch (error) {
    console.error(`Error creating scenario for production ${productionId}:`, error);
    return NextResponse.json({ error: 'Failed to create scenario' }, { status: 500 });
  }
}

