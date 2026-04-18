// components/FlaggedCases.tsx
import React, { useState } from 'react';
import { useDashboard } from './VerifierDashboard';

interface Submission {
  id: string;
  workerId: string;
  workerName: string;
  platform: string;
  date: string;
  earnings: number;
  status: string;
}

interface FlaggedCasesProps {
  submissions: Submission[];
}

const FlaggedCases: React.FC<FlaggedCasesProps> = ({ submissions }) => {
  const { showNotification } = useDashboard();
  const [selectedCase, setSelectedCase] = useState<string | null>(null);

  const groupByIssue = {
    'Deduction Mismatch': submissions.filter(s => s.id === 'sub2' || s.id === 'sub4'),
    'Blurry Screenshot': [],
    'Unusual Pattern': submissions.filter(s => s.id === 'sub4'),
  };

  const repeatOffenders = ['WKR-73922 (Michael Chen) - 2 flags', 'WKR-90451 (James Wilson) - 2 flags'];

  return (
    <div className="flagged-cases">
      <h2>🚨 Flagged Cases</h2>
      <div className="flagged-grid">
        <div className="flagged-group">
          <h3>Group by Issue Type</h3>
          {Object.entries(groupByIssue).map(([issue, cases]) => (
            <div key={issue} className="issue-group">
              <div className="issue-title">{issue} <span className="count">{cases.length}</span></div>
              {cases.map(c => <div key={c.id} className="flagged-item">⚠️ {c.workerName} - ${c.earnings} ({c.platform})</div>)}
            </div>
          ))}
        </div>
        <div className="flagged-group">
          <h3>Repeated Offenders</h3>
          {repeatOffenders.map((off, i) => <div key={i} className="offender-item">🔁 {off}</div>)}
        </div>
        <div className="flagged-actions">
          <button className="escalate-btn" onClick={() => showNotification('Case escalated to Advocate team', 'warning')}>⬆️ Escalate to Advocate</button>
          <button className="info-btn" onClick={() => showNotification('Request sent for more information', 'info')}>📩 Request More Info</button>
        </div>
      </div>
    </div>
  );
};

export default FlaggedCases;