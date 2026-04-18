// src/components/worker/AnalyticsCharts.tsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, Area, AreaChart, Pie, Cell, PieChart
} from 'recharts';
import { AlertTriangle, TrendingUp, DollarSign } from 'lucide-react';
import type { Summary, PlatformBreakdown } from './type';

interface AnalyticsChartsProps {
    summary: Summary | null;
    platformBreakdown: PlatformBreakdown[];
    cityMedian: number | null;
    userId: number;
}

const API_GATEWAY_URL = 'http://localhost:5000';

const AnalyticsCharts: React.FC<AnalyticsChartsProps> = ({
    summary, platformBreakdown, cityMedian, userId
}) => {
    const [earningsData, setEarningsData] = useState<any[]>([]);
    const [anomalies, setAnomalies] = useState<any[]>([]);
    const [hasAnomalies, setHasAnomalies] = useState(false);
    const [loading, setLoading] = useState(true);
    const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'year'>('week');

    const fetchEarningsData = async () => {
        try {
            let startDate = new Date();
            if (selectedPeriod === 'week') startDate.setDate(startDate.getDate() - 7);
            if (selectedPeriod === 'month') startDate.setDate(startDate.getDate() - 30);
            if (selectedPeriod === 'year') startDate.setDate(startDate.getDate() - 365);

            const startDateStr = startDate.toISOString().split('T')[0];
            const endDateStr = new Date().toISOString().split('T')[0];

            const shiftsRes = await axios.get(
                `${API_GATEWAY_URL}/api/shifts/range?start_date=${startDateStr}&end_date=${endDateStr}`,
                { withCredentials: true }
            );

            const shifts = shiftsRes.data.shifts || [];

            const formattedData = shifts.map((shift: any) => ({
                date: shift.shift_date.split('T')[0],  // Only "2026-04-17"
                earnings: shift.net_received,
                hours: shift.hours_worked,
                hourlyRate: shift.net_received / shift.hours_worked,
                platform: shift.platform
            }));
            setEarningsData(formattedData);
            await checkAnomalies(formattedData);

        } catch (error) {
            console.error('Error fetching earnings data:', error);
        } finally {
            setLoading(false);
        }
    };

    const checkAnomalies = async (earnings: any[]) => {
        try {
            const anomalyRequest = {
                user_id: userId,
                earnings: earnings.map(e => ({
                    date: e.date,
                    amount: e.earnings,
                    hours_worked: e.hours,
                    platform: e.platform
                }))
            };

            // ✅ Call through API GATEWAY (port 5000)
            const response = await axios.post(
                `${API_GATEWAY_URL}/api/anomaly/detect-anomalies`,
                anomalyRequest
            );

            console.log('✅ Anomaly detected:', response.data);

            setAnomalies(response.data.anomalies);
            setHasAnomalies(response.data.has_anomalies);

        } catch (error) {
            console.error('Error checking anomalies:', error);
        }
    };
    useEffect(() => {
        fetchEarningsData();
    }, [selectedPeriod]);

    const COLORS = ['#3B82F6', '#22C55E', '#F59E0B', '#EF4444'];

    const pieData = platformBreakdown.map(item => ({
        name: item.platform,
        value: item.total_net
    }));

    if (loading) return <div className="loading">Loading analytics...</div>;

    return (
        <div className="analytics-container">
            {/* Period Selector */}
            <div className="period-selector">
                <button
                    className={`period-btn ${selectedPeriod === 'week' ? 'active' : ''}`}
                    onClick={() => setSelectedPeriod('week')}
                >
                    Last 7 Days
                </button>
                <button
                    className={`period-btn ${selectedPeriod === 'month' ? 'active' : ''}`}
                    onClick={() => setSelectedPeriod('month')}
                >
                    Last 30 Days
                </button>
                <button
                    className={`period-btn ${selectedPeriod === 'year' ? 'active' : ''}`}
                    onClick={() => setSelectedPeriod('year')}
                >
                    Last Year
                </button>
            </div>

            {/* Anomaly Alert Section */}
            {hasAnomalies && (
                <div className="anomaly-alert-card">
                    <div className="anomaly-header">
                        <AlertTriangle size={24} color="#EF4444" />
                        <h3>⚠️ Anomaly Detected in Your Earnings!</h3>
                    </div>
                    <div className="anomaly-list">
                        {anomalies.map((anomaly, idx) => (
                            <div key={idx} className={`anomaly-item ${anomaly.severity}`}>
                                <div className="anomaly-date">{anomaly.date}</div>
                                <div className="anomaly-description">{anomaly.description}</div>
                                <div className={`anomaly-badge ${anomaly.severity}`}>
                                    {anomaly.severity === 'high' ? 'High Severity' : 'Medium Severity'}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Earnings Trend Graph */}
            <div className="card analytics-chart-card">
                <h3 className="card-title">Earnings Trend</h3>
                <p className="card-subtitle">Your daily earnings over time</p>
                <div className="chart-container">
                    <ResponsiveContainer width="100%" height={350}>
                        <AreaChart data={earningsData}>
                            <defs>
                                <linearGradient id="colorEarnings" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.4} />
                                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                            <XAxis dataKey="date" stroke="#64748B" angle={-45} textAnchor="end" height={60} />
                            <YAxis stroke="#64748B" />
                            <Tooltip contentStyle={{ backgroundColor: '#1E293B', border: 'none', borderRadius: '8px' }} />
                            <Area
                                type="monotone"
                                dataKey="earnings"
                                stroke="#3B82F6"
                                strokeWidth={3}
                                fill="url(#colorEarnings)"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Hourly Rate Graph */}
            <div className="card analytics-chart-card">
                <h3 className="card-title">Hourly Rate Trend</h3>
                <p className="card-subtitle">Your earnings per hour over time</p>
                <div className="chart-container">
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={earningsData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                            <XAxis dataKey="date" stroke="#64748B" />
                            <YAxis stroke="#64748B" />
                            <Tooltip contentStyle={{ backgroundColor: '#1E293B', border: 'none', borderRadius: '8px' }} />
                            <Line type="monotone" dataKey="hourlyRate" stroke="#22C55E" strokeWidth={3} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Two Column Layout */}
            <div className="two-column-grid">
                {/* Platform Breakdown Bar Chart */}
                <div className="card analytics-chart-card">
                    <h3 className="card-title">Earnings by Platform</h3>
                    <div className="chart-container-sm">
                        <ResponsiveContainer width="100%" height={250}>
                            <BarChart data={platformBreakdown}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                                <XAxis dataKey="platform" stroke="#64748B" />
                                <YAxis stroke="#64748B" />
                                <Tooltip contentStyle={{ backgroundColor: '#1E293B', border: 'none', borderRadius: '8px' }} />
                                <Bar dataKey="total_net" fill="#3B82F6" radius={[8, 8, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Platform Distribution Pie Chart - FIXED */}
                <div className="card analytics-chart-card">
                    <h3 className="card-title">Platform Distribution</h3>
                    <div className="chart-container-sm">
                        <ResponsiveContainer width="100%" height={250}>
                            <PieChart>
                                <Pie
                                    data={pieData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={90}
                                    dataKey="value"
                                    label={({ name, value }) => {
                                        const total = pieData.reduce((sum, item) => sum + item.value, 0);
                                        const percentage = ((value / total) * 100).toFixed(0);
                                        return `${name} (${percentage}%)`;
                                    }}
                                >
                                    {pieData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip contentStyle={{ backgroundColor: '#1E293B', border: 'none', borderRadius: '8px' }} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Performance vs City Average */}
            <div className="card benchmark-card">
                <h3 className="card-title">Performance vs City Average</h3>
                <div className="benchmark-grid">
                    <div className="benchmark-item">
                        <div className="benchmark-header">
                            <div>
                                <p className="benchmark-label">Your Hourly Rate</p>
                                <p className="benchmark-value">Rs. {summary?.avg_hourly_rate?.toLocaleString() || 0}</p>
                            </div>
                            <TrendingUp size={28} className="benchmark-icon" />
                        </div>
                        <div className={`benchmark-trend ${(summary?.avg_hourly_rate || 0) > (cityMedian || 0) ? 'positive' : 'negative'}`}>
                            {(summary?.avg_hourly_rate || 0) > (cityMedian || 0) ? '↑ Above' : '↓ Below'} city average
                        </div>
                    </div>
                    <div className="benchmark-item">
                        <div className="benchmark-header">
                            <div>
                                <p className="benchmark-label">City Median (Uber)</p>
                                <p className="benchmark-value">Rs. {cityMedian?.toLocaleString() || 0}</p>
                            </div>
                            <DollarSign size={28} className="benchmark-icon" />
                        </div>
                        <div className="benchmark-trend">
                            Based on verified data from Lahore workers
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AnalyticsCharts;