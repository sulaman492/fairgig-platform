// src/pages/AdvocateDashboard/components/SummaryCards.tsx
import React from 'react';
import { TrendingUp, TrendingDown, AlertTriangle, MessageCircle } from 'lucide-react';

interface SummaryCardsProps {
    totalComplaints: number;
    avgCommission: number;
    vulnerableCount: number;
    resolvedCount: number;
}

const SummaryCards: React.FC<SummaryCardsProps> = ({ totalComplaints, avgCommission, vulnerableCount, resolvedCount }) => {
    return (
        <div className="summary-cards">
            <div className="summary-card">
                <div className="summary-icon blue">
                    <MessageCircle size={24} />
                </div>
                <div className="summary-info">
                    <h3>{totalComplaints}</h3>
                    <p>Total Complaints</p>
                </div>
            </div>
            
            <div className="summary-card">
                <div className="summary-icon yellow">
                    <TrendingUp size={24} />
                </div>
                <div className="summary-info">
                    <h3>{avgCommission}%</h3>
                    <p>Avg Commission</p>
                </div>
            </div>
            
            <div className="summary-card">
                <div className="summary-icon red">
                    <AlertTriangle size={24} />
                </div>
                <div className="summary-info">
                    <h3>{vulnerableCount}</h3>
                    <p>Vulnerable Workers</p>
                </div>
            </div>
            
            <div className="summary-card">
                <div className="summary-icon green">
                    <TrendingDown size={24} />
                </div>
                <div className="summary-info">
                    <h3>{resolvedCount}</h3>
                    <p>Resolved</p>
                </div>
            </div>
        </div>
    );
};

export default SummaryCards;