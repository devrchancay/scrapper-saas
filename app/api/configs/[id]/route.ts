import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { scrapingConfigs } from '@/lib/db/schema';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const config = await db.query.scrapingConfigs.findFirst({
    where: eq(scrapingConfigs.id, Number(id)),
  });
  if (!config) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  return NextResponse.json(config);
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();

  const [updated] = await db
    .update(scrapingConfigs)
    .set(body)
    .where(eq(scrapingConfigs.id, Number(id)))
    .returning();

  if (!updated) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  return NextResponse.json(updated);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await db
    .delete(scrapingConfigs)
    .where(eq(scrapingConfigs.id, Number(id)));
  return new NextResponse(null, { status: 204 });
}
