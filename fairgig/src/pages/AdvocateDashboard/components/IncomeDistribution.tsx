// src/pages/AdvocateDashboard/components/IncomeDistribution.tsx
import React from 'react';
import { type IncomeDistribution } from '../types';

interface IncomeDistributionProps {
    data: IncomeDistribution[];
}

const IncomeDistribution: React.FC<IncomeDistributionProps> = ({ data }) => {
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
                                    style={{ width: `${(item.avg_hourly_rate / 1000) * 100}%` }}
                                />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default IncomeDistribution;