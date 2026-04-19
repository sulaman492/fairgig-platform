// src/pages/VerifierDashboard/context/VerifierContext.tsx
import React, { createContext, useContext } from 'react';
import { type DashboardContextType } from '../types';

const VerifierContext = createContext<DashboardContextType | null>(null);

export const useVerifier = () => {
    const ctx = useContext(VerifierContext);
    if (!ctx) throw new Error('useVerifier must be used within VerifierProvider');
    return ctx;
};

export const VerifierProvider = VerifierContext.Provider;
export default VerifierContext;