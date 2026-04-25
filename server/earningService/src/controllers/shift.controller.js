// src/controllers/shift.controller.js
import Shift from '../models/shift.model.js';

// Create a new shift (with base64 screenshot)
export const createShift = async (req, res) => {
    try {
        // Only workers can create shifts
        if (req.user.role !== 'worker') {
            return res.status(403).json({ error: 'Only workers can log shifts' });
        }

        const { platform, shift_date, hours_worked, gross_earned,
            platform_deductions, net_received, screenshot } = req.body;

        // Validate required fields
        if (!platform || !shift_date || !hours_worked || !gross_earned || !platform_deductions || !net_received) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        // Validate hours
        const parsedHours = parseFloat(hours_worked);
        const parsedGross = parseFloat(gross_earned);
        const parsedDeductions = parseFloat(platform_deductions);
        const parsedNet = parseFloat(net_received);

        if (parsedHours <= 0 || parsedHours > 24) {
            return res.status(400).json({ error: 'Hours must be between 1 and 24' });
        }

        // Validate amounts
        if (parsedGross < 0 || parsedDeductions < 0 || parsedNet < 0) {
            return res.status(400).json({ error: 'Amounts cannot be negative' });
        }

        // Validate net = gross - deductions
        const calculatedNet = parsedGross - parsedDeductions;
        if (Math.abs(calculatedNet - parsedNet) > 1) {
            return res.status(400).json({ error: 'Net amount should equal gross minus deductions' });
        }

        // Create shift
        const shift = await Shift.create({
            user_id: req.user.id,
            platform,
            shift_date,
            hours_worked: parsedHours,
            gross_earned: parsedGross,
            platform_deductions: parsedDeductions,
            net_received: parsedNet
        });

        // Save base64 screenshot if provided
        let screenshotUrl = null;
        if (screenshot && screenshot.trim() !== '') {
            await Shift.updateScreenshot(shift.id, screenshot);
            screenshotUrl = screenshot.substring(0, 100) + '...'; // Truncated for response
        }

        res.status(201).json({
            success: true,
            message: 'Shift logged successfully',
            shift: {
                ...shift,
                screenshot_url: screenshot ? 'saved' : null
            }
        });

    } catch (error) {
        console.error('Create shift error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Get pending shifts (for verifier) - includes screenshot
export const getPendingShifts = async (req, res) => {
    try {
        if (req.user.role !== 'verifier') {
            return res.status(403).json({ error: 'Only verifiers can view pending shifts' });
        }

        const shifts = await Shift.findPending();

        res.json({
            success: true,
            count: shifts.length,
            shifts
        });

    } catch (error) {
        console.error('Get pending shifts error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Get current user's shifts
export const getMyShifts = async (req, res) => {
    try {
        if (req.user.role !== 'worker') {
            return res.status(403).json({ error: 'Only workers can view their shifts' });
        }

        const shifts = await Shift.findByUserId(req.user.id);

        res.json({
            success: true,
            count: shifts.length,
            shifts
        });

    } catch (error) {
        console.error('Get shifts error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Get shifts by date range
export const getShiftsByDateRange = async (req, res) => {
    try {
        const { start_date, end_date } = req.query;

        if (!start_date || !end_date) {
            return res.status(400).json({ error: 'Start date and end date are required' });
        }

        const shifts = await Shift.findByDateRange(req.user.id, start_date, end_date);

        res.json({
            success: true,
            shifts: shifts
        });

    } catch (error) {
        console.error('Date range error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Get income summary
// server/earningService/src/controllers/shift.controller.js

let summaryCache = null;
let lastCacheTime = null;
const CACHE_TTL = 60000; // 60 seconds

export const getIncomeSummary = async (req, res) => {
    try {
        if (req.user.role !== 'worker') {
            return res.status(403).json({ error: 'Only workers can view income summary' });
        }

        const { period = 'all' } = req.query;

        // Check cache
        const now = Date.now();
        if (summaryCache && lastCacheTime && (now - lastCacheTime) < CACHE_TTL) {
            console.log('📦 Returning cached summary');
            return res.json({
                success: true,
                period,
                summary: summaryCache
            });
        }

        const summary = await Shift.getIncomeSummary(req.user.id, period);
        const platformBreakdown = await Shift.getPlatformBreakdown(req.user.id, period);

        // Update cache
        summaryCache = {
            total_gross: parseFloat(summary.total_gross),
            total_deductions: parseFloat(summary.total_deductions),
            total_net: parseFloat(summary.total_net),
            total_hours: parseFloat(summary.total_hours),
            total_shifts: parseInt(summary.total_shifts),
            avg_hourly_rate: parseFloat(summary.avg_hourly_rate)
        };
        lastCacheTime = now;

        res.json({
            success: true,
            period,
            summary: summaryCache,
            platform_breakdown: platformBreakdown
        });

    } catch (error) {
        console.error('Income summary error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Verify a shift (for verifier)
export const verifyShift = async (req, res) => {
    try {
        if (req.user.role !== 'verifier') {
            return res.status(403).json({ error: 'Only verifiers can verify shifts' });
        }

        const { shift_id } = req.params;
        const { status } = req.body;

        if (!['confirmed', 'discrepancy', 'unverifiable'].includes(status)) {
            return res.status(400).json({ error: 'Invalid status. Must be confirmed, discrepancy, or unverifiable' });
        }

        const shift = await Shift.updateVerification(shift_id, status);

        if (!shift) {
            return res.status(404).json({ error: 'Shift not found' });
        }

        res.json({
            success: true,
            message: `Shift ${shift_id} marked as ${status}`,
            shift
        });

    } catch (error) {
        console.error('Verify shift error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Update a shift
export const updateShift = async (req, res) => {
    try {
        const { shift_id } = req.params;
        const { platform, shift_date, hours_worked, gross_earned, platform_deductions, net_received } = req.body;

        const existingShift = await Shift.findById(shift_id);

        if (!existingShift) {
            return res.status(404).json({ error: 'Shift not found' });
        }

        if (existingShift.user_id !== req.user.id) {
            return res.status(403).json({ error: 'You can only update your own shifts' });
        }

        const updatedShift = await Shift.update(shift_id, {
            platform,
            shift_date,
            hours_worked: parseFloat(hours_worked),
            gross_earned: parseFloat(gross_earned),
            platform_deductions: parseFloat(platform_deductions),
            net_received: parseFloat(net_received)
        });

        res.json({
            success: true,
            message: 'Shift updated successfully',
            shift: updatedShift
        });

    } catch (error) {
        console.error('Update shift error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Delete a shift
export const deleteShift = async (req, res) => {
    try {
        const { shift_id } = req.params;

        const existingShift = await Shift.findById(shift_id);

        if (!existingShift) {
            return res.status(404).json({ error: 'Shift not found' });
        }

        if (existingShift.user_id !== req.user.id) {
            return res.status(403).json({ error: 'You can only delete your own shifts' });
        }

        await Shift.delete(shift_id);

        res.json({
            success: true,
            message: 'Shift deleted successfully'
        });

    } catch (error) {
        console.error('Delete shift error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
// src/controllers/shift.controller.js

// Get verified shifts (confirmed shifts)
// src/controllers/shift.controller.js

// Get verified shifts (for verifier)
export const getVerifiedShifts = async (req, res) => {
    try {
        if (req.user.role !== 'verifier') {
            return res.status(403).json({ error: 'Only verifiers can view verified shifts' });
        }

        const shifts = await Shift.findVerified();

        res.json({
            success: true,
            count: shifts.length,
            shifts
        });
    } catch (error) {
        console.error('Get verified shifts error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Get flagged shifts (for verifier)
export const getFlaggedShifts = async (req, res) => {
    try {
        if (req.user.role !== 'verifier') {
            return res.status(403).json({ error: 'Only verifiers can view flagged shifts' });
        }

        const shifts = await Shift.findFlagged();

        res.json({
            success: true,
            count: shifts.length,
            shifts
        });
    } catch (error) {
        console.error('Get flagged shifts error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};