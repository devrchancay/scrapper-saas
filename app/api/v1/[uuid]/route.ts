import { NextResponse } from 'next/server';
import { eq, desc } from 'drizzle-orm';
import { db } from '@/lib/db';
import { scrapingConfigs, scrapingResults } from '@/lib/db/schema';
import { validateApiKey } from '@/lib/api-keys';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ uuid: string }> }
) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json(
      { error: 'Missing Authorization header' },
      { status: 401 }
    );
  }

  const key = authHeader.slice(7);
  const userId = await validateApiKey(key);
  if (!userId) {
    return NextResponse.json({ error: 'Invalid API key' }, { status: 401 });
  }

  const { uuid } = await params;

  const config = await db.query.scrapingConfigs.findFirst({
    where: eq(scrapingConfigs.publicId, uuid),
  });

  if (!config) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  if (config.userId !== userId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const result = await db.query.scrapingResults.findFirst({
    where: eq(scrapingResults.configId, config.id),
    orderBy: [desc(scrapingResults.createdAt)],
  });

  if (!result) {
    return NextResponse.json({ error: 'No results found' }, { status: 404 });
  }

  const ifNoneMatch = req.headers.get('if-none-match');
  if (ifNoneMatch === `"${result.hash}"`) {
    return new NextResponse(null, { status: 304 });
  }

  const maxAge = config.minutes * 60;

  return NextResponse.json(result.content, {
    headers: {
      'Cache-Control': `public, s-maxage=${maxAge}, stale-while-revalidate=${maxAge * 2}`,
      'ETag': `"${result.hash}"`,
      'Last-Modified': result.createdAt.toUTCString(),
    },
  });
}
