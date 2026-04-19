// src/pages/AdvocateDashboard/components/TopComplaints.tsx
import React from 'react';
import { AlertCircle } from 'lucide-react';
import { type TopComplaint } from '../types';

interface TopComplaintsProps {
    data: TopComplaint[];
}

const TopComplaints: React.FC<TopComplaintsProps> = ({ data }) => {
    return (
        <div className="card complaints-card">
            <h3>Top Complaints This Week</h3>
            <div className="complaints-list">
                {data.map((item, idx) => (
                    <div key={idx} className="complaint-item">
                        <div className="complaint-header">
                            <AlertCircle size={16} className="complaint-icon" />
                            <span className="category">{item.category}</span>
                            <span className="count">{item.count} reports</span>
                        </div>
                        <div className="progress-bar">
                            <div 
                                className="progress-fill" 
                                style={{ width: `${item.percentage}%` }}
                            />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default TopComplaints;