'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function DeleteButton({ configId }: { configId: number }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    if (!confirm('Are you sure you want to delete this config and all its results?')) {
      return;
    }

    setLoading(true);
    await fetch(`/api/configs/${configId}`, { method: 'DELETE' });
    router.push('/');
  }

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className="rounded-lg border border-red-200 px-3 py-1.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20"
    >
      {loading ? 'Deleting...' : 'Delete'}
    </button>
  );
}
