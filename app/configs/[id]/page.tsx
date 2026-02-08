import Link from 'next/link';
import { notFound } from 'next/navigation';
import { eq, desc } from 'drizzle-orm';
import { db } from '@/lib/db';
import { scrapingConfigs, scrapingResults } from '@/lib/db/schema';
import { DeleteButton } from './delete-button';

export const dynamic = 'force-dynamic';

export default async function ConfigDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const configId = Number(id);

  const config = await db.query.scrapingConfigs.findFirst({
    where: eq(scrapingConfigs.id, configId),
  });

  if (!config) notFound();

  const results = await db
    .select()
    .from(scrapingResults)
    .where(eq(scrapingResults.configId, configId))
    .orderBy(desc(scrapingResults.createdAt))
    .limit(20);

  return (
    <div className="min-h-screen bg-zinc-50 font-sans dark:bg-zinc-950">
      <main className="mx-auto max-w-4xl px-6 py-12">
        <Link
          href="/"
          className="text-sm text-zinc-500 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
        >
          &larr; Back to dashboard
        </Link>

        <div className="mt-6 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
              Config #{config.id}
            </h1>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400 break-all">
              {config.url}
            </p>
          </div>
          <DeleteButton configId={config.id} />
        </div>

        <div className="mt-6 rounded-lg border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
          <dl className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-zinc-500 dark:text-zinc-400">Selector</dt>
              <dd className="mt-1 font-mono text-zinc-900 dark:text-zinc-100">
                {config.selector}
              </dd>
            </div>
            <div>
              <dt className="text-zinc-500 dark:text-zinc-400">Interval</dt>
              <dd className="mt-1 text-zinc-900 dark:text-zinc-100">
                Every {config.minutes} minutes
              </dd>
            </div>
            <div>
              <dt className="text-zinc-500 dark:text-zinc-400">Last Run</dt>
              <dd className="mt-1 text-zinc-900 dark:text-zinc-100">
                {config.lastRun ? config.lastRun.toLocaleString() : 'Never'}
              </dd>
            </div>
            <div>
              <dt className="text-zinc-500 dark:text-zinc-400">Status</dt>
              <dd className="mt-1">
                {config.error ? (
                  <span className="text-red-600 dark:text-red-400">
                    {config.error}
                  </span>
                ) : (
                  <span className="text-green-600 dark:text-green-400">OK</span>
                )}
              </dd>
            </div>
          </dl>

          <div className="mt-4 rounded bg-zinc-50 px-3 py-2 dark:bg-zinc-800">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              API Endpoint:{' '}
              <code className="text-zinc-900 dark:text-zinc-100">
                /api/v1/fetch/{config.id}
              </code>
            </p>
          </div>
        </div>

        <h2 className="mt-10 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          Results ({results.length})
        </h2>

        {results.length === 0 ? (
          <p className="mt-4 text-sm text-zinc-500 dark:text-zinc-400">
            No results yet. The worker will scrape this URL on the next tick.
          </p>
        ) : (
          <div className="mt-4 space-y-3">
            {results.map((result) => (
              <details
                key={result.id}
                className="rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900"
              >
                <summary className="cursor-pointer px-4 py-3 text-sm text-zinc-700 dark:text-zinc-300">
                  <span className="font-medium">
                    {result.createdAt.toLocaleString()}
                  </span>
                  <span className="ml-2 font-mono text-xs text-zinc-400">
                    {result.hash.slice(0, 12)}...
                  </span>
                </summary>
                <pre className="max-h-64 overflow-auto border-t border-zinc-100 px-4 py-3 text-xs text-zinc-700 dark:border-zinc-800 dark:text-zinc-300">
                  {JSON.stringify(result.content, null, 2)}
                </pre>
              </details>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
