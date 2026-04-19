// src/pages/VerifierDashboard/components/Analytics.tsx
import React from 'react';

const Analytics: React.FC = () => {
    return (
        <div className="analytics">
            <h3>Verifier Analytics</h3>
            <div className="analytics-stats">
                <div className="stat">
                    <h4>Accuracy Rate</h4>
                    <p>98.5%</p>
                </div>
                <div className="stat">
                    <h4>Avg Review Time</h4>
                    <p>2.3 min</p>
                </div>
                <div className="stat">
                    <h4>Total Verified</h4>
                    <p>1,247</p>
                </div>
            </div>
        </div>
    );
};

export default Analytics;