import { db } from '@/lib/db/drizzle';
import { scenarios, productions as productionsTable } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { Card, CardDescription } from '@/components/ui/card';
import { CardTitle } from '@/components/ui/card';
import { redirect } from 'next/navigation';
import { getUser } from '@/lib/db/queries';
import Link from 'next/link';

export default async function ScenariosPage() {
  const user = await getUser();
  
  if (!user) {
    redirect('/sign-in');
  }

  // Get user's productions
  const userProductions = await db
    .select()
    .from(productionsTable)
    .where(eq(productionsTable.userId, user.id));

  // If no productions, handle accordingly
  if (userProductions.length === 0) {
    return (
      <>
        <h1 className="text-3xl font-bold leading-tight text-gray-900">Scenarios</h1>
        <p className="mt-4">You don't have any productions yet. Create a production first to add scenarios.</p>
        <Link href="/productions" className="mt-4 inline-block text-blue-600 hover:underline">
          Go to Productions
        </Link>
      </>
    );
  }

  // Get scenarios for user's productions
  const productionIds = userProductions.map(production => production.id);
  
  const scenariosList = await db
    .select({
      scenario: scenarios,
      production: {
        name: productionsTable.name
      }
    })
    .from(scenarios)
    .leftJoin(
      productionsTable, 
      eq(scenarios.productionId, productionsTable.id)
    )
    .where(
      eq(productionsTable.userId, user.id)
    );

  return (
    <>
      <h1 className="text-3xl font-bold leading-tight text-gray-900">Scenarios</h1>
      
      {scenariosList.length === 0 ? (
        <p className="mt-4">No scenarios found. Create a scenario for one of your productions.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
          {scenariosList.map(({ scenario, production }) => (
            <Link key={scenario.id} href={`/productions/scenario/${scenario.id}`}>
              <Card className="h-full cursor-pointer hover:shadow-md transition-shadow">
                <div className="p-4">
                  <CardTitle>{scenario.name}</CardTitle>
                  <CardDescription className="mt-2">
                    Production: {production.name}
                  </CardDescription>
                  {scenario.description && (
                    <p className="mt-2 text-sm text-gray-600">{scenario.description}</p>
                  )}
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
