// src/pages/VerifierDashboard/components/FlaggedCases.tsx
import React from 'react';
import { type Submission } from '../types';

interface FlaggedCasesProps {
    submissions: Submission[];
}

const FlaggedCases: React.FC<FlaggedCasesProps> = ({ submissions }) => {
    return (
        <div className="flagged-cases">
            <h3>Flagged Cases ({submissions.length})</h3>
            <div className="cases-list">
                {submissions.map(sub => (
                    <div key={sub.id} className="case-item">
                        <span className="icon">⚠️</span>
                        <span className="name">{sub.workerName}</span>
                        <span className="platform">{sub.platform}</span>
                        <span className="reason">Discrepancy in earnings</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default FlaggedCases;