import { db } from '@/lib/db/drizzle';
import { scenarios, scenarioSeatmaps, scenarioSeatmapPricing } from '@/lib/db/schema';
import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { eq } from 'drizzle-orm';

// Get a specific scenario by ID
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
        const session = await getSession();
        
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const scenario = await db.select().from(scenarios).where(eq(scenarios.id, scenarioId)).limit(1);
        
        if (!scenario.length) {
            return NextResponse.json({ error: 'Scenario not found' }, { status: 404 });
        }

        const seatmap = await db.select().from(scenarioSeatmaps).where(eq(scenarioSeatmaps.scenarioId, scenario[0].id)).limit(1);
        const pricing = await db.select().from(scenarioSeatmapPricing).where(eq(scenarioSeatmapPricing.scenarioSeatmapId, seatmap[0].id)).limit(1);

        return NextResponse.json({
            ...scenario[0],
            seatmap: seatmap[0].seatmap,
            pricing: pricing[0].pricing
        });
    } catch (error) {
        console.error('Error fetching scenario:', error);
        return NextResponse.json({ error: 'Failed to fetch scenario' }, { status: 500 });
    }
}

// Update a scenario
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getSession();
        const { id } = await params;
        const scenarioId = parseInt(id);

        if (isNaN(scenarioId)) {
            return NextResponse.json({ error: 'Invalid scenario ID' }, { status: 400 });
        }
        
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { name, description, theaterId, seatmap, pricing } = await request.json();

        // Update the scenario
        const updatedScenario = await db.update(scenarios)
            .set({ 
                name,
                description,
                theaterId
            })
            .where(eq(scenarios.id, scenarioId))
            .returning();

        if (!updatedScenario.length) {
            return NextResponse.json({ error: 'Scenario not found' }, { status: 404 });
        }

        // Update the seatmap
        const updatedSeatmap = await db.update(scenarioSeatmaps)
            .set({ seatmap })
            .where(eq(scenarioSeatmaps.scenarioId, updatedScenario[0].id))
            .returning();

        // Update the pricing
        await db.update(scenarioSeatmapPricing)
            .set({ pricing })
            .where(eq(scenarioSeatmapPricing.scenarioSeatmapId, updatedSeatmap[0].id));

        return NextResponse.json(updatedScenario[0]);
    } catch (error) {
        console.error('Error updating scenario:', error);
        return NextResponse.json({ error: 'Failed to update scenario' }, { status: 500 });
    }
}

// Delete a scenario
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getSession();
        const { id } = await params;
        const scenarioId = parseInt(id);

        if (isNaN(scenarioId)) {
            return NextResponse.json({ error: 'Invalid scenario ID' }, { status: 400 });
        }
        
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // First get the seatmap ID
        const seatmap = await db.select().from(scenarioSeatmaps).where(eq(scenarioSeatmaps.scenarioId, scenarioId)).limit(1);
        
        if (seatmap.length) {
            // Delete the pricing
            await db.delete(scenarioSeatmapPricing).where(eq(scenarioSeatmapPricing.scenarioSeatmapId, seatmap[0].id));
            // Delete the seatmap
            await db.delete(scenarioSeatmaps).where(eq(scenarioSeatmaps.scenarioId, scenarioId));
        }

        // Delete the scenario
        await db.delete(scenarios).where(eq(scenarios.id, scenarioId));

        return NextResponse.json({ message: 'Scenario deleted successfully' }, { status: 200 });
    } catch (error) {
        console.error('Error deleting scenario:', error);
        return NextResponse.json({ error: 'Failed to delete scenario' }, { status: 500 });
    }
} 