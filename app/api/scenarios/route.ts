import { db } from '@/lib/db/drizzle';
import { scenarios, scenarioSeatmaps, scenarioSeatmapPricing, theaters } from '@/lib/db/schema';
import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { eq } from 'drizzle-orm';

// Get all scenarios for a production
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const productionId = searchParams.get('productionId');
        
        if (!productionId) {
            return NextResponse.json({ error: 'Production ID is required' }, { status: 400 });
        }

        const scenariosList = await db
            .select({
                id: scenarios.id,
                name: scenarios.name,
                description: scenarios.description,
                theaterId: scenarios.theaterId,
                theaterName: theaters.name,
                updatedAt: scenarios.updatedAt
            })
            .from(scenarios)
            .leftJoin(theaters, eq(scenarios.theaterId, theaters.id))
            .where(eq(scenarios.productionId, Number(productionId)));

        return NextResponse.json(scenariosList);
    } catch (error) {
        console.error('Error fetching scenarios:', error);
        return NextResponse.json({ error: 'Failed to fetch scenarios' }, { status: 500 });
    }
}

// Create a new scenario
export async function POST(request: NextRequest) {
    try {
        const { name, description, productionId, theaterId, seatmap, pricing } = await request.json();
        const session = await getSession();
        
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Create the scenario
        const scenario = await db.insert(scenarios).values({ 
            name,
            description,
            productionId,
            theaterId
        }).returning();

        // Create the seatmap
        const seatmapRecord = await db.insert(scenarioSeatmaps).values({
            scenarioId: scenario[0].id,
            seatmap
        }).returning();

        // Create the pricing
        await db.insert(scenarioSeatmapPricing).values({
            scenarioSeatmapId: seatmapRecord[0].id,
            pricing
        });

        return NextResponse.json(scenario[0]);
    } catch (error) {
        console.error('Error creating scenario:', error);
        return NextResponse.json({ error: 'Failed to create scenario' }, { status: 500 });
    }
} 