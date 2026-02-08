'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function ScrapeButton({ configId }: { configId: number }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleScrape() {
    setLoading(true);
    setError('');

    const res = await fetch(`/api/configs/${configId}/scrape`, {
      method: 'POST',
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || 'Scrape failed');
    }

    setLoading(false);
    router.refresh();
  }

  return (
    <div>
      <button
        onClick={handleScrape}
        disabled={loading}
        className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
      >
        {loading ? 'Scraping...' : 'Scrape Now'}
      </button>
      {error && (
        <p className="mt-1 text-xs text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  );
}
