import { useEffect, useState } from 'react';
import client from '../api/client';
import type { Stats } from '../types/stats';

export default function Dashboard() {
  const [stats, setStats]     = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  useEffect(() => {
    client
      .get<Stats>('/stats')
      .then((res) => setStats(res.data))
      .catch(() => setError('Failed to load statistics.'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-800 mb-6">Dashboard</h1>

      {loading && <p className="text-gray-500 text-sm">Loading statistics...</p>}
      {error   && <p className="text-red-500 text-sm">{error}</p>}

      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <StatCard label="Total campaigns"    value={stats.totalCampaigns} />
          <StatCard label="Active campaigns"   value={stats.activeCampaigns} />
          <StatCard label="Total impressions"  value={stats.totalImpressions.toLocaleString()} />
          <StatCard
            label="Top advertiser"
            value={stats.topAdvertiser ?? 'No data yet'}
            muted={!stats.topAdvertiser}
          />
        </div>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  muted = false,
}: {
  label: string;
  value: string | number;
  muted?: boolean;
}) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white px-6 py-5">
      <p className="text-sm text-gray-500 mb-1">{label}</p>
      <p className={`text-2xl font-semibold ${muted ? 'text-gray-400' : 'text-gray-800'}`}>
        {value}
      </p>
    </div>
  );
}
