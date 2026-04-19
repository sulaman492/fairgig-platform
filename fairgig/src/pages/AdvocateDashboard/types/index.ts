// src/pages/AdvocateDashboard/types/index.ts

export type NavItem = 'dashboard' | 'complaints' | 'analytics' | 'workers' | 'settings';

export interface CommissionTrend {
    platform: string;
    avg_commission: number;
    change: number;
    trend: 'up' | 'down' | 'stable';
}

export interface IncomeDistribution {
    city: string;
    avg_hourly_rate: number;
    worker_count: number;
    total_earnings: number;
}

export interface VulnerableWorker {
    user_id: number;
    name: string;
    email: string;
    city: string;
    income_drop: number;
    current_weekly_avg: number;
    previous_weekly_avg: number;
}

export interface TopComplaint {
    category: string;
    count: number;
    percentage: number;
}

export interface Complaint {
    id: number;
    user_id: number;
    worker_name: string;
    platform: string;
    category: string;
    title: string;
    description: string;
    tags: string[];
    upvotes: number;
    status: string;
    created_at: string;
}

export interface Notification {
    id: number;
    message: string;
    type: 'info' | 'warning' | 'success';
}