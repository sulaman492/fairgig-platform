// src/pages/AdvocateDashboard/components/VulnerableWorkers.tsx
import React from 'react';
import { AlertTriangle, TrendingDown } from 'lucide-react';
import { type VulnerableWorker } from '../types';

interface VulnerableWorkersProps {
    data: VulnerableWorker[];
}

const VulnerableWorkers: React.FC<VulnerableWorkersProps> = ({ data }) => {
    return (
        <div className="card vulnerable-card">
            <h3>⚠️ Vulnerable Workers</h3>
            <div className="workers-list">
                {data.map((worker, idx) => (
                    <div key={idx} className="worker-item">
                        <div className="worker-info">
                            <span className="name">{worker.name}</span>
                            <span className="city">{worker.city}</span>
                        </div>
                        <div className="drop-info">
                            <span className="drop negative">
                                <TrendingDown size={14} />
                                {worker.income_drop}% drop
                            </span>
                            <span className="earnings">
                                Rs. {worker.current_weekly_avg}/wk
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default VulnerableWorkers;