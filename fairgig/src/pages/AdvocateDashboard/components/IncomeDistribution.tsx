// src/pages/AdvocateDashboard/components/IncomeDistribution.tsx
import React from 'react';
import { type IncomeDistribution as IncomeDistributionType } from '../types';  // ← Rename type import

interface IncomeDistributionProps {
    data: IncomeDistributionType[];  // ← Use renamed type
}

// ✅ This is a COMPONENT (value), not a type
const IncomeDistribution: React.FC<IncomeDistributionProps> = ({ data }) => {
    if (!data || data.length === 0) {
        return (
            <div className="card income-card">
                <h3>Income by City</h3>
                <p className="no-data">No income data available</p>
            </div>
        );
    }

    return (
        <div className="card income-card">
            <h3>Income by City</h3>
            <div className="income-list">
                {data.map((item, idx) => (
                    <div key={idx} className="income-item">
                        <div className="city-info">
                            <span className="city">{item.city}</span>
                            <span className="worker-count">{item.worker_count} workers</span>
                        </div>
                        <div className="earnings-info">
                            <span className="hourly-rate">Rs. {item.avg_hourly_rate}/hr</span>
                            <div className="progress-bar">
                                <div 
                                    className="progress-fill" 
                                    style={{ width: `${Math.min((item.avg_hourly_rate / 1000) * 100, 100)}%` }}
                                />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default IncomeDistribution;  // ← This exports a COMPONENT