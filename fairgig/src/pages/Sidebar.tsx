// src/components/worker/Sidebar.tsx
import React from 'react';
import { Home, DollarSign, BarChart3, FileText, LogOut, ChevronLeft, ChevronRight } from 'lucide-react';

interface SidebarProps {
  collapsed: boolean;
  activeTab: string;
  onTabChange: (tab: string) => void;
  onLogout: () => void;
  onToggleCollapse: () => void;
  userName: string;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  collapsed, activeTab, onTabChange, onLogout, onToggleCollapse, userName 
}) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'earnings', label: 'Earnings', icon: DollarSign },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },  // ← Fixed: 'Analytics' as string
    { id: 'certificate', label: 'Certificate', icon: FileText },
  ];

  return (
    <aside className={`sidebar ${collapsed ? 'sidebar-collapsed' : ''}`}>
      <div className="sidebar-header">
        {!collapsed && <div className="logo"><div className="logo-icon">F</div><span className="logo-text">FairGig</span></div>}
        <button onClick={onToggleCollapse} className="sidebar-toggle">
          {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </button>
      </div>
      <nav className="sidebar-nav">
        {menuItems.map(item => (
          <button key={item.id} onClick={() => onTabChange(item.id)} className={`nav-item ${activeTab === item.id ? 'nav-item-active' : ''}`}>
            <item.icon size={20} /> {!collapsed && <span>{item.label}</span>}
          </button>
        ))}
      </nav>
      <div className="sidebar-footer">
        <div className="user-profile">
          <div className="avatar">{userName?.charAt(0) || 'U'}</div>
          {!collapsed && <div className="user-info"><p className="user-name">{userName}</p><p className="user-tier">Worker</p></div>}
        </div>
        <button onClick={onLogout} className="nav-item" style={{ marginTop: '12px' }}>
          <LogOut size={20} /> {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;