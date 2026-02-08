import Link from 'next/link';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { eq, count } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { scrapingConfigs, scrapingResults } from '@/lib/db/schema';
import { SignOutButton } from './sign-out-button';
import { CopyApiUrl } from './copy-api-url';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session) redirect('/sign-in');

  const configs = await db
    .select()
    .from(scrapingConfigs)
    .where(eq(scrapingConfigs.userId, session.user.id));

  const resultsCount = await db
    .select({ configId: scrapingResults.configId, total: count() })
    .from(scrapingResults)
    .groupBy(scrapingResults.configId);

  const countMap = new Map(resultsCount.map((r) => [r.configId, r.total]));

  return (
    <div className="min-h-screen bg-zinc-50 font-sans dark:bg-zinc-950">
      <main className="mx-auto max-w-4xl px-6 py-12">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
              Scrapper SaaS
            </h1>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              {session.user.email}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/settings"
              className="rounded-lg border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              API Keys
            </Link>
            <Link
              href="/configs/new"
              className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
            >
              + New Config
            </Link>
            <SignOutButton />
          </div>
        </div>

        {configs.length === 0 ? (
          <div className="rounded-lg border border-dashed border-zinc-300 p-12 text-center dark:border-zinc-700">
            <p className="text-zinc-500 dark:text-zinc-400">
              No scraping configs yet. Create one to get started.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {configs.map((config) => (
              <Link
                key={config.id}
                href={`/configs/${config.id}`}
                className="block rounded-lg border border-zinc-200 bg-white p-5 transition-colors hover:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-600"
              >
                <div className="flex items-start justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-zinc-900 dark:text-zinc-100">
                      {config.url}
                    </p>
                    <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                      Selector: <code className="text-xs">{config.selector}</code>
                      {' | '}
                      Every {config.minutes} min
                      {' | '}
                      {countMap.get(config.id) ?? 0} results
                    </p>
                  </div>
                  <div className="ml-4 flex flex-col items-end gap-1">
                    {config.error ? (
                      <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700 dark:bg-red-900/30 dark:text-red-400">
                        Error
                      </span>
                    ) : config.lastRun ? (
                      <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
                        Active
                      </span>
                    ) : (
                      <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                        Pending
                      </span>
                    )}
                    {config.lastRun && (
                      <span className="text-xs text-zinc-400">
                        Last: {config.lastRun.toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>
                {config.error && (
                  <p className="mt-2 truncate text-xs text-red-600 dark:text-red-400">
                    {config.error}
                  </p>
                )}
                <div className="mt-2 flex items-center justify-between">
                  <p className="text-xs text-zinc-400">
                    API: /api/v1/{config.publicId}
                  </p>
                  <CopyApiUrl publicId={config.publicId} />
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
