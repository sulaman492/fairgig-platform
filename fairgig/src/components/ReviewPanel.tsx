// components/ReviewPanel.tsx
import React, { useState, useEffect } from 'react';

interface Submission {
  id: string;
  workerId: string;
  workerName: string;
  platform: string;
  date: string;
  earnings: number;
  status: string;
  priority: string;
  submittedGross: number;
  submittedDeduction: number;
  extractedGross: number;
  extractedDeduction: number;
  screenshotUrl: string;
}

interface ReviewPanelProps {
  submission: Submission;
  onDecision: (id: string, decision: 'approve' | 'flag' | 'unverifiable', comment?: string) => void;
  showNotification: (message: string, type: 'info' | 'warning' | 'success') => void;
}

const ReviewPanel: React.FC<ReviewPanelProps> = ({ submission, onDecision, showNotification }) => {
  const [zoom, setZoom] = useState(1);
  const [fullscreen, setFullscreen] = useState(false);
  const [comment, setComment] = useState('');
  const [showAIPanel, setShowAIPanel] = useState(true);

  const grossMismatch = submission.submittedGross !== submission.extractedGross;
  const deductionMismatch = submission.submittedDeduction !== submission.extractedDeduction;
  const confidenceScore = deductionMismatch ? 67 : 94;

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'a' || e.key === 'A') {
        handleApprove();
        showNotification('Shortcut: A → Approve', 'info');
      } else if (e.key === 'f' || e.key === 'F') {
        handleFlag();
        showNotification('Shortcut: F → Flag', 'info');
      } else if (e.key === 'u' || e.key === 'U') {
        handleUnverifiable();
        showNotification('Shortcut: U → Unverifiable', 'info');
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [comment]);

  const handleApprove = () => {
    if (deductionMismatch && !window.confirm('Warning: Deduction mismatch detected. Approve anyway?')) return;
    onDecision(submission.id, 'approve');
    setComment('');
  };

  const handleFlag = () => {
    if (!comment.trim()) {
      alert('Comment required for flagging');
      return;
    }
    onDecision(submission.id, 'flag', comment);
    setComment('');
  };

  const handleUnverifiable = () => {
    if (!comment.trim()) {
      alert('Comment required for unverifiable submissions');
      return;
    }
    onDecision(submission.id, 'unverifiable', comment);
    setComment('');
  };

  return (
    <div className={`review-panel ${fullscreen ? 'fullscreen' : ''}`}>
      <div className="screenshot-viewer">
        <div className="viewer-header">
          <span>📸 Screenshot Evidence</span>
          <div className="zoom-controls">
            <button onClick={() => setZoom(Math.max(0.5, zoom - 0.25))}>−</button>
            <span>{Math.round(zoom * 100)}%</span>
            <button onClick={() => setZoom(Math.min(2, zoom + 0.25))}>+</button>
            <button onClick={() => setFullscreen(!fullscreen)}>⛶</button>
            <button className="enhance-btn">✨ Enhance</button>
          </div>
        </div>
        <div className="screenshot-container">
          <img 
            src={submission.screenshotUrl} 
            alt="Earning screenshot" 
            style={{ transform: `scale(${zoom})`, cursor: zoom > 1 ? 'grab' : 'default' }}
            className="screenshot-img"
          />
        </div>
      </div>

      <div className="data-comparison">
        <h4>📊 Submitted vs Extracted Data</h4>
        <table className="comparison-table">
          <thead>
            <tr>
              <th>Field</th>
              <th>Submitted</th>
              <th>From Screenshot</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr className={grossMismatch ? 'mismatch' : ''}>
              <td>Gross Earnings</td>
              <td>${submission.submittedGross}</td>
              <td>${submission.extractedGross}</td>
              <td>{grossMismatch ? '⚠️ Mismatch' : '✓ Match'}</td>
            </tr>
            <tr className={deductionMismatch ? 'mismatch' : ''}>
              <td>Deductions</td>
              <td>${submission.submittedDeduction}</td>
              <td>${submission.extractedDeduction}</td>
              <td>{deductionMismatch ? '⚠️ Mismatch' : '✓ Match'}</td>
            </tr>
            <tr>
              <td>Net Payout</td>
              <td>${submission.submittedGross - submission.submittedDeduction}</td>
              <td>${submission.extractedGross - submission.extractedDeduction}</td>
              <td></td>
            </tr>
          </tbody>
        </table>
      </div>

      {showAIPanel && (
        <div className="ai-assistance">
          <div className="ai-header">
            <span>🧠 AI Assistance</span>
            <button onClick={() => setShowAIPanel(false)}>✕</button>
          </div>
          {deductionMismatch && <div className="ai-alert">⚠️ Possible mismatch in deductions - extracted value differs by ${Math.abs(submission.submittedDeduction - submission.extractedDeduction)}</div>}
          {!deductionMismatch && <div className="ai-ok">✓ All fields match within threshold</div>}
          <div className="confidence">🔒 Confidence Score: {confidenceScore}%</div>
          <button className="ai-explain">View Explanation →</button>
        </div>
      )}

      <div className="decision-panel">
        <h4>⚖️ Decision</h4>
        <div className="decision-buttons">
          <button className="decision-approve" onClick={handleApprove}>✅ Approve (A)</button>
          <button className="decision-flag" onClick={handleFlag}>⚠️ Flag (F)</button>
          <button className="decision-unverifiable" onClick={handleUnverifiable}>❌ Unverifiable (U)</button>
        </div>
        <textarea 
          className="comment-input" 
          placeholder="Required for Flag/Unverifiable..."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />
        <div className="shortcut-hint">⌨️ Keyboard: A=Approve | F=Flag | U=Unverifiable</div>
      </div>
    </div>
  );
};

export default ReviewPanel;