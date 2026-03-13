import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import client from '../api/client';
import type { CampaignStatus } from '../types/campaign';

interface FormData {
  name: string;
  advertiser: string;
  startDate: string;
  endDate: string;
  budget: string;
  targetCountries: string;
  status: CampaignStatus;
}

const EMPTY_FORM: FormData = {
  name: '',
  advertiser: '',
  startDate: '',
  endDate: '',
  budget: '',
  targetCountries: '',
  status: 'active',
};

export default function CreateCampaign() {
  const navigate = useNavigate();
  const [form, setForm]       = useState<FormData>(EMPTY_FORM);
  const [errors, setErrors]   = useState<Partial<FormData>>({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const validate = (): boolean => {
    const e: Partial<FormData> = {};

    if (!form.name.trim())       e.name = 'Name is required.';
    if (!form.advertiser.trim()) e.advertiser = 'Advertiser is required.';
    if (!form.startDate)         e.startDate = 'Start date is required.';
    if (!form.endDate)           e.endDate = 'End date is required.';
    else if (form.startDate && new Date(form.endDate) <= new Date(form.startDate))
      e.endDate = 'End date must be after start date.';

    const budget = Number(form.budget);
    if (!form.budget || isNaN(budget) || budget < 1)
      e.budget = 'Budget must be a positive number.';

    const countries = form.targetCountries
      .split(',')
      .map((c) => c.trim())
      .filter(Boolean);

    if (countries.length === 0)
      e.targetCountries = 'At least one country is required.';
    else if (countries.some((c) => c.length !== 2))
      e.targetCountries = 'Each country must be a 2-letter ISO code (e.g. FR, ES).';

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setErrors((prev) => ({ ...prev, [e.target.name]: undefined }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    setServerError(null);

    try {
      await client.post('/campaigns', {
        name: form.name.trim(),
        advertiser: form.advertiser.trim(),
        startDate: form.startDate,
        endDate: form.endDate,
        budget: Number(form.budget),
        targetCountries: form.targetCountries.split(',').map((c) => c.trim().toUpperCase()),
        status: form.status,
      });
      navigate('/campaigns');
    } catch (err: unknown) {
      if (
        err &&
        typeof err === 'object' &&
        'response' in err &&
        (err as { response?: { data?: { errors?: { msg: string }[] } } }).response?.data?.errors
      ) {
        const apiErrors = (err as { response: { data: { errors: { msg: string }[] } } }).response.data.errors;
        setServerError(apiErrors.map((e) => e.msg).join(' '));
      } else {
        setServerError('Failed to create campaign. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-semibold text-gray-800 mb-6">New Campaign</h1>

      {serverError && (
        <div className="mb-4 rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
          {serverError}
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
        <Field label="Campaign name" error={errors.name}>
          <input name="name" value={form.name} onChange={handleChange} className={input(errors.name)} />
        </Field>

        <Field label="Advertiser" error={errors.advertiser}>
          <input name="advertiser" value={form.advertiser} onChange={handleChange} className={input(errors.advertiser)} />
        </Field>

        <div className="flex gap-4">
          <Field label="Start date" error={errors.startDate} className="flex-1">
            <input type="date" name="startDate" value={form.startDate} onChange={handleChange} className={input(errors.startDate)} />
          </Field>
          <Field label="End date" error={errors.endDate} className="flex-1">
            <input type="date" name="endDate" value={form.endDate} onChange={handleChange} className={input(errors.endDate)} />
          </Field>
        </div>

        <Field label="Budget (max impressions)" error={errors.budget}>
          <input type="number" name="budget" value={form.budget} onChange={handleChange} min={1} className={input(errors.budget)} />
        </Field>

        <Field label="Target countries" hint='Comma-separated 2-letter ISO codes, e.g. "FR, ES, DE"' error={errors.targetCountries}>
          <input name="targetCountries" value={form.targetCountries} onChange={handleChange} placeholder="FR, ES, DE" className={input(errors.targetCountries)} />
        </Field>

        <Field label="Status" error={errors.status}>
          <select name="status" value={form.status} onChange={handleChange} className={input(errors.status)}>
            <option value="active">Active</option>
            <option value="paused">Paused</option>
            <option value="ended">Ended</option>
          </select>
        </Field>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={submitting}
            className="px-5 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {submitting ? 'Creating...' : 'Create campaign'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/campaigns')}
            className="px-5 py-2 text-sm font-medium text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

// Small helper components to reduce repetition

function input(error?: string) {
  return `w-full border rounded-md px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
    error ? 'border-red-400' : 'border-gray-300'
  }`;
}

function Field({
  label,
  hint,
  error,
  className = '',
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <label className="text-sm font-medium text-gray-700">{label}</label>
      {hint && <p className="text-xs text-gray-400">{hint}</p>}
      {children}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
