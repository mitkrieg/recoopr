import { db } from '@/lib/db/drizzle';
import { productions } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getSession } from '@/lib/auth/session';
import { redirect } from 'next/navigation';

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
      <h1 className="text-3xl font-bold">Your Productions</h1>
      {userProductions.length === 0 ? (
        <p>You don't have any productions yet. Create one to get started!</p>
      ) : (
        <div className="grid gap-4">
          {userProductions.map((production) => (
            <div key={production.id} className="border rounded-lg p-4">
              <h2 className="text-xl font-semibold">{production.name}</h2>
              <p className="text-gray-500">
                {new Date(production.startDate).toLocaleDateString()} -{' '}
                {production.endDate
                  ? new Date(production.endDate).toLocaleDateString()
                  : 'Ongoing'}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
