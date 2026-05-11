// src/pages/Dashboard.jsx
import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
    BarChart3,
    FileBadge2,
    LayoutDashboard,
    LogOut,
    Map,
    ReceiptText,
    ShieldAlert,
    Users,
} from 'lucide-react';
import EarningsLogger from '../components/Dashboard/EarningsLogger';
import Analytics from '../components/Dashboard/Analytics';
import DashboardOverview from '../components/Dashboard/DashboardOverview';
import CertificateGenerator from '../components/Dashboard/CertificateGenerator';
import GrievanceBoard from '../components/Grievance/GrievanceBoard';
import AdvocateOverview from '../components/Advocate/AdvocateOverview';
import AdvocateWorkers from '../components/Advocate/AdvocateWorkers';
import AdvocateAnalytics from '../components/Advocate/AdvocateAnalytics';
import AdvocateGrievanceBoard from '../components/Advocate/AdvocateGrievanceBoard';
import Avatar from '../components/common/Avatar';
import { authApi } from '../lib/authApi';

const workerDashboardItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'earnings', label: 'Earnings', icon: ReceiptText },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'certificate', label: 'Certificate', icon: FileBadge2 },
    { id: 'grievance', label: 'Grievance', icon: ShieldAlert },
];

const advocateDashboardItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'workers', label: 'Workers', icon: Users },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'distribution', label: 'Distribution', icon: Map },
    { id: 'grievance', label: 'Moderation', icon: ShieldAlert },
];

const Dashboard = () => {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const [user, setUser] = useState(null);
    const [loadingProfile, setLoadingProfile] = useState(true);

    useEffect(() => {
        fetchUserProfile();
    }, []);

    const fetchUserProfile = async () => {
        try {
            setLoadingProfile(true);
            const response = await authApi.get('/api/auth/profile');
            setUser(response.data);
        } catch (error) {
            console.error('Failed to fetch user profile:', error);
        } finally {
            setLoadingProfile(false);
        }
    };

    const handleAvatarUpdate = (newAvatarUrl) => {
        setUser(prev => ({ ...prev, profile_picture: newAvatarUrl }));
    };

    const handleLogout = async () => {
        setIsLoggingOut(true);
        try {
            await authApi.post('/api/auth/logout');
        } catch (error) {
            console.error('Logout failed:', error);
        } finally {
            navigate('/');
        }
    };

    const isAdvocate = user?.role === 'advocate';
    const dashboardItems = isAdvocate ? advocateDashboardItems : workerDashboardItems;
    const validTabs = dashboardItems.map((item) => item.id);
    const activeItem = validTabs.includes(searchParams.get('tab')) ? searchParams.get('tab') : 'dashboard';

    useEffect(() => {
        const currentTab = searchParams.get('tab');
        if (!currentTab || !validTabs.includes(currentTab)) {
            setSearchParams({ tab: 'dashboard' }, { replace: true });
        }
    }, [searchParams, validTabs, setSearchParams]);

    const renderContent = () => {
        if (isAdvocate) {
            if (activeItem === 'dashboard') return <AdvocateOverview />;
            if (activeItem === 'workers') return <AdvocateWorkers />;
            if (activeItem === 'analytics' || activeItem === 'distribution') return <AdvocateAnalytics />;
            if (activeItem === 'grievance') return <AdvocateGrievanceBoard />;
            return <AdvocateOverview />;
        }

        if (activeItem === 'dashboard') return <DashboardOverview />;
        if (activeItem === 'earnings') return <EarningsLogger />;
        if (activeItem === 'analytics') return <Analytics />;
        if (activeItem === 'certificate') return <CertificateGenerator />;
        if (activeItem === 'grievance') return <GrievanceBoard />;
        return <DashboardOverview />;
    };

    if (loadingProfile) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-[linear-gradient(180deg,_#f8fafc_0%,_#eef2f7_48%,_#e5e7eb_100%)] text-slate-500">
                Loading your dashboard...
            </div>
        );
    }

    return (
        <div className="h-screen overflow-hidden bg-[linear-gradient(180deg,_#f8fafc_0%,_#eef2f7_48%,_#e5e7eb_100%)] text-slate-950">
            <main className="h-full">
                <section className="h-full overflow-hidden border border-slate-200/80 bg-white/65 backdrop-blur-[2px]">
                    <div className="grid h-full lg:grid-cols-[290px_minmax(0,1fr)]">
                        {/* Sidebar */}
                        <aside className="flex h-full flex-col border-b border-slate-200 bg-white/75 p-4 lg:border-b-0 lg:border-r overflow-y-auto">
                            <div className="mb-6 flex justify-center pt-2">
                                <Avatar 
                                    user={user} 
                                    onUpdate={handleAvatarUpdate}
                                    size="lg"
                                />
                            </div>

                            <div className="space-y-3">
                                {dashboardItems.map((item) => {
                                    const Icon = item.icon;
                                    const isActive = activeItem === item.id;
                                    return (
                                        <button
                                            key={item.id}
                                            type="button"
                                            onClick={() => setSearchParams({ tab: item.id })}
                                            className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium transition ${
                                                isActive
                                                    ? 'bg-slate-950 text-white'
                                                    : 'bg-transparent text-slate-800 hover:bg-slate-100'
                                            }`}
                                        >
                                            <Icon className="h-5 w-5 shrink-0" />
                                            <span>{item.label}</span>
                                        </button>
                                    );
                                })}
                            </div>

                            <div className="mt-auto pt-4">
                                <button
                                    type="button"
                                    onClick={handleLogout}
                                    disabled={isLoggingOut}
                                    className="flex w-full items-center gap-3 rounded-xl bg-slate-100 px-4 py-3 text-left text-sm font-medium text-slate-800 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-70"
                                >
                                    <LogOut className="h-5 w-5 shrink-0" />
                                    <span>{isLoggingOut ? 'Logging out...' : 'Logout'}</span>
                                </button>
                            </div>
                        </aside>

                        {/* Content area */}
                        <section className="relative overflow-y-auto bg-slate-50/70 p-6 sm:p-8">
                            {renderContent()}
                        </section>
                    </div>
                </section>
            </main>
        </div>
    );
};

export default Dashboard;
