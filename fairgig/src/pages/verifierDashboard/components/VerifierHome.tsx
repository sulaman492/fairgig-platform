// src/pages/VerifierDashboard/components/VerifierHome.tsx
import React from 'react';

interface VerifierHomeProps {
    reviewedCount: number;
    pendingCount: number;
}

const VerifierHome: React.FC<VerifierHomeProps> = ({ reviewedCount, pendingCount }) => {
    return (
        <div className="verifier-home">
            <h2>Verifier Dashboard</h2>
            <div className="stats-grid">
                <div className="stat-card">
                    <h3>{pendingCount}</h3>
                    <p>Pending Reviews</p>
                </div>
                <div className="stat-card">
                    <h3>{reviewedCount}</h3>
                    <p>Reviewed Today</p>
                </div>
            </div>
        </div>
    );
};

export default VerifierHome;