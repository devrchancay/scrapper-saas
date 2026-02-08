'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Config {
  id: number;
  url: string;
  selector: string;
  prompt: string;
  minutes: number;
}

export function EditForm({ config }: { config: Config }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSaved(false);

    const formData = new FormData(e.currentTarget);
    const body = {
      url: formData.get('url') as string,
      selector: formData.get('selector') as string,
      prompt: formData.get('prompt') as string,
      minutes: Number(formData.get('minutes')) || 5,
    };

    const res = await fetch(`/api/configs/${config.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || 'Failed to save');
    } else {
      setSaved(true);
      router.refresh();
    }
    setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm text-zinc-500 dark:text-zinc-400">
          URL
        </label>
        <p className="mt-1 break-all text-sm text-zinc-900 dark:text-zinc-100">
          {config.url}
        </p>
      </div>

      <div>
        <label
          htmlFor="selector"
          className="block text-sm text-zinc-500 dark:text-zinc-400"
        >
          CSS Selector
        </label>
        <input
          id="selector"
          name="selector"
          type="text"
          required
          defaultValue={config.selector}
          className="mt-1 block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm font-mono text-zinc-900 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
        />
      </div>

      <div>
        <label
          htmlFor="prompt"
          className="block text-sm text-zinc-500 dark:text-zinc-400"
        >
          Prompt
        </label>
        <textarea
          id="prompt"
          name="prompt"
          rows={3}
          required
          defaultValue={config.prompt}
          className="mt-1 block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
        />
      </div>

      <div>
        <label
          htmlFor="minutes"
          className="block text-sm text-zinc-500 dark:text-zinc-400"
        >
          Interval (minutes)
        </label>
        <input
          id="minutes"
          name="minutes"
          type="number"
          min={1}
          required
          defaultValue={config.minutes}
          className="mt-1 block w-32 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
        />
      </div>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
        >
          {loading ? 'Saving...' : 'Save Changes'}
        </button>
        {saved && (
          <span className="text-sm text-green-600 dark:text-green-400">
            Saved
          </span>
        )}
        {error && (
          <span className="text-sm text-red-600 dark:text-red-400">
            {error}
          </span>
        )}
      </div>
    </form>
  );
}
