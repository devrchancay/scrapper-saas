import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { scrapingConfigs } from '@/lib/db/schema';

export async function GET() {
  const configs = await db.select().from(scrapingConfigs);
  return NextResponse.json(configs);
}

export async function POST(request: Request) {
  const body = await request.json();

  const { url, selector, minutes } = body as {
    url: string;
    selector: string;
    minutes?: number;
  };

  if (!url || !selector) {
    return NextResponse.json(
      { error: 'url and selector are required' },
      { status: 400 }
    );
  }

  const [created] = await db
    .insert(scrapingConfigs)
    .values({ url, selector, minutes: minutes ?? 5 })
    .returning();

  return NextResponse.json(created, { status: 201 });
}
