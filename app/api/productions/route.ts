import { db } from '@/lib/db/drizzle';
import { productions } from '@/lib/db/schema';
import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';


// get all productions
export async function GET() {
    try {
        const productionsList = await db.select().from(productions);
        return NextResponse.json(productionsList);
    } catch (error) {
        console.error('Error fetching productions:', error);
        return NextResponse.json({ error: 'Failed to fetch productions' }, { status: 500 });
    }
}

// create a new production
export async function POST(request: NextRequest) {
    try {
        const { name, startDate, endDate, capitalization } = await request.json();
        const session = await getSession();
        
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const production = await db.insert(productions).values({ 
            name, 
            startDate, 
            endDate, 
            userId: session.user.id,
            capitalization 
        }).returning();
        
        return NextResponse.json(production[0]);
    } catch (error) {
        console.error('Error creating production:', error);
        return NextResponse.json({ error: 'Failed to create production' }, { status: 500 });
    }
}
