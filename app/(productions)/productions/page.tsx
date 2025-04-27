import { db } from '@/lib/db/drizzle';  
import { productions as productionsTable } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { Card, CardDescription } from '@/components/ui/card';
import { CardTitle } from '@/components/ui/card';
import { redirect } from 'next/navigation';


export default async function ProductionsPage() {

  const productions = await db.select().from(productionsTable);

  return (
    <>
      <h1 className="text-3xl font-bold leading-tight text-gray-900">Productions</h1>
      {/* display all productions for the current user  as a grid of cards  */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {productions?.map((production) => (
          <Card key={production.id}>
            <CardTitle>{production.name}</CardTitle>
            <CardDescription>{production.startDate} - {production.endDate}</CardDescription>
          </Card>
        ))}
      </div>
    </>
  );
}
