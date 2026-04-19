// src/pages/VerifierDashboard/components/VerifiedRecords.tsx
import React from 'react';
import { type Submission } from '../types';

interface VerifiedRecordsProps {
    submissions: Submission[];
}

const VerifiedRecords: React.FC<VerifiedRecordsProps> = ({ submissions }) => {
    return (
        <div className="verified-records">
            <h3>Verified Records ({submissions.length})</h3>
            <div className="records-list">
                {submissions.map(sub => (
                    <div key={sub.id} className="record-item">
                        <span className="icon">✅</span>
                        <span className="name">{sub.workerName}</span>
                        <span className="platform">{sub.platform}</span>
                        <span className="date">{sub.date}</span>
                        <span className="earnings">${sub.earnings}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default VerifiedRecords;