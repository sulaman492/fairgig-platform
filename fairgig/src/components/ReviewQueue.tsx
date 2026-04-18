// components/ReviewQueue.tsx
import React from 'react';

interface Submission {
  id: string;
  workerId: string;
  workerName: string;
  platform: string;
  date: string;
  earnings: number;
  status: string;
  priority: string;
}

interface ReviewQueueProps {
  submissions: Submission[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

const ReviewQueue: React.FC<ReviewQueueProps> = ({ submissions, selectedId, onSelect }) => {
  const [sortBy, setSortBy] = React.useState<'newest' | 'highEarnings' | 'flagged'>('newest');

  const sortedSubmissions = [...submissions].sort((a, b) => {
    if (sortBy === 'newest') return new Date(b.date).getTime() - new Date(a.date).getTime();
    if (sortBy === 'highEarnings') return b.earnings - a.earnings;
    if (sortBy === 'flagged') return (a.priority === 'suspicious' ? 1 : 0) - (b.priority === 'suspicious' ? 1 : 0);
    return 0;
  });

  return (
    <div className="review-queue">
      <div className="queue-header">
        <h3>Review Queue <span className="queue-count">{submissions.length}</span></h3>
        <div className="sort-buttons">
          <button className={`sort-btn ${sortBy === 'newest' ? 'active' : ''}`} onClick={() => setSortBy('newest')}>Newest</button>
          <button className={`sort-btn ${sortBy === 'highEarnings' ? 'active' : ''}`} onClick={() => setSortBy('highEarnings')}>High Earnings</button>
          <button className={`sort-btn ${sortBy === 'flagged' ? 'active' : ''}`} onClick={() => setSortBy('flagged')}>Flagged First</button>
        </div>
      </div>
      
      <div className="queue-list">
        {sortedSubmissions.map(sub => (
          <div 
            key={sub.id} 
            className={`queue-card ${selectedId === sub.id ? 'selected' : ''} ${sub.priority === 'suspicious' ? 'suspicious' : ''}`}
            onClick={() => onSelect(sub.id)}
          >
            <div className="card-header">
              <span className="worker-name">{sub.workerName}</span>
              {sub.priority === 'suspicious' && <span className="priority-badge">⚠️ Suspicious</span>}
            </div>
            <div className="card-details">
              <span className="platform">{sub.platform}</span>
              <span className="date">{sub.date}</span>
            </div>
            <div className="card-earnings">💰 ${sub.earnings.toLocaleString()}</div>
            <div className="card-actions">
              <button className="card-btn start">Start Review</button>
              <button className="card-btn skip">Skip</button>
              <button className="card-btn later">Later</button>
            </div>
          </div>
        ))}
        {submissions.length === 0 && <div className="empty-queue">✨ All caught up! No pending reviews.</div>}
      </div>
    </div>
  );
};

export default ReviewQueue;