import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { eq } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { scrapingConfigs } from '@/lib/db/schema';

export async function GET() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const configs = await db
    .select()
    .from(scrapingConfigs)
    .where(eq(scrapingConfigs.userId, session.user.id));

  return NextResponse.json(configs);
}

export async function POST(request: Request) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();

  const { url, selector, prompt, minutes } = body as {
    url: string;
    selector: string;
    prompt?: string;
    minutes?: number;
  };

  if (!url || !selector) {
    return NextResponse.json(
      { error: 'url and selector are required' },
      { status: 400 }
    );
  }

  const values: Record<string, unknown> = {
    url,
    selector,
    minutes: minutes ?? 5,
    userId: session.user.id,
  };
  if (prompt) values.prompt = prompt;

  const [created] = await db
    .insert(scrapingConfigs)
    .values(values as typeof scrapingConfigs.$inferInsert)
    .returning();

  return NextResponse.json(created, { status: 201 });
}
