// src/pages/VerifierDashboard/hooks/useVerifierData.ts
import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { type Submission, type Notification } from '../types';

const API_GATEWAY_URL = 'http://localhost:5000';

// Fetch pending shifts
const fetchPendingShifts = async (): Promise<Submission[]> => {
    try {
        const response = await axios.get(`${API_GATEWAY_URL}/api/shifts/pending`, {
            withCredentials: true
        });
        const shifts = response.data.shifts || [];
        return shifts.map((shift: any) => ({
            id: shift.id.toString(),
            workerId: `WKR-${shift.user_id}`,
            workerName: shift.worker_name || `Worker ${shift.user_id}`,
            platform: shift.platform,
            date: shift.shift_date?.split('T')[0] || shift.shift_date,
            earnings: shift.net_received,
            status: shift.verification_status,
            priority: shift.net_received < 1000 ? 'suspicious' : 'normal',
            submittedGross: shift.gross_earned,
            submittedDeduction: shift.platform_deductions,
            extractedGross: shift.gross_earned,
            extractedDeduction: shift.platform_deductions,
            screenshotUrl: shift.screenshot_url || ''
        }));
    } catch (error) {
        console.error('Error fetching pending shifts:', error);
        return [];
    }
};

// ✅ Fetch verified shifts
const fetchVerifiedShifts = async (): Promise<Submission[]> => {
    try {
        const response = await axios.get(`${API_GATEWAY_URL}/api/shifts/verified`, {
            withCredentials: true
        });
        const shifts = response.data.shifts || [];
        return shifts.map((shift: any) => ({
            id: shift.id.toString(),
            workerId: `WKR-${shift.user_id}`,
            workerName: shift.worker_name || `Worker ${shift.user_id}`,
            platform: shift.platform,
            date: shift.shift_date?.split('T')[0] || shift.shift_date,
            earnings: shift.net_received,
            status: shift.verification_status,
            priority: 'normal',
            submittedGross: shift.gross_earned,
            submittedDeduction: shift.platform_deductions,
            extractedGross: shift.gross_earned,
            extractedDeduction: shift.platform_deductions,
            screenshotUrl: shift.screenshot_url || ''
        }));
    } catch (error) {
        console.error('Error fetching verified shifts:', error);
        return [];
    }
};

// ✅ Fetch flagged shifts
const fetchFlaggedShifts = async (): Promise<Submission[]> => {
    try {
        const response = await axios.get(`${API_GATEWAY_URL}/api/shifts/flagged`, {
            withCredentials: true
        });
        const shifts = response.data.shifts || [];
        return shifts.map((shift: any) => ({
            id: shift.id.toString(),
            workerId: `WKR-${shift.user_id}`,
            workerName: shift.worker_name || `Worker ${shift.user_id}`,
            platform: shift.platform,
            date: shift.shift_date?.split('T')[0] || shift.shift_date,
            earnings: shift.net_received,
            status: shift.verification_status,
            priority: 'suspicious',
            submittedGross: shift.gross_earned,
            submittedDeduction: shift.platform_deductions,
            extractedGross: shift.gross_earned,
            extractedDeduction: shift.platform_deductions,
            screenshotUrl: shift.screenshot_url || ''
        }));
    } catch (error) {
        console.error('Error fetching flagged shifts:', error);
        return [];
    }
};

const updateShiftStatus = async (shiftId: string, status: string, comment?: string): Promise<void> => {
    try {
        let apiStatus = '';
        switch (status) {
            case 'approved':
                apiStatus = 'confirmed';
                break;
            case 'rejected':
                apiStatus = 'discrepancy';
                break;
            default:
                apiStatus = status;
        }

        await axios.put(`${API_GATEWAY_URL}/api/shifts/${shiftId}/verify`,
            { status: apiStatus },
            { withCredentials: true }
        );
    } catch (error) {
        console.error('Error updating shift:', error);
        throw error;
    }
};

export const useVerifierData = () => {
    const [submissions, setSubmissions] = useState<Submission[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [reviewedCount, setReviewedCount] = useState(0);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [activeView, setActiveView] = useState<'pending' | 'verified' | 'flagged'>('pending');

    const loadSubmissions = async () => {
        try {
            setLoading(true);
            let data: Submission[] = [];
            
            if (activeView === 'pending') {
                data = await fetchPendingShifts();
            } else if (activeView === 'verified') {
                data = await fetchVerifiedShifts();
            } else if (activeView === 'flagged') {
                data = await fetchFlaggedShifts();
            }
            
            setSubmissions(data);
            setError(null);
            console.log(`📊 Loaded ${data.length} submissions for view: ${activeView}`);
        } catch (err) {
            setError('Failed to load submissions');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadSubmissions();
    }, [activeView]);

    const showNotification = useCallback((message: string, type: 'info' | 'warning' | 'success') => {
        const id = Date.now();
        setNotifications(prev => [...prev, { id, message, type }]);
        setTimeout(() => {
            setNotifications(prev => prev.filter(n => n.id !== id));
        }, 4000);
    }, []);

    const reviewComplete = useCallback(() => {
        setReviewedCount(prev => prev + 1);
    }, []);

    const handleDecision = useCallback(async (id: string, decision: 'approve' | 'reject', comment?: string) => {
        const newStatus = decision === 'approve' ? 'approved' : 'rejected';
        
        setSubmissions(prev => prev.map(sub =>
            sub.id === id ? { ...sub, status: newStatus } : sub
        ));

        try {
            await updateShiftStatus(id, newStatus, comment);
            showNotification(`${decision === 'approve' ? 'Approved' : 'Rejected'} submission #${id}`, 'success');
            reviewComplete();
            await loadSubmissions();
        } catch (error) {
            showNotification(`Failed to update submission #${id}`, 'warning');
            await loadSubmissions();
        }
    }, [showNotification, reviewComplete]);

    const pendingSubmissions = submissions.filter(s => s.status === 'pending');
    const verifiedSubmissions = submissions.filter(s => s.status === 'confirmed' || s.status === 'approved');
    const flaggedSubmissions = submissions.filter(s => s.status === 'discrepancy' || s.status === 'rejected' || s.status === 'unverifiable');

    return {
        submissions,
        pendingSubmissions,
        verifiedSubmissions,
        flaggedSubmissions,
        loading,
        error,
        reviewedCount,
        notifications,
        handleDecision,
        showNotification,
        reviewComplete,
        loadSubmissions,
        setActiveView,
        activeView,
        pendingCount: pendingSubmissions.length,
        verifiedCount: verifiedSubmissions.length,
        flaggedCount: flaggedSubmissions.length,
    };
};