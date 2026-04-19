// src/pages/AdvocateDashboard/AdvocateDashboard.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAdvocateData } from './hooks/useAdvocateData';
import AdvocateSidebar from './AdvocateSidebar';
import SummaryCards from './components/SummaryCards';
import CommissionTrends from './components/CommissionTrends';
import IncomeDistribution from './components/IncomeDistribution';
import VulnerableWorkers from './components/VulnerableWorkers';
import TopComplaints from './components/TopComplaints';
import ComplaintsManager from './components/ComplaintsManager';
import { type NavItem } from './types';  // ← ADD 'type' keyword
import './AdvocateDashboard.css';

const API_GATEWAY_URL = 'http://localhost:5000';

const AdvocateDashboard: React.FC = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState<any>(null);
    const [currentView, setCurrentView] = useState<NavItem>('dashboard');
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

    const {
        commissionTrends,
        incomeDistribution,
        vulnerableWorkers,
        topComplaints,
        complaints,
        loading,
        error,
        notifications,
        updateComplaintStatus,
        showNotification
    } = useAdvocateData();

    useEffect(() => {
        const storedUser = localStorage.getItem('user') || sessionStorage.getItem('user');
        if (!storedUser) {
            navigate('/login');
            return;
        }
        const userData = JSON.parse(storedUser);
        if (userData.role !== 'advocate') {
            navigate('/login');
            return;
        }
        setUser(userData);
    }, []);

    const handleLogout = async () => {
        await axios.post(`${API_GATEWAY_URL}/api/auth/logout`, {}, { withCredentials: true });
        localStorage.removeItem('user');
        sessionStorage.removeItem('user');
        navigate('/login');
    };

    if (loading) {
        return <div className="loading">Loading advocate dashboard...</div>;
    }

    if (error) {
        return <div className="error">{error}</div>;
    }

    const totalComplaints = complaints.length;
    const avgCommission = commissionTrends.reduce((sum, t) => sum + t.avg_commission, 0) / (commissionTrends.length || 1);
    const vulnerableCount = vulnerableWorkers.length;
    const resolvedCount = complaints.filter(c => c.status === 'resolved').length;

    return (
        <div className="advocate-container">
            <AdvocateSidebar
                collapsed={sidebarCollapsed}
                onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
                onLogout={handleLogout}
                userName={user?.name || ''}
                currentView={currentView}
                onViewChange={setCurrentView}
            />

            <main className={`advocate-main ${sidebarCollapsed ? 'expanded' : ''}`}>
                <header className="advocate-header">
                    <h1 className="page-title">Advocate Dashboard</h1>
                    <p className="page-subtitle">Welcome back, {user?.name}</p>
                </header>

                <div className="advocate-content">
                    {currentView === 'dashboard' && (
                        <>
                            <SummaryCards 
                                totalComplaints={totalComplaints}
                                avgCommission={Math.round(avgCommission * 10) / 10}
                                vulnerableCount={vulnerableCount}
                                resolvedCount={resolvedCount}
                            />
                            <div className="dashboard-grid">
                                <CommissionTrends data={commissionTrends} />
                                <IncomeDistribution data={incomeDistribution} />
                                <VulnerableWorkers data={vulnerableWorkers} />
                                <TopComplaints data={topComplaints} />
                            </div>
                        </>
                    )}

                    {currentView === 'complaints' && (
                        <ComplaintsManager 
                            complaints={complaints}
                            onUpdateStatus={updateComplaintStatus}
                            showNotification={showNotification}
                        />
                    )}

                    {currentView === 'analytics' && (
                        <div className="analytics-full">
                            <div className="two-column">
                                <CommissionTrends data={commissionTrends} />
                                <IncomeDistribution data={incomeDistribution} />
                            </div>
                            <div className="two-column">
                                <VulnerableWorkers data={vulnerableWorkers} />
                                <TopComplaints data={topComplaints} />
                            </div>
                        </div>
                    )}

                    {currentView === 'workers' && (
                        <div className="workers-full">
                            <h2>All Vulnerable Workers</h2>
                            <div className="workers-table">
                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            <th>Name</th>
                                            <th>Email</th>
                                            <th>City</th>
                                            <th>Income Drop</th>
                                            <th>Current Weekly Avg</th>
                                            <th>Previous Weekly Avg</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {vulnerableWorkers.map(worker => (
                                            <tr key={worker.user_id}>
                                                <td>{worker.name}</td>
                                                <td>{worker.email}</td>
                                                <td>{worker.city}</td>
                                                <td className="negative">{worker.income_drop}%</td>
                                                <td>Rs. {worker.current_weekly_avg}</td>
                                                <td>Rs. {worker.previous_weekly_avg}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            </main>

            <div className="notification-container">
                {notifications.map(n => (
                    <div key={n.id} className={`notification notification-${n.type}`}>
                        {n.type === 'success' ? '✅ ' : n.type === 'warning' ? '⚠️ ' : 'ℹ️ '}
                        {n.message}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default AdvocateDashboard;