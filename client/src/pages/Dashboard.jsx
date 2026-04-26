// src/pages/Dashboard.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart3, FileBadge2, LayoutDashboard, LogOut, Plus, ReceiptText, ShieldAlert, User } from 'lucide-react';
import EarningsLogger from '../components/Dashboard/EarningsLogger';
import Analytics from '../components/Dashboard/Analytics';
import DashboardOverview from '../components/Dashboard/DashboardOverview'; // ← IMPORT
import { authApi } from '../lib/authApi';
import CertificateGenerator from '../components/Dashboard/CertificateGenerator';

const dashboardItems = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
  },
  {
    id: 'earnings',
    label: 'Earnings',
    icon: ReceiptText,
  },
  {
    id: 'analytics',
    label: 'Analytics',
    icon: BarChart3,
  }, { id: 'certificate', label: 'Certificate', icon: FileBadge2 },
  {
    id: 'grievance',
    label: 'Grievance',
    icon: ShieldAlert,
  },
];

const Dashboard = () => {
  const navigate = useNavigate();
  const [activeItem, setActiveItem] = useState('dashboard');
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [profileImage, setProfileImage] = useState('');

  const handleProfileImageChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const imageUrl = URL.createObjectURL(file);
    setProfileImage((currentImage) => {
      if (currentImage) {
        URL.revokeObjectURL(currentImage);
      }

      return imageUrl;
    });
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
    <div className="h-screen overflow-hidden bg-[linear-gradient(180deg,_#f8fafc_0%,_#eef2f7_48%,_#e5e7eb_100%)] text-slate-950">
      <main className="h-full">
        <section className="h-full overflow-hidden border border-slate-200/80 bg-white/65 backdrop-blur-[2px]">
          <div className="grid h-full lg:grid-cols-[290px_minmax(0,1fr)]">
            {/* Sidebar - stays fixed, no scroll */}
            <aside className="flex h-full flex-col border-b border-slate-200 bg-white/75 p-4 lg:border-b-0 lg:border-r overflow-y-auto">
              <div className="mb-6 flex justify-center pt-2">
                <div className="relative">
                  <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-slate-100 shadow-sm">
                    {profileImage ? (
                      <img src={profileImage} alt="Profile" className="h-full w-full object-cover" />
                    ) : (
                      <User className="h-10 w-10 text-slate-400" />
                    )}
                  </div>
                  <label className="absolute bottom-1 right-1 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-slate-950 text-white shadow-lg transition hover:bg-slate-800">
                    <Plus className="h-4 w-4" />
                    <input type="file" accept="image/*" className="hidden" onChange={handleProfileImageChange} />
                  </label>
                </div>
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
                      className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium transition ${isActive
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

            {/* Content area - SCROLLABLE */}
            <section className="relative overflow-y-auto bg-slate-50/70 p-6 sm:p-8">
              {activeItem === 'dashboard' && <DashboardOverview />}
              {activeItem === 'earnings' && <EarningsLogger />}
              {activeItem === 'analytics' && <Analytics />}
              {activeItem === 'certificate' && <CertificateGenerator />}
              {activeItem === 'grievance' && (
                <div className="flex h-full min-h-[520px] items-center justify-center border border-dashed border-slate-300 bg-white/20">
                  <p className="text-sm font-medium text-slate-500">Grievance Board Coming Soon</p>
                </div>
              )}
            </section>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Dashboard;