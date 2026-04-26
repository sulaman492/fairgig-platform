// services/calculator.js
export const calculateEarnings = (shifts) => {
    let totalEarnings = 0;
    let totalHours = 0;
    let totalDeductions = 0;
    let platformStats = {};

    shifts.forEach(shift => {
        const net = Number(shift.net_received);
        const hours = Number(shift.hours_worked);
        const deductions = Number(shift.platform_deductions || 0);

        totalEarnings += net;
        totalHours += hours;
        totalDeductions += deductions;

        if (!platformStats[shift.platform]) {
            platformStats[shift.platform] = { 
                earnings: 0, 
                hours: 0, 
                shifts: 0 
            };
        }
        platformStats[shift.platform].earnings += net;
        platformStats[shift.platform].hours += hours;
        platformStats[shift.platform].shifts += 1;
    });

    const avgHourlyRate = totalHours > 0 ? totalEarnings / totalHours : 0;

    return {
        totalEarnings,
        totalHours,
        totalDeductions,
        platformStats,
        avgHourlyRate,
        totalShifts: shifts.length
    };
};

export const prepareCertificateData = (shifts, providedData = {}) => {
    // If data already provided, use it
    if (providedData.totalEarnings) {
        return {
            totalEarnings: providedData.totalEarnings,
            totalHours: providedData.totalHours,
            totalDeductions: providedData.totalDeductions,
            platformStats: providedData.platformStats,
            avgHourlyRate: providedData.totalHours > 0 
                ? providedData.totalEarnings / providedData.totalHours 
                : 0,
            totalShifts: shifts.length
        };
    }
    
    // Otherwise calculate
    return calculateEarnings(shifts);
};