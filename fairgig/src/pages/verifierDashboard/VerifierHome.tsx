// components/VerifierHome.tsx
import React from 'react';

interface VerifierHomeProps {
  reviewedCount: number;
  pendingCount: number;
}

const VerifierHome: React.FC<VerifierHomeProps> = ({ reviewedCount, pendingCount }) => {
  const avgReviewTime = 8.2;
  const flagRate = 12.5;
  const fasterPercentile = 73;

  return (
    <div className="verifier-home">
      <h1 className="page-title">Verifier Dashboard</h1>
      
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">📋</div>
          <div className="stat-value">{reviewedCount}</div>
          <div className="stat-label">Reviewed Today</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">⏳</div>
          <div className="stat-value">{pendingCount}</div>
          <div className="stat-label">Pending Queue</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🚨</div>
          <div className="stat-value">{flagRate}%</div>
          <div className="stat-label">Flag Rate</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">⚡</div>
          <div className="stat-value">{avgReviewTime}s</div>
          <div className="stat-label">Avg Review Time</div>
        </div>
      </div>

      <div className="productivity-meter">
        <div className="meter-header">
          <span>🏆 Productivity Meter</span>
          <span>You are faster than {fasterPercentile}% of verifiers</span>
        </div>
        <div className="meter-bar-bg">
          <div className="meter-bar-fill" style={{ width: `${fasterPercentile}%` }}></div>
        </div>
      </div>

      <div className="graph-section">
        <h3>Reviews Over Time (Last 7 Days)</h3>
        <div className="bar-chart">
          {[12, 18, 15, 22, 27, 24, reviewedCount || 19].map((val, i) => (
            <div key={i} className="chart-bar-container">
              <div className="chart-bar" style={{ height: `${Math.min(val * 3, 120)}px` }}>
                <span className="chart-value">{val}</span>
              </div>
              <span className="chart-label">Day {i+1}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="insight-card">
        <div className="insight-icon">🧠</div>
        <div className="insight-content">
          <h4>AI Insight</h4>
          <p>High mismatch pattern detected in Fiverr submissions. Review flagged items first for efficiency.</p>
          <button className="insight-btn">View Details →</button>
        </div>
      </div>

      <div className="quick-actions">
        <button className="primary-btn" onClick={() => {
          const event = new CustomEvent('navigate', { detail: 'pending' });
          window.dispatchEvent(event);
        }}>Start Reviewing →</button>
        <button className="secondary-btn">View Analytics</button>
      </div>
    </div>
  );
};

export default VerifierHome;