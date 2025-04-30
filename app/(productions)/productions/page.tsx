import { db } from '@/lib/db/drizzle';
import { productions } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getSession } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DeleteProductionButton } from '../../../components/delete-button';

export default async function ProductionsPage() {
  const session = await getSession();

  if (!session?.user?.id) {
    redirect('/sign-in');
  }

  const userProductions = await db
    .select()
    .from(productions)
    .where(eq(productions.userId, session.user.id));

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Your Productions</h1>
        <Button asChild>
          <Link href="/productions/create">Create New Production</Link>
        </Button>
      </div>
      {userProductions.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-gray-500">You don't have any productions yet. Create one to get started!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {userProductions.map((production) => (
            <Card key={production.id} className="h-full hover:shadow-md transition-shadow relative">
              <div className="absolute top-2 right-2">
                <DeleteProductionButton productionId={production.id} />
              </div>
              <Link href={`/productions/${production.id}`} className="block">
                <CardHeader>
                  <CardTitle>{production.name}</CardTitle>
                  <CardDescription>
                    {new Date(production.startDate).toLocaleDateString()} -{' '}
                    {production.endDate
                      ? new Date(production.endDate).toLocaleDateString()
                      : 'Ongoing'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-500">
                    {production.capitalization ? `Capitalization: $${production.capitalization.toLocaleString()}` : 'No capitalization set'}
                  </p>
                </CardContent>
              </Link>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
