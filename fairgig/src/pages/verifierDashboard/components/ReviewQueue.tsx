// src/pages/VerifierDashboard/components/ReviewQueue.tsx
import React from 'react';
import { type Submission } from '../types';

interface ReviewQueueProps {
    submissions: Submission[];
    selectedId: string | null;
    onSelect: (id: string) => void;
}

const ReviewQueue: React.FC<ReviewQueueProps> = ({ submissions, selectedId, onSelect }) => {
    return (
        <div className="review-queue">
            <h3>Review Queue ({submissions.length})</h3>
            <div className="queue-list" style={{ maxHeight: '500px', overflowY: 'auto' }}>
                {submissions.map(sub => (
                    <div 
                        key={sub.id} 
                        className={`queue-item ${selectedId === sub.id ? 'active' : ''}`}
                        onClick={() => onSelect(sub.id)}
                    >
                        <div className="worker-name">{sub.workerName}</div>
                        <div className="platform">{sub.platform}</div>
                        <div className="date">{sub.date}</div>
                        <div className={`priority ${sub.priority}`}>{sub.priority}</div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ReviewQueue;