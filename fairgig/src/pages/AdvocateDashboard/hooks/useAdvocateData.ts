// src/pages/AdvocateDashboard/hooks/useAdvocateData.ts
import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { 
    type CommissionTrend, 
    type IncomeDistribution, 
    type VulnerableWorker, 
    type TopComplaint, 
    type Complaint,
    type Notification 
} from '../types';

const API_GATEWAY_URL = 'http://localhost:5000';

export const useAdvocateData = () => {
    const [commissionTrends, setCommissionTrends] = useState<CommissionTrend[]>([]);
    const [incomeDistribution, setIncomeDistribution] = useState<IncomeDistribution[]>([]);
    const [vulnerableWorkers, setVulnerableWorkers] = useState<VulnerableWorker[]>([]);
    const [topComplaints, setTopComplaints] = useState<TopComplaint[]>([]);
    const [complaints, setComplaints] = useState<Complaint[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [notifications, setNotifications] = useState<Notification[]>([]);

    const fetchAllData = async () => {
        try {
            setLoading(true);
            
            const [
                trendsRes,
                incomeRes,
                vulnerableRes,
                complaintsRes,
                topComplaintsRes
            ] = await Promise.all([
                axios.get(`${API_GATEWAY_URL}/api/analytics/commission-trends`, { withCredentials: true }),
                axios.get(`${API_GATEWAY_URL}/api/analytics/income-distribution`, { withCredentials: true }),
                axios.get(`${API_GATEWAY_URL}/api/analytics/vulnerable-workers`, { withCredentials: true }),
                axios.get(`${API_GATEWAY_URL}/api/complaints`, { withCredentials: true }),
                axios.get(`${API_GATEWAY_URL}/api/analytics/top-complaints`, { withCredentials: true })
            ]);
            
            setCommissionTrends(trendsRes.data || []);
            setIncomeDistribution(incomeRes.data.distribution || []);
            setVulnerableWorkers(vulnerableRes.data.workers || []);
            setComplaints(complaintsRes.data.complaints || []);
            setTopComplaints(topComplaintsRes.data.top_complaints || []);
            
            setError(null);
        } catch (err) {
            console.error('Error fetching advocate data:', err);
            setError('Failed to load dashboard data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAllData();
    }, []);

    const updateComplaintStatus = async (id: number, status: string, tags?: string[]) => {
        try {
            const response = await axios.put(`${API_GATEWAY_URL}/api/complaints/${id}`, 
                { status, tags },
                { withCredentials: true }
            );
            
            setComplaints(prev => prev.map(c => 
                c.id === id ? { ...c, status, tags: tags || c.tags } : c
            ));
            
            showNotification(`Complaint ${id} updated to ${status}`, 'success');
            return response.data;
        } catch (error) {
            console.error('Error updating complaint:', error);
            showNotification('Failed to update complaint', 'warning');
            throw error;
        }
    };

    const showNotification = (message: string, type: 'info' | 'warning' | 'success') => {
        const id = Date.now();
        setNotifications(prev => [...prev, { id, message, type }]);
        setTimeout(() => {
            setNotifications(prev => prev.filter(n => n.id !== id));
        }, 4000);
    };

    return {
        commissionTrends,
        incomeDistribution,
        vulnerableWorkers,
        topComplaints,
        complaints,
        loading,
        error,
        notifications,
        updateComplaintStatus,
        fetchAllData,
        showNotification
    };
};