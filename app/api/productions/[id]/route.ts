import { db } from '@/lib/db/drizzle';
import { productions, scenarios } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

// get a production by id
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const productionId = parseInt(id);
    if (isNaN(productionId)) {
        return NextResponse.json({ error: 'Invalid production ID' }, { status: 400 });
    }

    try {
        const production = await db.select().from(productions).where(eq(productions.id, productionId));
        if (production.length === 0) {
            return NextResponse.json({ error: 'Production not found' }, { status: 404 });
        }
        return NextResponse.json(production[0]);
    } catch (error) {
        console.error(`Error fetching production ${productionId}:`, error);
        return NextResponse.json({ error: 'Failed to fetch production' }, { status: 500 });
    }
}

// update a production by id
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const productionId = parseInt(id);

    if (isNaN(productionId)) {
        return NextResponse.json({ error: 'Invalid production ID' }, { status: 400 });
    }

    try {
        const { name, startDate, endDate, capitalization } = await request.json();
        await db.update(productions).set({ name, startDate, endDate, capitalization }).where(eq(productions.id, productionId));
        return NextResponse.json({ message: 'Production updated successfully' }, { status: 200 });
    } catch (error) {
        console.error(`Error updating production ${productionId}:`, error);
        return NextResponse.json({ error: 'Failed to update production' }, { status: 500 });
    }
}

// delete a production by id
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const productionId = parseInt(id);

    if (isNaN(productionId)) {
        return NextResponse.json({ error: 'Invalid production ID' }, { status: 400 });
    }

    try {   
        await db.delete(productions).where(eq(productions.id, productionId));
        return NextResponse.json({ message: 'Production deleted successfully' }, { status: 200 });
    } catch (error) {
        console.error(`Error deleting production ${productionId}:`, error);
        return NextResponse.json({ error: 'Failed to delete production' }, { status: 500 });
    }
}