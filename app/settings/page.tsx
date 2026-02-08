'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

interface ApiKeyInfo {
  id: string;
  name: string;
  createdAt: string;
}

export default function SettingsPage() {
  const [keys, setKeys] = useState<ApiKeyInfo[]>([]);
  const [newKeyName, setNewKeyName] = useState('');
  const [revealedKey, setRevealedKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchKeys = useCallback(async () => {
    const res = await fetch('/api/keys');
    if (res.ok) {
      setKeys(await res.json());
    }
  }, []);

  useEffect(() => {
    fetchKeys();
  }, [fetchKeys]);

  async function handleCreate() {
    setLoading(true);
    setRevealedKey(null);

    const res = await fetch('/api/keys', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newKeyName || 'Default' }),
    });

    if (res.ok) {
      const data = await res.json();
      setRevealedKey(data.key);
      setNewKeyName('');
      await fetchKeys();
    }
    setLoading(false);
  }

  async function handleRevoke(id: string) {
    await fetch(`/api/keys?id=${id}`, { method: 'DELETE' });
    setKeys((prev) => prev.filter((k) => k.id !== id));
  }

  return (
    <div className="min-h-screen bg-zinc-50 font-sans dark:bg-zinc-950">
      <main className="mx-auto max-w-2xl px-6 py-12">
        <Link
          href="/"
          className="text-sm text-zinc-500 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
        >
          &larr; Back to dashboard
        </Link>

        <h1 className="mt-6 text-2xl font-bold text-zinc-900 dark:text-zinc-50">
          API Keys
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Generate API keys to access your scraping results programmatically.
        </p>

        <div className="mt-8 flex gap-3">
          <input
            type="text"
            value={newKeyName}
            onChange={(e) => setNewKeyName(e.target.value)}
            placeholder="Key name (optional)"
            className="flex-1 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
          />
          <button
            onClick={handleCreate}
            disabled={loading}
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
          >
            Generate Key
          </button>
        </div>

        {revealedKey && (
          <div className="mt-4 rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-900/20">
            <p className="text-sm font-medium text-green-800 dark:text-green-300">
              Copy this key now. It won&apos;t be shown again.
            </p>
            <code className="mt-2 block break-all rounded bg-green-100 px-3 py-2 text-xs text-green-900 dark:bg-green-900/40 dark:text-green-200">
              {revealedKey}
            </code>
          </div>
        )}

        <div className="mt-8 space-y-3">
          {keys.length === 0 ? (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              No API keys yet.
            </p>
          ) : (
            keys.map((k) => (
              <div
                key={k.id}
                className="flex items-center justify-between rounded-lg border border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900"
              >
                <div>
                  <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                    {k.name}
                  </p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Created {new Date(k.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <button
                  onClick={() => handleRevoke(k.id)}
                  className="text-sm text-red-600 hover:underline dark:text-red-400"
                >
                  Revoke
                </button>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
