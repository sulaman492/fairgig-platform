// src/pages/Dashboard.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart3, FileBadge2, LayoutDashboard, LogOut, ReceiptText, ShieldAlert } from 'lucide-react';
import EarningsLogger from '../components/Dashboard/EarningsLogger';
import Analytics from '../components/Dashboard/Analytics';
import DashboardOverview from '../components/Dashboard/DashboardOverview';
import CertificateGenerator from '../components/Dashboard/CertificateGenerator';
import GrievanceBoard from '../components/Grievance/GrievanceBoard';
import Avatar from '../components/common/Avatar';
import { authApi } from '../lib/authApi';

const dashboardItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'earnings', label: 'Earnings', icon: ReceiptText },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'certificate', label: 'Certificate', icon: FileBadge2 },
    { id: 'grievance', label: 'Grievance', icon: ShieldAlert },
];

const Dashboard = () => {
    const navigate = useNavigate();
    const [activeItem, setActiveItem] = useState('dashboard');
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const [user, setUser] = useState(null);

    useEffect(() => {
        fetchUserProfile();
    }, []);

    const fetchUserProfile = async () => {
        try {
            // ✅ Calling API Gateway
            const response = await authApi.get('/api/auth/profile');
            setUser(response.data);
        } catch (error) {
            console.error('Failed to fetch user profile:', error);
        }
    };

    const handleAvatarUpdate = (newAvatarUrl) => {
        setUser(prev => ({ ...prev, profile_picture: newAvatarUrl }));
    };

    const handleLogout = async () => {
        setIsLoggingOut(true);
        try {
            // ✅ Calling API Gateway
            await authApi.post('/api/auth/logout');
        } catch (error) {
            console.error('Logout failed:', error);
        } finally {
            navigate('/');
        }
    };

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
                                            onClick={() => setActiveItem(item.id)}
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
                            {activeItem === 'dashboard' && <DashboardOverview />}
                            {activeItem === 'earnings' && <EarningsLogger />}
                            {activeItem === 'analytics' && <Analytics />}
                            {activeItem === 'certificate' && <CertificateGenerator />}
                            {activeItem === 'grievance' && <GrievanceBoard />}
                        </section>
                    </div>
                </section>
            </main>
        </div>
    );
};

export default Dashboard;