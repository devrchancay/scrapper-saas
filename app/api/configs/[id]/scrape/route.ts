import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { eq } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { scrapingConfigs } from '@/lib/db/schema';
import { scrapeConfig } from '@/lib/scraper';

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const configId = Number(id);

  const config = await db.query.scrapingConfigs.findFirst({
    where: eq(scrapingConfigs.id, configId),
  });

  if (!config) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  if (config.userId !== session.user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    await scrapeConfig(configId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
