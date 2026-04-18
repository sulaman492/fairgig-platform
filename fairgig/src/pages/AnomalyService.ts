// src/services/AnomalyService.ts
import axios from 'axios';

const API_GATEWAY_URL = 'http://localhost:5000';

export interface EarningsEntry {
    date: string;
    amount: number;
    hours_worked?: number;
    platform?: string;
}

export interface Anomaly {
    date: string;
    type: string;
    description: string;
    severity: string;
}

export interface AnomalyResponse {
    user_id: number;
    anomalies: Anomaly[];
    summary: string;
    has_anomalies: boolean;
}

export const detectAnomalies = async (userId: number, earnings: EarningsEntry[]): Promise<AnomalyResponse> => {
    try {
        const response = await axios.post(`${API_GATEWAY_URL}/api/anomaly/detect-anomalies`, {
            user_id: userId,
            earnings: earnings
        });
        return response.data;
    } catch (error) {
        console.error('Error detecting anomalies:', error);
        return {
            user_id: userId,
            anomalies: [],
            summary: 'Could not detect anomalies',
            has_anomalies: false
        };
    }
};