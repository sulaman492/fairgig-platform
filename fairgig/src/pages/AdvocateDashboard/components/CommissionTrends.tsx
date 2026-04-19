// src/pages/AdvocateDashboard/components/CommissionTrends.tsx
import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { type CommissionTrend } from '../types';

interface CommissionTrendsProps {
    data: CommissionTrend[];
}

const CommissionTrends: React.FC<CommissionTrendsProps> = ({ data }) => {
    const getTrendIcon = (trend: string) => {
        if (trend === 'up') return <TrendingUp size={16} className="trend-up" />;
        if (trend === 'down') return <TrendingDown size={16} className="trend-down" />;
        return <Minus size={16} className="trend-stable" />;
    };

    return (
        <div className="card commission-card">
            <h3>Commission Trends</h3>
            <div className="trends-list">
                {data.map((item, idx) => (
                    <div key={idx} className="trend-item">
                        <span className="platform">{item.platform}</span>
                        <span className="rate">{item.avg_commission}%</span>
                        <span className={`change ${item.trend}`}>
                            {getTrendIcon(item.trend)}
                            {item.change}%
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default CommissionTrends;