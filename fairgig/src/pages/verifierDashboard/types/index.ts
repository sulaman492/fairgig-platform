// src/pages/verifierDashboard/types/index.ts
export type NavItem = 'dashboard' | 'pending' | 'verified' | 'flagged' | 'analytics' | 'settings';

// src/pages/VerifierDashboard/types/index.ts
export interface Submission {
    id: string;
    workerId: string;
    workerName: string;
    platform: string;
    date: string;
    earnings: number;
    status: string;
    priority: string;
    submittedGross: number;
    submittedDeduction: number;
    extractedGross: number;
    extractedDeduction: number;
    screenshotUrl: string;
}
export interface Notification {
    id: number;
    message: string;
    type: 'info' | 'warning' | 'success';
}

export interface DashboardContextType {
    currentView: NavItem;
    setCurrentView: (view: NavItem) => void;
    selectedSubmissionId: string | null;
    setSelectedSubmissionId: (id: string | null) => void;
    showNotification: (message: string, type: 'info' | 'warning' | 'success') => void;
    reviewComplete: () => void;
}