import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { eq } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { scrapingConfigs } from '@/lib/db/schema';

async function getSessionOrFail() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  return session;
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSessionOrFail();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const config = await db.query.scrapingConfigs.findFirst({
    where: eq(scrapingConfigs.id, Number(id)),
  });

  if (!config) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  if (config.userId !== session.user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  return NextResponse.json(config);
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSessionOrFail();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const config = await db.query.scrapingConfigs.findFirst({
    where: eq(scrapingConfigs.id, Number(id)),
  });

  if (!config) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  if (config.userId !== session.user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json();
  const { selector, prompt, minutes } = body as {
    selector?: string;
    prompt?: string;
    minutes?: number;
  };

  const [updated] = await db
    .update(scrapingConfigs)
    .set({
      ...(selector !== undefined && { selector }),
      ...(prompt !== undefined && { prompt }),
      ...(minutes !== undefined && { minutes }),
    })
    .where(eq(scrapingConfigs.id, Number(id)))
    .returning();

  return NextResponse.json(updated);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSessionOrFail();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const config = await db.query.scrapingConfigs.findFirst({
    where: eq(scrapingConfigs.id, Number(id)),
  });

  if (!config) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  if (config.userId !== session.user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  await db
    .delete(scrapingConfigs)
    .where(eq(scrapingConfigs.id, Number(id)));
  return new NextResponse(null, { status: 204 });
}
