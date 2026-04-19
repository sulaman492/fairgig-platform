// src/pages/VerifierDashboard/VerifierDashboard.tsx
import React, { useState, useEffect } from 'react';
import { useVerifierData } from './hooks/useVerifierData';
import { VerifierProvider } from './context/VerifierContext';
import VerifierHome from './components/VerifierHome';
import ReviewQueue from './components/ReviewQueue';
import ReviewPanel from './components/ReviewPanel';
import VerifiedRecords from './components/VerifiedRecords';
import FlaggedCases from './components/FlaggedCases';
import Analytics from './components/Analytics';
import { type NavItem } from './types/index';
import './VerifierDashboard.css';

const VerifierDashboard: React.FC = () => {
    const [currentView, setCurrentView] = useState<NavItem>('pending');
    const [selectedSubmissionId, setSelectedSubmissionId] = useState<string | null>(null);
    
    const {
        pendingSubmissions,
        verifiedSubmissions,
        flaggedSubmissions,
        loading,
        error,
        reviewedCount,
        notifications,
        handleDecision,
        showNotification,
        reviewComplete,
        setActiveView,
        activeView,
        pendingCount,
        verifiedCount,
        flaggedCount
    } = useVerifierData();

    // Update activeView when tab changes
    useEffect(() => {
        if (currentView === 'pending') setActiveView('pending');
        if (currentView === 'verified') setActiveView('verified');
        if (currentView === 'flagged') setActiveView('flagged');
        setSelectedSubmissionId(null);
    }, [currentView, setActiveView]);

    // Get current submissions based on view
    const getCurrentSubmissions = () => {
        if (currentView === 'pending') return pendingSubmissions;
        if (currentView === 'verified') return verifiedSubmissions;
        if (currentView === 'flagged') return flaggedSubmissions;
        return [];
    };

    const currentSubmissions = getCurrentSubmissions();
    const currentSubmission = currentSubmissions.find(s => s.id === selectedSubmissionId);

    // Set first submission as selected when data loads
    useEffect(() => {
        if (currentSubmissions.length > 0 && !selectedSubmissionId) {
            setSelectedSubmissionId(currentSubmissions[0].id);
        }
    }, [currentSubmissions, selectedSubmissionId]);

    const contextValue = {
        currentView, setCurrentView, selectedSubmissionId, setSelectedSubmissionId,
        showNotification, reviewComplete
    };

    if (loading) {
        return <div className="loading">Loading verifications...</div>;
    }

    if (error) {
        return <div className="error">{error}</div>;
    }

    return (
        <VerifierProvider value={contextValue}>
            <div className="verifier-dashboard">
                <aside className="sidebar">
                    <div className="logo">🛡️ VerifierPro</div>
                    <nav>
                        <div className={currentView === 'dashboard' ? 'nav-item active' : 'nav-item'} onClick={() => setCurrentView('dashboard')}>
                            📊 Dashboard
                        </div>
                        <div className={currentView === 'pending' ? 'nav-item active' : 'nav-item'} onClick={() => setCurrentView('pending')}>
                            ⭐ Pending Reviews <span className="badge">{pendingCount}</span>
                        </div>
                        <div className={currentView === 'verified' ? 'nav-item active' : 'nav-item'} onClick={() => setCurrentView('verified')}>
                            ✅ Verified Records <span className="badge">{verifiedCount}</span>
                        </div>
                        <div className={currentView === 'flagged' ? 'nav-item active' : 'nav-item'} onClick={() => setCurrentView('flagged')}>
                            🚨 Flagged Cases <span className="badge">{flaggedCount}</span>
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
                        </div>
                        <div className="top-actions">
                            <button className="icon-btn">🔔</button>
                            <div className="profile">👤 Verifier</div>
                        </div>
                    </header>

                    <div className="content-area">
                        {currentView === 'dashboard' && (
                            <VerifierHome reviewedCount={reviewedCount} pendingCount={pendingCount} />
                        )}
                        {currentView === 'analytics' && <Analytics />}
                        {(currentView === 'pending' || currentView === 'verified' || currentView === 'flagged') && (
                            <div className="split-view">
                                <ReviewQueue 
                                    submissions={currentSubmissions} 
                                    selectedId={selectedSubmissionId} 
                                    onSelect={setSelectedSubmissionId} 
                                />
                                {currentSubmission && (
                                    <ReviewPanel 
                                        submission={currentSubmission} 
                                        onDecision={handleDecision} 
                                        showNotification={showNotification} 
                                    />
                                )}
                            </div>
                        )}
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
        </VerifierProvider>
    );
};

export default VerifierDashboard;