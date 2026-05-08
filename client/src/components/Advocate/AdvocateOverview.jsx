import { useEffect, useState } from 'react';
import {
  AlertTriangle,
  Building2,
  ShieldCheck,
  Siren,
  TrendingUp,
  Users,
} from 'lucide-react';
import { authApi } from '../../lib/authApi';

const formatCurrency = (value) =>
  new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency: 'PKR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value || 0);

export default function AdvocateOverview() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  useEffect(() => {
    const fetchSummary = async () => {
      setLoading(true);
      try {
        const response = await authApi.get('/api/analytics/summary');
        setData(response.data);
      } catch (error) {
        console.error('Failed to load advocate summary:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSummary();
  }, []);

  if (loading) {
    return <div className="flex h-64 items-center justify-center text-gray-500">Loading advocate dashboard...</div>;
  }

  if (!data) {
    return <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">Unable to load advocate insights right now.</div>;
  }

  const cards = [
    {
      label: 'Vulnerable Workers',
      value: data.overview.vulnerable_workers,
      icon: Users,
      tone: 'bg-rose-100 text-rose-700',
      caption: 'Workers with >20% earnings drop in the last 30 days',
    },
    {
      label: 'Avg Commission',
      value: `${data.overview.avg_commission_this_week}%`,
      icon: TrendingUp,
      tone: 'bg-amber-100 text-amber-700',
      caption: 'Average platform deduction this week',
    },
    {
      label: 'Complaints This Week',
      value: data.overview.complaints_this_week,
      icon: AlertTriangle,
      tone: 'bg-blue-100 text-blue-700',
      caption: `${data.overview.open_complaints} still pending or escalated`,
    },
    {
      label: 'Cities Covered',
      value: data.overview.active_cities,
      icon: Building2,
      tone: 'bg-emerald-100 text-emerald-700',
      caption: `${data.overview.rising_platform_count} platforms increasing deductions`,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-slate-950 p-3 text-white">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Advocate Command Center</h2>
            <p className="text-sm text-slate-600">Monitor worker risk, platform deductions, and complaint patterns from one place.</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {cards.map(({ label, value, icon: Icon, tone, caption }) => (
          <div key={label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm text-slate-500">{label}</p>
                <p className="mt-2 text-3xl font-bold text-slate-900">{value}</p>
                <p className="mt-2 text-xs leading-5 text-slate-500">{caption}</p>
              </div>
              <div className={`rounded-2xl p-3 ${tone}`}>
                <Icon className="h-5 w-5" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <Siren className="h-5 w-5 text-rose-600" />
            <h3 className="text-lg font-semibold text-slate-900">Workers Needing Attention</h3>
          </div>
          <div className="space-y-3">
            {data.vulnerable_workers.slice(0, 5).map((worker) => (
              <div key={worker.user_id} className="flex flex-col gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-semibold text-slate-900">{worker.name}</p>
                  <p className="text-sm text-slate-500">{worker.city}</p>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm sm:text-right">
                  <div>
                    <p className="text-slate-400">Current</p>
                    <p className="font-semibold text-slate-900">{formatCurrency(worker.current_month_earnings)}</p>
                  </div>
                  <div>
                    <p className="text-slate-400">Drop</p>
                    <p className="font-semibold text-rose-600">{worker.drop_percentage}%</p>
                  </div>
                </div>
              </div>
            ))}
            {data.vulnerable_workers.length === 0 && (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
                No vulnerable workers detected right now.
              </div>
            )}
          </div>
        </section>

        <section className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-amber-600" />
              <h3 className="text-lg font-semibold text-slate-900">Rising Commission Platforms</h3>
            </div>
            <div className="space-y-3">
              {data.rising_platforms.slice(0, 4).map((item) => (
                <div key={item.platform} className="rounded-2xl border border-amber-100 bg-amber-50 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold text-slate-900">{item.platform}</p>
                    <p className="text-sm font-semibold text-amber-700">+{item.change}%</p>
                  </div>
                  <p className="mt-1 text-sm text-slate-600">
                    {item.previous_avg}% to {item.recent_avg}% average deduction
                  </p>
                </div>
              ))}
              {data.rising_platforms.length === 0 && (
                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 text-sm text-slate-600">
                  No platform is showing a notable increase this cycle.
                </div>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-blue-600" />
              <h3 className="text-lg font-semibold text-slate-900">Systemic Complaint Signals</h3>
            </div>
            <div className="space-y-3">
              {data.complaints.systemic_issues.slice(0, 4).map((issue) => (
                <div key={`${issue.platform}-${issue.category}`} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold text-slate-900">{issue.platform}</p>
                    <span className="rounded-full bg-slate-900 px-2.5 py-1 text-xs font-semibold text-white">
                      {issue.complaint_count} cases
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-slate-600">{issue.category}</p>
                  <p className="mt-2 text-xs text-slate-500">
                    {issue.unresolved_count} unresolved, {issue.escalated_count} escalated
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
