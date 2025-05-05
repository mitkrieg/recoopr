'use server';

import { z } from 'zod';
import { db } from '@/lib/db/drizzle';
import { productions } from '@/lib/db/schema';
import { revalidatePath } from 'next/cache';
import { getSession } from '@/lib/auth/session';
import { eq, asc } from 'drizzle-orm';
import { theaters, theaterSections, theaterRows, theaterSeats } from '@/lib/db/schema';
import { scenarios, scenarioSeatmaps, scenarioSeatmapPricing } from '@/lib/db/schema';
// import { createProduction, getTheaters, getTheaterSeatPlan } from '../actions';

const createProductionSchema = z.object({
  name: z.string().min(2, {
    message: "Production name must be at least 2 characters.",
  }),
  startDate: z.string(),
  endDate: z.string(),
  capitalization: z.number().min(0).max(1000000000)
});

export async function createProduction(formData: FormData) {
  const session = await getSession();
  if (!session?.user?.id) {
    return { error: 'Unauthorized' };
  }

  const data = {
    name: formData.get('name'),
    startDate: formData.get('startDate'),
    endDate: formData.get('endDate'),
    capitalization: Number(formData.get('capitalization'))
  };

  const result = createProductionSchema.safeParse(data);
  if (!result.success) {
    return { error: result.error.errors[0].message };
  }

  try {
    const production = await db.insert(productions)
      .values({
        name: result.data.name,
        startDate: result.data.startDate,
        endDate: result.data.endDate,
        userId: session.user.id,
        capitalization: result.data.capitalization
      } as typeof productions.$inferInsert)
      .returning();
    
    revalidatePath('/productions');
    return { success: true, production: production[0] };
  } catch (error) {
    console.error('Error creating production:', error);
    return { error: 'Failed to create production' };
  }
}

export async function getTheaters() {
  try {
    // Get all theaters ordered by name
    const theaters = (await db.query.theaters.findMany()).sort(
      (a, b) => a.name.localeCompare(b.name)
    );
    return { theaters };
  } catch (error) {
    console.error('Error fetching theaters:', error);
    return { error: 'Failed to fetch theaters' };
  }
}

export async function getTheaterSeatPlan(theaterId: number) {
  try {
    // First verify the theater exists
    const theater = await db
      .select({
        id: theaters.id,
        name: theaters.name,
        venueSlug: theaters.venueSlug
      })
      .from(theaters)
      .where(eq(theaters.id, theaterId))
      .limit(1);

    if (!theater.length) {
      return { error: 'Theater not found' };
    }

    // Get all sections for this theater
    const sections = await db
      .select({
        id: theaterSections.id,
        name: theaterSections.name,
        categoryKey: theaterSections.categoryKey,
        color: theaterSections.color,
        theaterId: theaterSections.theaterId,
        parentSection: theaterSections.parentSection,
        label: theaterSections.label
      })
      .from(theaterSections)
      .where(eq(theaterSections.theaterId, theaterId))
      .orderBy(asc(theaterSections.name));

    // For each section, get all rows
    const sectionsWithRows = await Promise.all(
      sections.map(async (section) => {
        const rows = await db
          .select({
            id: theaterRows.id,
            label: theaterRows.label,
            displayLabel: theaterRows.displayLabel,
            sectionId: theaterRows.sectionId
          })
          .from(theaterRows)
          .where(eq(theaterRows.sectionId, section.id))
          .orderBy(asc(theaterRows.label));

        // For each row, get all seats
        const rowsWithSeats = await Promise.all(
          rows.map(async (row) => {
            const seats = await db
              .select({
                id: theaterSeats.id,
                seatNumber: theaterSeats.seatNumber,
                displayNumber: theaterSeats.displayNumber,
                price: theaterSeats.price,
                status: theaterSeats.status,
                accessible: theaterSeats.accessible,
                x: theaterSeats.x,
                y: theaterSeats.y
              })
              .from(theaterSeats)
              .where(eq(theaterSeats.rowId, row.id))
              .orderBy(asc(theaterSeats.seatNumber));

            return { ...row, seats };
          })
        );

        return { ...section, rows: rowsWithSeats };
      })
    );

    return { 
      seatPlan: {
        theater: theater[0],
        sections: sectionsWithRows
      }
    };
  } catch (error) {
    console.error('Error fetching seat plan:', error);
    return { error: 'Failed to fetch seat plan' };
  }
}

// Scenarios
export async function createScenario(data: {
  name: string;
  description: string;
  productionId: number;
  theaterId: number;
  seatmap: any;
  pricing: any[];
}) {
  const session = await getSession();
  if (!session?.user?.id) {
    return { error: 'Unauthorized' };
  }

  try {
    // First create the scenario
    const scenario = await db.insert(scenarios)
      .values({
        name: data.name,
        description: data.description,
        productionId: data.productionId,
        theaterId: data.theaterId
      })
      .returning();

    // Then create the seatmap
    const seatmap = await db.insert(scenarioSeatmaps)
      .values({
        scenarioId: scenario[0].id,
        seatmap: data.seatmap
      })
      .returning();

    // Finally create the pricing
    await db.insert(scenarioSeatmapPricing)
      .values({
        scenarioSeatmapId: seatmap[0].id,
        pricing: data.pricing
      });
    
    revalidatePath('/productions');
    return { success: true, scenario: scenario[0] };
  } catch (error) {
    console.error('Error creating scenario:', error);
    return { error: 'Failed to create scenario' };
  }
}

export async function updateScenario(id: number, data: {
  name: string;
  description: string;
  theaterId: number;
  seatmap: any;
  pricing: any[];
}) {
  const session = await getSession();
  if (!session?.user?.id) {
    return { error: 'Unauthorized' };
  }

  try {
    // Update the scenario
    const scenario = await db.update(scenarios)
      .set({
        name: data.name,
        description: data.description,
        theaterId: data.theaterId
      })
      .where(eq(scenarios.id, id))
      .returning();

    // Update the seatmap
    const seatmap = await db.update(scenarioSeatmaps)
      .set({
        seatmap: data.seatmap
      })
      .where(eq(scenarioSeatmaps.scenarioId, id))
      .returning();

    // Update the pricing
    await db.update(scenarioSeatmapPricing)
      .set({
        pricing: data.pricing
      })
      .where(eq(scenarioSeatmapPricing.scenarioSeatmapId, seatmap[0].id));
    
    revalidatePath('/productions');
    return { success: true, scenario: scenario[0] };
  } catch (error) {
    console.error('Error updating scenario:', error);
    return { error: 'Failed to update scenario' };
  }
}

interface ScenarioWithSeatmap {
  id: number;
  name: string;
  description: string | null;
  theaterId: number;
  productionId: number;
  createdAt: Date;
  updatedAt: Date;
  seatmap: any;
  pricing: any[];
}

export async function getScenarios(productionId?: number): Promise<{ scenarios?: ScenarioWithSeatmap[], error?: string }> {
  try {
    const query = db.select().from(scenarios);
    if (productionId) {
      query.where(eq(scenarios.productionId, productionId));
    }
    const scenariosList = await query;

    // Get seatmaps and pricing for each scenario
    const scenariosWithData = await Promise.all(
      scenariosList.map(async (scenario) => {
        const seatmap = await db
          .select()
          .from(scenarioSeatmaps)
          .where(eq(scenarioSeatmaps.scenarioId, scenario.id))
          .limit(1);

        const pricing = await db
          .select()
          .from(scenarioSeatmapPricing)
          .where(eq(scenarioSeatmapPricing.scenarioSeatmapId, seatmap[0].id))
          .limit(1);

        return {
          ...scenario,
          seatmap: seatmap[0]?.seatmap || {},
          pricing: pricing[0]?.pricing || []
        } as ScenarioWithSeatmap;
      })
    );

    return { scenarios: scenariosWithData };
  } catch (error) {
    console.error('Error fetching scenarios:', error);
    return { error: 'Failed to fetch scenarios' };
  }
}

export async function getScenario(id: number): Promise<{ scenario?: ScenarioWithSeatmap, error?: string }> {
  try {
    const scenario = await db
      .select()
      .from(scenarios)
      .where(eq(scenarios.id, id))
      .limit(1);
    
    if (!scenario.length) {
      return { error: 'Scenario not found' };
    }

    const seatmap = await db
      .select()
      .from(scenarioSeatmaps)
      .where(eq(scenarioSeatmaps.scenarioId, id))
      .limit(1);

    const pricing = await db
      .select()
      .from(scenarioSeatmapPricing)
      .where(eq(scenarioSeatmapPricing.scenarioSeatmapId, seatmap[0].id))
      .limit(1);
    
    return { 
      scenario: {
        ...scenario[0],
        seatmap: seatmap[0]?.seatmap || {},
        pricing: pricing[0]?.pricing || []
      } as ScenarioWithSeatmap
    };
  } catch (error) {
    console.error('Error fetching scenario:', error);
    return { error: 'Failed to fetch scenario' };
  }
}

export async function deleteScenario(id: number) {
  const session = await getSession();
  if (!session?.user?.id) {
    return { error: 'Unauthorized' };
  }

  try {
    // Delete the pricing first
    const seatmap = await db
      .select()
      .from(scenarioSeatmaps)
      .where(eq(scenarioSeatmaps.scenarioId, id))
      .limit(1);

    if (seatmap.length) {
      await db.delete(scenarioSeatmapPricing)
        .where(eq(scenarioSeatmapPricing.scenarioSeatmapId, seatmap[0].id));
    }

    // Then delete the seatmap
    await db.delete(scenarioSeatmaps)
      .where(eq(scenarioSeatmaps.scenarioId, id));

    // Finally delete the scenario
    await db.delete(scenarios)
      .where(eq(scenarios.id, id));
    
    revalidatePath('/productions');
    return { success: true };
  } catch (error) {
    console.error('Error deleting scenario:', error);
    return { error: 'Failed to delete scenario' };
  }
}

// Productions
export async function getProduction(id: number) {
  try {
    const production = await db
      .select()
      .from(productions)
      .where(eq(productions.id, id))
      .limit(1);
    
    if (!production.length) {
      return { error: 'Production not found' };
    }
    
    return { production: production[0] };
  } catch (error) {
    console.error('Error fetching production:', error);
    return { error: 'Failed to fetch production' };
  }
}

export async function getTheater(theaterId: number) {
  try {
    const theater = await db
      .select({
        id: theaters.id,
        name: theaters.name,
        venueSlug: theaters.venueSlug
      })
      .from(theaters)
      .where(eq(theaters.id, theaterId))
      .limit(1);

    if (!theater.length) {
      return { error: 'Theater not found' };
    }

    return { theater: theater[0] };
  } catch (error) {
    console.error('Error fetching theater:', error);
    return { error: 'Failed to fetch theater' };
  }
}

export async function deleteProduction(id: number) {
  const session = await getSession();
  if (!session?.user?.id) {
    return { error: 'Unauthorized' };
  }

  try {
    // First delete all scenarios for this production
    const productionScenarios = await db.select().from(scenarios).where(eq(scenarios.productionId, id));
    for (const scenario of productionScenarios) {
      // Delete the pricing first
      const seatmap = await db
        .select()
        .from(scenarioSeatmaps)
        .where(eq(scenarioSeatmaps.scenarioId, scenario.id))
        .limit(1);

      if (seatmap.length) {
        await db.delete(scenarioSeatmapPricing)
          .where(eq(scenarioSeatmapPricing.scenarioSeatmapId, seatmap[0].id));
      }

      // Then delete the seatmap
      await db.delete(scenarioSeatmaps)
        .where(eq(scenarioSeatmaps.scenarioId, scenario.id));

      // Finally delete the scenario
      await db.delete(scenarios)
        .where(eq(scenarios.id, scenario.id));
    }

    // Now delete the production
    await db.delete(productions).where(eq(productions.id, id));
    
    revalidatePath('/productions');
    return { success: true };
  } catch (error) {
    console.error('Error deleting production:', error);
    return { error: 'Failed to delete production' };
  }
}