import { useEffect, useState } from 'react';
import { ArrowDownRight, BriefcaseBusiness, MapPin, Wallet } from 'lucide-react';
import { authApi } from '../../lib/authApi';

const formatCurrency = (value) =>
  new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency: 'PKR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value || 0);

export default function AdvocateWorkers() {
  const [loading, setLoading] = useState(true);
  const [workers, setWorkers] = useState([]);

  useEffect(() => {
    const fetchWorkers = async () => {
      setLoading(true);
      try {
        const response = await authApi.get('/api/analytics/vulnerable-workers');
        setWorkers(response.data.workers || []);
      } catch (error) {
        console.error('Failed to load vulnerable workers:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchWorkers();
  }, []);

  if (loading) {
    return <div className="flex h-64 items-center justify-center text-gray-500">Loading worker risk signals...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-bold text-slate-900">Vulnerable Workers</h2>
        <p className="mt-1 text-sm text-slate-600">
          Workers whose confirmed earnings dropped by more than 20% in the last 30 days versus the previous 30 days.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {workers.map((worker) => (
          <article key={worker.user_id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">{worker.name}</h3>
                <div className="mt-2 flex flex-wrap gap-3 text-sm text-slate-500">
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="h-4 w-4" />
                    {worker.city}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <BriefcaseBusiness className="h-4 w-4" />
                    {worker.current_shift_count} current shifts
                  </span>
                </div>
              </div>

              <div className="inline-flex items-center gap-2 rounded-full bg-rose-50 px-3 py-1.5 text-sm font-semibold text-rose-700">
                <ArrowDownRight className="h-4 w-4" />
                {worker.drop_percentage}% drop
              </div>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Current 30 Days</p>
                <p className="mt-2 text-lg font-semibold text-slate-900">{formatCurrency(worker.current_month_earnings)}</p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Previous 30 Days</p>
                <p className="mt-2 text-lg font-semibold text-slate-900">{formatCurrency(worker.previous_month_earnings)}</p>
              </div>
              <div className="rounded-2xl bg-amber-50 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-amber-600">Advocacy Need</p>
                <p className="mt-2 text-lg font-semibold text-amber-900">
                  {worker.previous_shift_count - worker.current_shift_count > 0 ? 'Shift volume down' : 'Income compression'}
                </p>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-2 text-sm text-slate-500">
              <Wallet className="h-4 w-4 text-slate-400" />
              Monthly loss of {formatCurrency(worker.previous_month_earnings - worker.current_month_earnings)}
            </div>
          </article>
        ))}
      </div>

      {workers.length === 0 && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-center text-emerald-700 shadow-sm">
          No workers crossed the 20% risk threshold in the current reporting window.
        </div>
      )}
    </div>
  );
}
