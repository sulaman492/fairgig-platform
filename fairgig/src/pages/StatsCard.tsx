// src/components/worker/StatsCards.tsx
import React from 'react';
import { Wallet, Clock, TrendingUp, BarChart3 } from 'lucide-react';

interface StatsCardsProps {
  totalNet: number;
  totalHours: number;
  avgHourlyRate: number;
  cityMedian: number | null;
}

const StatsCards: React.FC<StatsCardsProps> = ({ totalNet, totalHours, avgHourlyRate, cityMedian }) => {
  const stats = [
    { title: 'Total Earnings (Week)', value: `Rs. ${totalNet?.toLocaleString() || 0}`, icon: Wallet },
    { title: 'Total Hours', value: `${totalHours || 0} hrs`, icon: Clock },
    { title: 'Avg Hourly Rate', value: `Rs. ${avgHourlyRate || 0}`, icon: TrendingUp },
    { title: 'City Median', value: `Rs. ${cityMedian || 0}`, icon: BarChart3 },
  ];

  return (
    <div className="stats-grid">
      {stats.map((stat, idx) => (
        <div key={idx} className="card stat-card">
          <div className="stat-card-content">
            <div><p className="stat-card-title">{stat.title}</p><h3 className="stat-card-value">{stat.value}</h3></div>
            <div className="stat-card-icon"><stat.icon size={22} /></div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default StatsCards;