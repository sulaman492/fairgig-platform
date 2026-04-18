
import React, { useState, createContext, useContext, useEffect } from 'react';
import VerifierHome from './VerifierHome';
import ReviewQueue from './ReviewQueue';
import ReviewPanel from './ReviewPanel';
import VerifiedRecords from './VerifiedRecords';
import FlaggedCases from './FlaggedCases';
import Analytics from './Analytics';

type NavItem = 'dashboard' | 'pending' | 'verified' | 'flagged' | 'analytics' | 'settings';

interface DashboardContextType {
  currentView: NavItem;
  setCurrentView: (view: NavItem) => void;
  selectedSubmissionId: string | null;
  setSelectedSubmissionId: (id: string | null) => void;
  showNotification: (message: string, type: 'info' | 'warning' | 'success') => void;
  reviewComplete: () => void;
}

const DashboardContext = createContext<DashboardContextType | null>(null);

export const useDashboard = () => {
  const ctx = useContext(DashboardContext);
  if (!ctx) throw new Error('useDashboard must be used within DashboardProvider');
  return ctx;
};

// Mock submission data
const mockSubmissions = [
  { id: 'sub1', workerId: 'WKR-48291', workerName: 'Sarah Johnson', platform: 'Uber', date: '2024-03-15', earnings: 2840, status: 'pending', priority: 'normal', submittedGross: 2840, submittedDeduction: 420, extractedGross: 2840, extractedDeduction: 420, screenshotUrl: 'https://picsum.photos/id/104/800/600' },
  { id: 'sub2', workerId: 'WKR-73922', workerName: 'Michael Chen', platform: 'Fiverr', date: '2024-03-15', earnings: 1250, status: 'pending', priority: 'suspicious', submittedGross: 1250, submittedDeduction: 250, extractedGross: 1250, extractedDeduction: 375, screenshotUrl: 'https://picsum.photos/id/20/800/600' },
  { id: 'sub3', workerId: 'WKR-15673', workerName: 'Emma Davis', platform: 'DoorDash', date: '2024-03-14', earnings: 3420, status: 'pending', priority: 'normal', submittedGross: 3420, submittedDeduction: 680, extractedGross: 3420, extractedDeduction: 680, screenshotUrl: 'https://picsum.photos/id/26/800/600' },
  { id: 'sub4', workerId: 'WKR-90451', workerName: 'James Wilson', platform: 'Upwork', date: '2024-03-14', earnings: 5100, status: 'pending', priority: 'suspicious', submittedGross: 5100, submittedDeduction: 1020, extractedGross: 5100, extractedDeduction: 1530, screenshotUrl: 'https://picsum.photos/id/55/800/600' },
];

const VerifierDashboard: React.FC = () => {
  const [currentView, setCurrentView] = useState<NavItem>('pending');
  const [selectedSubmissionId, setSelectedSubmissionId] = useState<string | null>('sub1');
  const [submissions, setSubmissions] = useState(mockSubmissions);
  const [notifications, setNotifications] = useState<{ message: string; type: string; id: number }[]>([]);
  const [reviewedCount, setReviewedCount] = useState(0);

  const showNotification = (message: string, type: 'info' | 'warning' | 'success') => {
    const id = Date.now();
    setNotifications(prev => [...prev, { message, type, id }]);
    setTimeout(() => setNotifications(prev => prev.filter(n => n.id !== id)), 4000);
  };

  const reviewComplete = () => {
    setReviewedCount(prev => prev + 1);
    const pendingSubs = submissions.filter(s => s.status === 'pending');
    if (pendingSubs.length > 1) {
      const nextSub = pendingSubs[1];
      setSelectedSubmissionId(nextSub.id);
      showNotification('Review saved. Next submission loaded.', 'success');
    } else {
      showNotification('All pending reviews completed! 🎉', 'success');
    }
  };

  const handleDecision = (id: string, decision: 'approve' | 'flag' | 'unverifiable', comment?: string) => {
    setSubmissions(prev => prev.map(sub => 
      sub.id === id ? { ...sub, status: decision === 'approve' ? 'approved' : decision } : sub
    ));
    
    const actionMsg = decision === 'approve' ? 'Approved' : decision === 'flag' ? 'Flagged for review' : 'Marked unverifiable';
    showNotification(`${actionMsg} submission #${id}`, 'success');
    
    const remainingPending = submissions.filter(s => s.id !== id && s.status === 'pending').length;
    if (remainingPending > 0) {
      const nextPending = submissions.find(s => s.id !== id && s.status === 'pending');
      if (nextPending) setSelectedSubmissionId(nextPending.id);
    } else if (remainingPending === 0) {
      setCurrentView('dashboard');
    }
    reviewComplete();
  };

  const currentSubmission = submissions.find(s => s.id === selectedSubmissionId);

  return (
    <DashboardContext.Provider value={{ 
      currentView, setCurrentView, selectedSubmissionId, setSelectedSubmissionId, 
      showNotification, reviewComplete 
    }}>
      <div className="verifier-dashboard">
        <aside className="sidebar">
          <div className="logo">🛡️ VerifierPro</div>
          <nav>
            <div className={currentView === 'dashboard' ? 'nav-item active' : 'nav-item'} onClick={() => setCurrentView('dashboard')}>
              📊 Dashboard
            </div>
            <div className={currentView === 'pending' ? 'nav-item active' : 'nav-item'} onClick={() => setCurrentView('pending')}>
              ⭐ Pending Reviews <span className="badge">{submissions.filter(s => s.status === 'pending').length}</span>
            </div>
            <div className={currentView === 'verified' ? 'nav-item active' : 'nav-item'} onClick={() => setCurrentView('verified')}>
              ✅ Verified Records
            </div>
            <div className={currentView === 'flagged' ? 'nav-item active' : 'nav-item'} onClick={() => setCurrentView('flagged')}>
              🚨 Flagged Cases
            </div>
            <div className={currentView === 'analytics' ? 'nav-item active' : 'nav-item'} onClick={() => setCurrentView('analytics')}>
  📈 Analytics
</div>
            <div className="nav-item">⚙️ Settings</div>
          </nav>
          <div className="sidebar-footer">
            <div className="verifier-stats">⭐ {reviewedCount} reviewed today</div>
          </div>
        </aside>

        <main className="main-area">
          <header className="top-bar">
            <div className="search-section">
              <input type="text" placeholder="🔍 Search worker ID / platform..." className="search-input" />
              <select className="filter-select">
                <option>All Platforms</option>
                <option>Uber</option>
                <option>Fiverr</option>
                <option>DoorDash</option>
                <option>Upwork</option>
              </select>
              <select className="filter-select">
                <option>All Status</option>
                <option>Pending</option>
                <option>Approved</option>
                <option>Flagged</option>
              </select>
            </div>
            <div className="top-actions">
              <button className="icon-btn">🔔</button>
              <div className="profile">👤 Verifier</div>
            </div>
          </header>

          <div className="content-area">
            {currentView === 'dashboard' && <VerifierHome reviewedCount={reviewedCount} pendingCount={submissions.filter(s => s.status === 'pending').length} />}
            {currentView === 'analytics' && <Analytics />}
            {currentView === 'pending' && (
              <div className="split-view">
                <ReviewQueue 
                  submissions={submissions.filter(s => s.status === 'pending')}
                  selectedId={selectedSubmissionId}
                  onSelect={setSelectedSubmissionId}
                />
{currentSubmission && (
  <ReviewPanel 
    submission={currentSubmission}
    onDecision={handleDecision}
    showNotification={showNotification}  // ← Add this line
  />
)}

              </div>
            )}
            
            {currentView === 'verified' && <VerifiedRecords submissions={submissions.filter(s => s.status === 'approved')} />}
            {currentView === 'flagged' && <FlaggedCases submissions={submissions.filter(s => s.status === 'flag')} />}
          </div>
        </main>

        <div className="notification-container">
          {notifications.map(n => (
            <div key={n.id} className={`notification notification-${n.type}`}>
              {n.type === 'success' ? '✅ ' : n.type === 'warning' ? '⚠️ ' : 'ℹ️ '}{n.message}
            </div>
          ))}
        </div>
      </div>
    </DashboardContext.Provider>
  );
};

export default VerifierDashboard;