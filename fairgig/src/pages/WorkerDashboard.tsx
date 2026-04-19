// src/components/worker/WorkerDashboard.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Sidebar from './Sidebar';
import StatsCards from './StatsCard';
import RecentShifts from './RecentShifts';
import ShiftFormDrawer from './ShiftFromDrawer';

import EarningsTable from './EarningTable';
import AnalyticsCharts from './AnalyticsCharts';
// import IncomeCertificate from './IncomeCertificate';
import { type Shift, type Summary, type PlatformBreakdown, type User } from './type';
import './WorkerDashboard.css';
import GrievanceBoard from './GrievanceBoard';

const API_GATEWAY_URL = 'http://localhost:5000';

const WorkerDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [platformBreakdown, setPlatformBreakdown] = useState<PlatformBreakdown[]>([]);
  const [cityMedian, setCityMedian] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem('user') || sessionStorage.getItem('user');
    if (!storedUser) { navigate('/login'); return; }
    const userData = JSON.parse(storedUser);
    if (userData.role !== 'worker') { navigate('/login'); return; }
    setUser(userData);
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [shiftsRes, summaryRes, medianRes] = await Promise.all([
        axios.get(`${API_GATEWAY_URL}/api/shifts/my`, { withCredentials: true }),
        axios.get(`${API_GATEWAY_URL}/api/shifts/summary?period=week`, { withCredentials: true }),
        axios.get(`${API_GATEWAY_URL}/api/analytics/city-median?city=Lahore&platform=Uber`, { withCredentials: true })
      ]);
      setShifts(shiftsRes.data.shifts || []);
      setSummary(summaryRes.data.summary);
      setPlatformBreakdown(summaryRes.data.platform_breakdown || []);
      setCityMedian(medianRes.data.median_hourly_rate);
    } catch (error) { console.error(error); }
    finally { setLoading(false); }
  };

  // In WorkerDashboard.tsx
  // src/components/worker/WorkerDashboard.tsx (only the handleLogShift part)
const handleLogShift = async (formData: FormData) => {
    console.log('Submitting shift with FormData');
    try {
        const response = await fetch(`${API_GATEWAY_URL}/api/shifts`, {
            method: 'POST',
            credentials: 'include',
            body: formData
        });

        const data = await response.json();

        if (response.ok && data.success) {
            console.log('Response:', data);
            setIsDrawerOpen(false);
            await fetchData();
            alert('Shift logged successfully!');
        } else {
            alert(data.error || 'Failed to log shift');
        }
    } catch (error: any) {
        console.error('Error logging shift:', error);
        alert('Network error. Please try again.');
    }
};
  const handleLogout = async () => {
    await axios.post(`${API_GATEWAY_URL}/api/auth/logout`, {}, { withCredentials: true });
    localStorage.removeItem('user'); sessionStorage.removeItem('user');
    navigate('/login');
  };

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>Loading...</div>;

  return (
    <div className="app-container">
      <Sidebar collapsed={sidebarCollapsed} activeTab={activeTab} onTabChange={setActiveTab} onLogout={handleLogout} onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)} userName={user?.name || ''} />
      <main className={`main-content ${sidebarCollapsed ? 'main-expanded' : ''}`}>
        <div className="page-content">
          {activeTab === 'dashboard' && (
            <>
              <div className="dashboard-header"><div><h1 className="page-title">Worker Dashboard</h1><p className="page-subtitle">Welcome back, {user?.name}!</p></div></div>
              <StatsCards totalNet={summary?.total_net || 0} totalHours={summary?.total_hours || 0} avgHourlyRate={summary?.avg_hourly_rate || 0} cityMedian={cityMedian} />
              <RecentShifts shifts={shifts} onLogShift={() => setIsDrawerOpen(true)} />
            </>
          )}
          {activeTab === 'earnings' && <EarningsTable shifts={shifts} onLogShift={() => setIsDrawerOpen(true)} />}
          {activeTab === 'analytics' && (
            <AnalyticsCharts
              summary={summary}
              platformBreakdown={platformBreakdown}
              cityMedian={cityMedian}
              userId={user?.id || 0}  // ← Pass userId for anomaly detection
            />
          )}
          {activeTab === 'grievance' && <GrievanceBoard />}
          {/* {activeTab === 'certificate' && <IncomeCertificate user={user} summary={summary} />} } */}
        </div>
      </main>
      <ShiftFormDrawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} onSubmit={handleLogShift} />
    </div>
  );
};

export default WorkerDashboard;