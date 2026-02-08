import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { eq } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { apiKey } from '@/lib/db/schema';
import { generateApiKey, hashApiKey } from '@/lib/api-keys';

export async function GET() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const keys = await db
    .select({
      id: apiKey.id,
      name: apiKey.name,
      createdAt: apiKey.createdAt,
    })
    .from(apiKey)
    .where(eq(apiKey.userId, session.user.id));

  return NextResponse.json(keys);
}

export async function POST(request: Request) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const name = (body.name as string) || 'Default';

  const plainKey = generateApiKey();
  const hashedKey = hashApiKey(plainKey);
  const id = crypto.randomUUID();

  await db.insert(apiKey).values({
    id,
    key: hashedKey,
    userId: session.user.id,
    name,
  });

  return NextResponse.json({ id, key: plainKey, name }, { status: 201 });
}

export async function DELETE(request: Request) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const keyId = searchParams.get('id');
  if (!keyId) {
    return NextResponse.json({ error: 'id is required' }, { status: 400 });
  }

  const existing = await db.query.apiKey.findFirst({
    where: eq(apiKey.id, keyId),
  });
  if (!existing || existing.userId !== session.user.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  await db.delete(apiKey).where(eq(apiKey.id, keyId));
  return new NextResponse(null, { status: 204 });
}
