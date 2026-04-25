// src/pages/WorkerDashboard/Analytics.jsx
import React, { useState, useEffect } from 'react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, Area, AreaChart,
  PieChart, Pie, Cell
} from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, Clock, Calendar, Download } from 'lucide-react';
import { authApi } from '../../lib/authApi';

const COLORS = ['#3B82F6', '#8B5CF6', '#F59E0B', '#EF4444', '#10B981'];

const Analytics = () => {
  const [loading, setLoading] = useState(true);
  const [earningsData, setEarningsData] = useState([]);
  const [hourlyRateData, setHourlyRateData] = useState([]);
  const [platformData, setPlatformData] = useState([]);
  const [summary, setSummary] = useState({
    total_earnings: 0,
    avg_hourly_rate: 0,
    total_hours: 0,
    total_shifts: 0,
    best_platform: '',
    best_day: ''
  });
  const [period, setPeriod] = useState('week'); // week, month, year

  useEffect(() => {
    fetchAnalytics();
  }, [period]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      // Fetch shifts for date range
      const endDate = new Date().toISOString().split('T')[0];
      let startDate = new Date();
      
      if (period === 'week') startDate.setDate(startDate.getDate() - 7);
      if (period === 'month') startDate.setDate(startDate.getDate() - 30);
      if (period === 'year') startDate.setDate(startDate.getDate() - 365);
      
      const startDateStr = startDate.toISOString().split('T')[0];
      
      const shiftsRes = await authApi.get(`/api/shifts/range?start_date=${startDateStr}&end_date=${endDate}`);
      const summaryRes = await authApi.get('/api/shifts/summary');
      
      const shifts = shiftsRes.data.shifts || [];
      
      // Process earnings data for chart
      const earningsByDate = {};
      const hourlyByDate = {};
      const platformTotals = {};
      
      shifts.forEach(shift => {
        const date = new Date(shift.shift_date).toLocaleDateString('en-PK', { month: 'short', day: 'numeric' });
        const net = Number(shift.net_received);
        const hours = Number(shift.hours_worked);
        const hourlyRate = hours > 0 ? net / hours : 0;
        
        // Earnings by date
        if (!earningsByDate[date]) {
          earningsByDate[date] = { date, earnings: 0, hours: 0 };
        }
        earningsByDate[date].earnings += net;
        earningsByDate[date].hours += hours;
        
        // Platform totals
        if (!platformTotals[shift.platform]) {
          platformTotals[shift.platform] = { platform: shift.platform, earnings: 0, hours: 0, shifts: 0 };
        }
        platformTotals[shift.platform].earnings += net;
        platformTotals[shift.platform].hours += hours;
        platformTotals[shift.platform].shifts += 1;
      });
      
      // Calculate hourly rates
      Object.keys(earningsByDate).forEach(date => {
        const data = earningsByDate[date];
        hourlyByDate[date] = {
          date,
          hourlyRate: data.hours > 0 ? data.earnings / data.hours : 0
        };
      });
      
      setEarningsData(Object.values(earningsByDate));
      setHourlyRateData(Object.values(hourlyByDate));
      setPlatformData(Object.values(platformTotals));
      
      // Calculate summary stats
      const totalEarnings = shifts.reduce((sum, s) => sum + Number(s.net_received), 0);
      const totalHours = shifts.reduce((sum, s) => sum + Number(s.hours_worked), 0);
      const avgHourly = totalHours > 0 ? totalEarnings / totalHours : 0;
      
      // Find best platform
      let bestPlatform = '';
      let maxEarnings = 0;
      Object.values(platformTotals).forEach(p => {
        if (p.earnings > maxEarnings) {
          maxEarnings = p.earnings;
          bestPlatform = p.platform;
        }
      });
      
      setSummary({
        total_earnings: totalEarnings,
        avg_hourly_rate: avgHourly,
        total_hours: totalHours,
        total_shifts: shifts.length,
        best_platform: bestPlatform,
        best_day: Object.keys(earningsByDate).sort((a, b) => 
          earningsByDate[b].earnings - earningsByDate[a].earnings
        )[0] || 'N/A'
      });
      
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
          <p className="font-semibold text-gray-900">{label}</p>
          <p className="text-blue-600">
            Earnings: {formatCurrency(payload[0].value)}
          </p>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading analytics...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Analytics</h2>
          <p className="text-gray-600 mt-1">Track your earnings performance over time</p>
        </div>
        
        {/* Period Selector */}
        <div className="flex gap-2">
          {['week', 'month', 'year'].map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                period === p
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Earnings</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(summary.total_earnings)}</p>
            </div>
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-blue-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Avg Hourly Rate</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(summary.avg_hourly_rate)}</p>
            </div>
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Hours</p>
              <p className="text-2xl font-bold text-gray-900">{summary.total_hours} hrs</p>
            </div>
            <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
              <Clock className="w-5 h-5 text-orange-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Shifts</p>
              <p className="text-2xl font-bold text-gray-900">{summary.total_shifts}</p>
            </div>
            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
              <Calendar className="w-5 h-5 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Earnings Trend Chart */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Earnings Trend</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={earningsData}>
              <defs>
                <linearGradient id="colorEarnings" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="date" stroke="#6B7280" />
              <YAxis stroke="#6B7280" />
              <Tooltip content={<CustomTooltip />} />
              <Area 
                type="monotone" 
                dataKey="earnings" 
                stroke="#3B82F6" 
                strokeWidth={2}
                fill="url(#colorEarnings)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Hourly Rate Trend */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Hourly Rate Trend</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={hourlyRateData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="date" stroke="#6B7280" />
                <YAxis stroke="#6B7280" />
                <Tooltip 
                  formatter={(value) => [`${formatCurrency(value)}/hr`, 'Hourly Rate']}
                />
                <Line 
                  type="monotone" 
                  dataKey="hourlyRate" 
                  stroke="#F59E0B" 
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Platform Breakdown - Bar Chart */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Earnings by Platform</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={platformData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis type="number" stroke="#6B7280" />
                <YAxis type="category" dataKey="platform" stroke="#6B7280" />
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Bar dataKey="earnings" fill="#8B5CF6" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Platform Distribution Pie Chart & Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Pie Chart */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Platform Distribution</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={platformData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  dataKey="earnings"
                  label={({ platform, percent }) => `${platform} (${(percent * 100).toFixed(0)}%)`}
                >
                  {platformData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatCurrency(value)} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Insights Card */}
        <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl border border-blue-100 p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Key Insights</h3>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <TrendingUp className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Best Performing Platform</p>
                <p className="text-gray-600">{summary.best_platform} with {formatCurrency(platformData.find(p => p.platform === summary.best_platform)?.earnings || 0)} total earnings</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                <DollarSign className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Best Day for Earnings</p>
                <p className="text-gray-600">{summary.best_day} had the highest earnings</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Clock className="w-4 h-4 text-orange-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Average Hourly Rate</p>
                <p className="text-gray-600">{formatCurrency(summary.avg_hourly_rate)}/hour across all platforms</p>
              </div>
            </div>
          </div>
          
          <button 
            onClick={() => window.print()}
            className="mt-6 w-full flex items-center justify-center gap-2 py-2 px-4 bg-white border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 transition"
          >
            <Download className="w-4 h-4" />
            Export Report
          </button>
        </div>
      </div>
    </div>
  );
};

export default Analytics;