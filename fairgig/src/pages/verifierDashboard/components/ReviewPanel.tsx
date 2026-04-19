// src/pages/VerifierDashboard/components/ReviewPanel.tsx
import React, { useState } from 'react';
import { type Submission } from '../types';

interface ReviewPanelProps {
    submission: Submission;
    onDecision: (id: string, decision: 'approve' | 'reject', comment?: string) => void;
    showNotification: (message: string, type: 'info' | 'warning' | 'success') => void;
}

const ReviewPanel: React.FC<ReviewPanelProps> = ({ submission, onDecision, showNotification }) => {
    const [comment, setComment] = useState('');
    
    // Check if this is a pending submission (show action buttons) or verified/flagged (read-only)
    const isPending = submission.status === 'pending';

    return (
        <div className="review-panel">
            <h3>Review Submission</h3>
            <div className="submission-details">
                <div className="detail-row">
                    <span>Status:</span>
                    <strong className={submission.status === 'confirmed' ? 'text-green' : submission.status === 'discrepancy' ? 'text-red' : 'text-yellow'}>
                        {submission.status.toUpperCase()}
                    </strong>
                </div>
                <div className="detail-row">
                    <span>Worker:</span>
                    <strong>{submission.workerName}</strong>
                </div>
                <div className="detail-row">
                    <span>Platform:</span>
                    <strong>{submission.platform}</strong>
                </div>
                <div className="detail-row">
                    <span>Date:</span>
                    <strong>{submission.date}</strong>
                </div>
                <div className="detail-row comparison">
                    <span>Gross Earnings:</span>
                    <strong>Rs. {submission.submittedGross}</strong>
                </div>
                <div className="detail-row comparison">
                    <span>Platform Deductions:</span>
                    <strong>Rs. {submission.submittedDeduction}</strong>
                </div>
                <div className="detail-row comparison">
                    <span>Net Received:</span>
                    <strong>Rs. {submission.earnings}</strong>
                </div>

                {submission.screenshotUrl && submission.screenshotUrl.startsWith('data:image') && (
                    <div className="screenshot">
                        <label>Screenshot:</label>
                        <img 
                            src={submission.screenshotUrl} 
                            alt="Earnings Screenshot" 
                            style={{ maxWidth: '100%', maxHeight: '250px', borderRadius: '8px', marginTop: '8px' }}
                        />
                    </div>
                )}
            </div>
            
            {isPending && (
                <>
                    <textarea 
                        placeholder="Add verification comment..."
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        rows={3}
                        style={{ width: '100%', padding: '12px', background: '#121821', border: '1px solid #1E293B', borderRadius: '8px', color: 'white' }}
                    />
                    <div className="action-buttons" style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                        <button 
                            className="btn-approve" 
                            onClick={() => onDecision(submission.id, 'approve', comment)}
                            style={{ flex: 1, padding: '12px', background: '#22C55E', border: 'none', borderRadius: '8px', color: 'white', cursor: 'pointer', fontWeight: 'bold' }}
                        >
                            ✅ Approve
                        </button>
                        <button 
                            className="btn-reject" 
                            onClick={() => onDecision(submission.id, 'reject', comment)}
                            style={{ flex: 1, padding: '12px', background: '#EF4444', border: 'none', borderRadius: '8px', color: 'white', cursor: 'pointer', fontWeight: 'bold' }}
                        >
                            ❌ Reject
                        </button>
                    </div>
                </>
            )}

            {!isPending && (
                <div className="info-message" style={{ marginTop: '16px', padding: '12px', background: '#1E293B', borderRadius: '8px', textAlign: 'center' }}>
                    This submission has already been {submission.status}.
                </div>
            )}
        </div>
    );
};

export default ReviewPanel;