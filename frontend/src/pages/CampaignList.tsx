import { useEffect, useState } from 'react';
import client from '../api/client';
import type { Campaign, CampaignStatus } from '../types/campaign';

const STATUS_OPTIONS: { value: '' | CampaignStatus; label: string }[] = [
  { value: '', label: 'All statuses' },
  { value: 'active', label: 'Active' },
  { value: 'paused', label: 'Paused' },
  { value: 'ended', label: 'Ended' },
];

const STATUS_STYLES: Record<CampaignStatus, string> = {
  active: 'bg-green-100 text-green-700',
  paused: 'bg-yellow-100 text-yellow-700',
  ended:  'bg-gray-100 text-gray-500',
};

export default function CampaignList() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);

  const [status, setStatus]       = useState<'' | CampaignStatus>('');
  const [advertiser, setAdvertiser] = useState('');
  const [country, setCountry]     = useState('');

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);

    const params: Record<string, string> = {};
    if (status)     params.status = status;
    if (advertiser) params.advertiser = advertiser;
    if (country)    params.country = country.toUpperCase();

    client
      .get<Campaign[]>('/campaigns', { params, signal: controller.signal })
      .then((res) => setCampaigns(res.data))
      .catch((err) => {
        if (err.name !== 'CanceledError') setError('Failed to load campaigns.');
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [status, advertiser, country]);

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-800 mb-6">Campaigns</h1>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as '' | CampaignStatus)}
          className="border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>

        <input
          type="text"
          placeholder="Filter by advertiser"
          value={advertiser}
          onChange={(e) => setAdvertiser(e.target.value)}
          className="border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        <input
          type="text"
          placeholder="Filter by country (e.g. FR)"
          value={country}
          onChange={(e) => setCountry(e.target.value)}
          maxLength={2}
          className="border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-700 w-48 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* States */}
      {loading && <p className="text-gray-500 text-sm">Loading campaigns...</p>}
      {error   && <p className="text-red-500 text-sm">{error}</p>}

      {/* Table */}
      {!loading && !error && (
        campaigns.length === 0 ? (
          <p className="text-gray-500 text-sm">No campaigns found.</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
                <tr>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Advertiser</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Impressions</th>
                  <th className="px-4 py-3">Budget</th>
                  <th className="px-4 py-3">Countries</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {campaigns.map((c) => (
                  <tr key={c._id} className="bg-white hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-800">{c.name}</td>
                    <td className="px-4 py-3 text-gray-600">{c.advertiser}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_STYLES[c.status]}`}>
                        {c.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {c.impressionsServed.toLocaleString()} / {c.budget.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{c.budget.toLocaleString()}</td>
                    <td className="px-4 py-3 text-gray-600">{c.targetCountries.join(', ')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}
    </div>
  );
}
