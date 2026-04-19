// src/pages/AdvocateDashboard/AdvocateSidebar.tsx
import React from 'react';
import { LayoutDashboard, AlertCircle, BarChart3, Users, Settings, LogOut, ChevronLeft, ChevronRight } from 'lucide-react';
import { NavItem } from './types';

interface AdvocateSidebarProps {
    collapsed: boolean;
    onToggleCollapse: () => void;
    onLogout: () => void;
    userName: string;
    currentView: NavItem;
    onViewChange: (view: NavItem) => void;
}

const AdvocateSidebar: React.FC<AdvocateSidebarProps> = ({ 
    collapsed, onToggleCollapse, onLogout, userName, currentView, onViewChange 
}) => {
    const menuItems = [
        { id: 'dashboard' as NavItem, label: 'Dashboard', icon: LayoutDashboard },
        { id: 'complaints' as NavItem, label: 'Complaints', icon: AlertCircle },
        { id: 'analytics' as NavItem, label: 'Analytics', icon: BarChart3 },
        { id: 'workers' as NavItem, label: 'Workers', icon: Users },
        { id: 'settings' as NavItem, label: 'Settings', icon: Settings },
    ];

    return (
        <aside className={`advocate-sidebar ${collapsed ? 'collapsed' : ''}`}>
            <div className="sidebar-header">
                {!collapsed && (
                    <div className="logo">
                        <div className="logo-icon">A</div>
                        <span className="logo-text">Advocate</span>
                    </div>
                )}
                <button onClick={onToggleCollapse} className="sidebar-toggle">
                    {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
                </button>
            </div>
            
            <nav className="sidebar-nav">
                {menuItems.map(item => (
                    <button
                        key={item.id}
                        onClick={() => onViewChange(item.id)}
                        className={`nav-item ${currentView === item.id ? 'active' : ''}`}
                    >
                        <item.icon size={20} />
                        {!collapsed && <span>{item.label}</span>}
                    </button>
                ))}
            </nav>
            
            <div className="sidebar-footer">
                <div className="user-profile">
                    <div className="avatar">{userName?.charAt(0) || 'A'}</div>
                    {!collapsed && (
                        <div className="user-info">
                            <p className="user-name">{userName}</p>
                            <p className="user-tier">Advocate</p>
                        </div>
                    )}
                </div>
                <button onClick={onLogout} className="nav-item logout">
                    <LogOut size={20} />
                    {!collapsed && <span>Logout</span>}
                </button>
            </div>
        </aside>
    );
};

export default AdvocateSidebar;