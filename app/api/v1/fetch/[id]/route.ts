import { NextResponse } from 'next/server';
import { eq, desc } from 'drizzle-orm';
import { db } from '@/lib/db';
import { scrapingResults } from '@/lib/db/schema';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const result = await db.query.scrapingResults.findFirst({
    where: eq(scrapingResults.configId, Number(id)),
    orderBy: [desc(scrapingResults.createdAt)],
  });

  if (!result) {
    return NextResponse.json({ error: 'No results found' }, { status: 404 });
  }

  return NextResponse.json(result.content);
}
