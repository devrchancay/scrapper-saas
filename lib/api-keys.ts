import { randomBytes, createHash } from 'crypto';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { apiKey } from '@/lib/db/schema';

export function generateApiKey(): string {
  return `sk_${randomBytes(32).toString('hex')}`;
}

export function hashApiKey(key: string): string {
  return createHash('sha256').update(key).digest('hex');
}

export async function validateApiKey(
  key: string
): Promise<string | null> {
  const hashed = hashApiKey(key);
  const row = await db.query.apiKey.findFirst({
    where: eq(apiKey.key, hashed),
  });
  return row?.userId ?? null;
}
