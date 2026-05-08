import { useEffect, useMemo, useState } from 'react';
import {
  BarChart,
  Bar,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Building2, ChartColumnBig, TrendingUp, TriangleAlert } from 'lucide-react';
import { authApi } from '../../lib/authApi';

const COLORS = ['#0f172a', '#2563eb', '#f59e0b', '#14b8a6', '#ef4444', '#8b5cf6'];

const formatCurrency = (value) =>
  new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency: 'PKR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value || 0);

export default function AdvocateAnalytics() {
  const [loading, setLoading] = useState(true);
  const [commission, setCommission] = useState({ trends: [], rising_platforms: [] });
  const [distribution, setDistribution] = useState([]);
  const [complaints, setComplaints] = useState({ categories: [], platforms: [], systemic_issues: [] });

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [commissionRes, distributionRes, complaintsRes] = await Promise.all([
          authApi.get('/api/analytics/commission-trends'),
          authApi.get('/api/analytics/income-distribution'),
          authApi.get('/api/analytics/top-complaints'),
        ]);

        setCommission(commissionRes.data);
        setDistribution(distributionRes.data.distribution || []);
        setComplaints(complaintsRes.data);
      } catch (error) {
        console.error('Failed to load advocate analytics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const commissionChartData = useMemo(() => {
    const weekMap = {};
    (commission.trends || []).forEach((platform) => {
      platform.series.forEach((point) => {
        if (!weekMap[point.label]) {
          weekMap[point.label] = { week: point.label };
        }
        weekMap[point.label][platform.platform] = point.avg_commission ?? null;
      });
    });
    return Object.values(weekMap);
  }, [commission]);

  if (loading) {
    return <div className="flex h-64 items-center justify-center text-gray-500">Loading market analytics...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-bold text-slate-900">Advocate Analytics</h2>
        <p className="mt-1 text-sm text-slate-600">
          Three-month commission tracking, city-by-city earnings distribution, and complaint pattern analysis.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-amber-600" />
            <h3 className="text-lg font-semibold text-slate-900">Weekly Commission Trends</h3>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={commissionChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="week" stroke="#64748b" />
                <YAxis stroke="#64748b" />
                <Tooltip />
                <Legend />
                {(commission.trends || []).map((platform, index) => (
                  <Line
                    key={platform.platform}
                    type="monotone"
                    dataKey={platform.platform}
                    stroke={COLORS[index % COLORS.length]}
                    strokeWidth={3}
                    dot={false}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <ChartColumnBig className="h-5 w-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-slate-900">Platforms Increasing Deductions</h3>
          </div>
          <div className="space-y-3">
            {(commission.rising_platforms || []).map((item) => (
              <div key={item.platform} className="rounded-2xl border border-amber-100 bg-amber-50 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold text-slate-900">{item.platform}</p>
                  <span className="rounded-full bg-amber-200 px-2.5 py-1 text-xs font-semibold text-amber-900">
                    +{item.change}%
                  </span>
                </div>
                <p className="mt-2 text-sm text-slate-600">
                  Recent average: {item.recent_avg}% commission
                </p>
                <p className="text-xs text-slate-500">Previous baseline: {item.previous_avg}%</p>
              </div>
            ))}
            {(!commission.rising_platforms || commission.rising_platforms.length === 0) && (
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 text-sm text-slate-600">
                No platform is currently showing a meaningful upward commission trend.
              </div>
            )}
          </div>
        </section>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <Building2 className="h-5 w-5 text-emerald-600" />
            <h3 className="text-lg font-semibold text-slate-900">Income Distribution by City</h3>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={distribution}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="city_zone" stroke="#64748b" />
                <YAxis stroke="#64748b" />
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Legend />
                <Bar dataKey="average_earnings" name="Average" fill="#2563eb" radius={[8, 8, 0, 0]} />
                <Bar dataKey="median_earnings" name="Median" fill="#14b8a6" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="text-left text-slate-500">
                <tr>
                  <th className="pb-2 pr-4">City</th>
                  <th className="pb-2 pr-4">Workers</th>
                  <th className="pb-2 pr-4">Min</th>
                  <th className="pb-2 pr-4">Max</th>
                </tr>
              </thead>
              <tbody>
                {distribution.map((item) => (
                  <tr key={item.city_zone} className="border-t border-slate-100 text-slate-700">
                    <td className="py-3 pr-4 font-medium">{item.city_zone}</td>
                    <td className="py-3 pr-4">{item.worker_count}</td>
                    <td className="py-3 pr-4">{formatCurrency(item.min_earnings)}</td>
                    <td className="py-3 pr-4">{formatCurrency(item.max_earnings)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <TriangleAlert className="h-5 w-5 text-rose-600" />
              <h3 className="text-lg font-semibold text-slate-900">Top Complaint Categories</h3>
            </div>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={complaints.categories}
                    dataKey="count"
                    nameKey="category"
                    innerRadius={62}
                    outerRadius={98}
                    paddingAngle={3}
                    label={({ category, percentage }) => `${category} ${percentage}%`}
                  >
                    {(complaints.categories || []).map((entry, index) => (
                      <Cell key={entry.category} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900">Systemic Issues This Week</h3>
            <div className="mt-4 space-y-3">
              {(complaints.systemic_issues || []).map((issue) => (
                <div key={`${issue.platform}-${issue.category}`} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-900">{issue.platform}</p>
                      <p className="text-sm text-slate-500">{issue.category}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-slate-900">{issue.complaint_count} complaints</p>
                      <p className="text-xs text-slate-500">{issue.unresolved_count} unresolved</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 border-t border-slate-100 pt-4">
              <h4 className="text-sm font-semibold text-slate-800">Platforms Mentioned in Complaints</h4>
              <div className="mt-3 flex flex-wrap gap-2">
                {(complaints.platforms || []).map((platform) => (
                  <span
                    key={platform.platform}
                    className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700"
                  >
                    {platform.platform} ({platform.count})
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
