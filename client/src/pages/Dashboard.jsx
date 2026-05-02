// src/pages/Dashboard.jsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    BarChart3,
    FileBadge2,
    LayoutDashboard,
    LogOut,
    ReceiptText,
    ShieldAlert,
} from 'lucide-react';
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

    async function fetchUserProfile() {
        try {
            const response = await authApi.get('/api/auth/profile');
            setUser(response.data);
        } catch (error) {
            console.error('Failed to fetch user profile:', error);
        }
    }

    useEffect(() => {
        Promise.resolve().then(fetchUserProfile);
    }, []);

    const handleAvatarUpdate = (newAvatarUrl) => {
        setUser((prev) => ({ ...prev, profile_picture: newAvatarUrl }));
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

    return (
        <div className="h-screen overflow-hidden bg-slate-950 text-slate-950">
            <main className="h-full">
                <section className="h-full overflow-hidden bg-slate-950">
                    <div className="grid h-full lg:grid-cols-[290px_minmax(0,1fr)]">
                        <aside className="flex h-full flex-col overflow-y-auto border-b border-slate-800 bg-slate-950 px-4 py-5 text-white lg:border-b-0 lg:border-r">
                            <div className="mb-8 flex justify-center pt-1">
                                <Avatar
                                    user={user}
                                    onUpdate={handleAvatarUpdate}
                                    size="lg"
                                />
                            </div>

                            <div className="space-y-2">
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
                                                    ? 'bg-white text-slate-950 shadow-[0_10px_30px_rgba(255,255,255,0.08)]'
                                                    : 'bg-transparent text-slate-300 hover:bg-slate-900 hover:text-white'
                                            }`}
                                        >
                                            <Icon className="h-5 w-5 shrink-0" />
                                            <span>{item.label}</span>
                                        </button>
                                    );
                                })}
                            </div>

                            <div className="mt-auto border-t border-slate-800 pt-4">
                                <button
                                    type="button"
                                    onClick={handleLogout}
                                    disabled={isLoggingOut}
                                    className="flex w-full items-center gap-3 rounded-xl border border-slate-800 bg-slate-900 px-4 py-3 text-left text-sm font-medium text-slate-200 transition hover:border-slate-700 hover:bg-slate-800 hover:text-white disabled:cursor-not-allowed disabled:opacity-70"
                                >
                                    <LogOut className="h-5 w-5 shrink-0" />
                                    <span>{isLoggingOut ? 'Logging out...' : 'Logout'}</span>
                                </button>
                            </div>
                        </aside>

                        <section className="relative overflow-hidden bg-slate-900">
                            <div className="h-full overflow-y-auto bg-[radial-gradient(circle_at_top,_rgba(148,163,184,0.08),_transparent_28%),linear-gradient(180deg,_#0f172a_0%,_#111827_100%)] p-6 text-slate-100 sm:p-8">
                                {activeItem === 'dashboard' && <DashboardOverview />}
                                {activeItem === 'earnings' && <EarningsLogger />}
                                {activeItem === 'analytics' && <Analytics />}
                                {activeItem === 'certificate' && <CertificateGenerator />}
                                {activeItem === 'grievance' && <GrievanceBoard />}
                            </div>
                        </section>
                    </div>
                </section>
            </main>
        </div>
    );
};

export default Dashboard;
