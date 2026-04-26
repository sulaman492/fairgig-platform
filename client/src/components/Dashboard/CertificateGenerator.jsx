import { useState, useEffect } from 'react';
import { authApi } from '../../lib/authApi';
import { Calendar, Download, FileText, Loader2, CheckCircle, AlertCircle } from 'lucide-react';

export default function CertificateGenerator() {
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [loading, setLoading] = useState(false);
    const [workerName, setWorkerName] = useState('');
    const [cnic, setCnic] = useState('');
    const [cnicError, setCnicError] = useState('');
    const [shifts, setShifts] = useState([]);
    const [loadingShifts, setLoadingShifts] = useState(false);
    const [verifiedCount, setVerifiedCount] = useState(0);
    const [loadingProfile, setLoadingProfile] = useState(true);
    
    // Set default date range (last 30 days)
    useEffect(() => {
        const end = new Date();
        const start = new Date();
        start.setDate(start.getDate() - 30);
        
        setEndDate(end.toISOString().split('T')[0]);
        setStartDate(start.toISOString().split('T')[0]);
    }, []);
    
    // Fetch user info (name only - CNIC will be entered by user)
    useEffect(() => {
        const fetchUserInfo = async () => {
            setLoadingProfile(true);
            try {
                const response = await authApi.get('/api/auth/me');
                // Only set name, not CNIC (user will enter CNIC manually)
                setWorkerName(response.data.name || '');
            } catch (error) {
                console.error('Failed to fetch user info:', error);
            } finally {
                setLoadingProfile(false);
            }
        };
        fetchUserInfo();
    }, []);
    
    // Validate CNIC (must be exactly 13 digits)
    const validateCNIC = (value) => {
        // Remove any non-digit characters for validation
        const digitsOnly = value.replace(/\D/g, '');
        
        if (value === '') {
            setCnicError('');
            return true; // Empty is allowed (optional)
        }
        
        if (digitsOnly.length !== 13) {
            setCnicError('CNIC must be exactly 13 digits (e.g., 1234567890123)');
            return false;
        }
        
        setCnicError('');
        return true;
    };
    
    const handleCnicChange = (e) => {
        let value = e.target.value;
        // Remove any non-digit characters
        let digitsOnly = value.replace(/\D/g, '');
        
        // Limit to 13 digits
        if (digitsOnly.length > 13) {
            digitsOnly = digitsOnly.slice(0, 13);
        }
        
        // Format CNIC as 12345-6789012-3 (optional formatting)
        let formatted = digitsOnly;
        if (digitsOnly.length > 5) {
            formatted = digitsOnly.slice(0, 5) + '-' + digitsOnly.slice(5);
        }
        if (digitsOnly.length > 12) {
            formatted = digitsOnly.slice(0, 5) + '-' + digitsOnly.slice(5, 12) + '-' + digitsOnly.slice(12, 13);
        }
        
        setCnic(formatted);
        validateCNIC(digitsOnly);
    };
    
    // Fetch shifts when date range changes
    useEffect(() => {
        if (startDate && endDate) {
            fetchShifts();
        }
    }, [startDate, endDate]);
    
    const fetchShifts = async () => {
        setLoadingShifts(true);
        try {
            const response = await authApi.get(`/api/shifts/range?start_date=${startDate}&end_date=${endDate}`);
            const allShifts = response.data.shifts || [];
            // Only show verified shifts
            const verifiedShifts = allShifts.filter(s => s.verification_status === 'confirmed');
            setShifts(verifiedShifts);
            setVerifiedCount(verifiedShifts.length);
        } catch (error) {
            console.error('Failed to fetch shifts:', error);
        } finally {
            setLoadingShifts(false);
        }
    };
    
   const handleGenerate = async () => {
    if (!startDate || !endDate) {
        alert('Please select both start and end dates');
        return;
    }
    
    if (shifts.length === 0) {
        alert('No verified shifts found in this date range. Only verified earnings appear on the certificate.');
        return;
    }
    
    // Validate CNIC if provided
    const cnicDigits = cnic.replace(/\D/g, '');
    if (cnic && cnicDigits.length !== 13) {
        alert('CNIC must be exactly 13 digits if provided');
        return;
    }
    
    setLoading(true);
    
    try {
        // Calculate stats
        const totalEarnings = shifts.reduce((sum, s) => sum + Number(s.net_received), 0);
        const totalHours = shifts.reduce((sum, s) => sum + Number(s.hours_worked), 0);
        
        const platformStats = {};
        shifts.forEach(shift => {
            if (!platformStats[shift.platform]) {
                platformStats[shift.platform] = { earnings: 0, hours: 0, shifts: 0 };
            }
            platformStats[shift.platform].earnings += Number(shift.net_received);
            platformStats[shift.platform].hours += Number(shift.hours_worked);
            platformStats[shift.platform].shifts += 1;
        });
        
        // Call certificate service
        const response = await authApi.post('/api/certificate/generate', {
            workerName: workerName || 'Gig Worker',
            workerId: 'WK-' + Math.random().toString(36).substr(2, 8).toUpperCase(),
            cnic: cnic || 'Not Provided',
            startDate,
            endDate,
            shifts,
            totalEarnings,
            totalHours,
            platformStats
        }, {
            responseType: 'text'  // ← CHANGE from 'blob' to 'text'
        });
        
        // response.data is now a string (HTML)
        const htmlContent = response.data;
        
        // Open new window and write the HTML
        const newWindow = window.open();
        if (newWindow) {
            newWindow.document.write(htmlContent);
            newWindow.document.close();
        } else {
            // Fallback: Create a blob and open
            const blob = new Blob([htmlContent], { type: 'text/html' });
            const url = URL.createObjectURL(blob);
            window.open(url);
            URL.revokeObjectURL(url);
        }
        
    } catch (error) {
        console.error('Certificate generation error:', error);
        alert('Failed to generate certificate. Please try again.');
    } finally {
        setLoading(false);
    }
}; 
    // Format CNIC for display (12-34567-8 format)
    const formatCNICForDisplay = (value) => {
        const digits = value.replace(/\D/g, '');
        if (digits.length === 13) {
            return `${digits.slice(0, 5)}-${digits.slice(5, 12)}-${digits.slice(12)}`;
        }
        return value;
    };
    
    return (
        <div className="max-w-3xl mx-auto p-6">
            <div className="text-center mb-8">
                <FileText className="h-12 w-12 text-blue-600 mx-auto mb-3" />
                <h2 className="text-2xl font-bold text-gray-900">Income Certificate</h2>
                <p className="text-gray-600 mt-2">
                    Generate a printable income certificate for landlords, banks, or official use
                </p>
            </div>
            
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                <div className="space-y-5">
                    {/* Worker Info - Name auto-fetched, CNIC manual entry */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Your Name {loadingProfile && <Loader2 className="h-3 w-3 animate-spin inline ml-1" />}
                            </label>
                            <input
                                type="text"
                                value={workerName}
                                onChange={(e) => setWorkerName(e.target.value)}
                                placeholder="Enter your name"
                                disabled={loadingProfile}
                                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                            />
                            {workerName && !loadingProfile && (
                                <p className="text-xs text-green-600 mt-1">✓ Name loaded from profile</p>
                            )}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                CNIC (Optional - 13 digits)
                            </label>
                            <input
                                type="text"
                                value={cnic}
                                onChange={handleCnicChange}
                                placeholder="12345-6789012-3"
                                maxLength="15"
                                className={`w-full rounded-lg border px-4 py-2.5 focus:ring-2 focus:ring-blue-500 ${
                                    cnicError ? 'border-red-500' : 'border-gray-300'
                                }`}
                            />
                            {cnicError ? (
                                <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                                    <AlertCircle className="h-3 w-3" />
                                    {cnicError}
                                </p>
                            ) : (
                                <p className="text-xs text-gray-500 mt-1">
                                    Enter 13-digit CNIC number (e.g., 12345-6789012-3)
                                </p>
                            )}
                        </div>
                    </div>
                    
                    {/* Date Range */}
                    <div className="border-t border-gray-200 pt-4">
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                            Select Date Range
                        </label>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs text-gray-500 mb-1">Start Date</label>
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-gray-500 mb-1">End Date</label>
                                <input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>
                    </div>
                    
                    {/* Shift Summary */}
                    <div className="bg-gray-50 rounded-lg p-4">
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Verified Shifts Found:</span>
                            {loadingShifts ? (
                                <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                            ) : (
                                <span className="font-semibold text-green-600">{verifiedCount} shifts</span>
                            )}
                        </div>
                        {verifiedCount === 0 && !loadingShifts && (
                            <p className="text-xs text-orange-600 mt-2">
                                ⚠️ No verified shifts in this date range. Only verified earnings appear on the certificate.
                            </p>
                        )}
                    </div>
                    
                    <div className="bg-blue-50 rounded-lg p-4 text-sm text-blue-800">
                        <strong>ℹ️ Note:</strong> Only <span className="font-semibold">VERIFIED</span> shifts appear on the certificate. 
                        Pending or flagged shifts are excluded for authenticity.
                    </div>
                    
                    <button
                        onClick={handleGenerate}
                        disabled={loading || shifts.length === 0}
                        className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="h-5 w-5 animate-spin" />
                                Generating Certificate...
                            </>
                        ) : (
                            <>
                                <Download className="h-5 w-5" />
                                Generate Certificate
                            </>
                        )}
                    </button>
                </div>
            </div>
            
            <div className="mt-6 text-center text-xs text-gray-500">
                <p>The certificate will open in a new window. Use Ctrl+P (Cmd+P on Mac) to print or save as PDF.</p>
            </div>
        </div>
    );
}