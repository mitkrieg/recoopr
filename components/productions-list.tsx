'use client';

import { useSession } from 'next-auth/react';
import { Card, CardDescription } from '@/components/ui/card';
import { CardTitle } from '@/components/ui/card';
import { productions } from '@/lib/db/schema';
import { InferSelectModel } from 'drizzle-orm';

type Production = InferSelectModel<typeof productions>;

interface ProductionsListProps {
  initialProductions: Production[];
}

export function ProductionsList({ initialProductions }: ProductionsListProps) {
  const { data: session } = useSession();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {initialProductions?.map((production) => (
        <Card key={production.id}>
          <CardTitle>{production.name}</CardTitle>
          <CardDescription>{production.startDate} - {production.endDate}</CardDescription>
        </Card>
      ))}
    </div>
  );
} 