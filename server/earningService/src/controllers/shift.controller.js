import Shift from '../models/shift.model.js';

// Create a new shift
export const createShift = async (req, res) => {
    try {
        // Only workers can create shifts
        if (req.user.role !== 'worker') {
            return res.status(403).json({ error: 'Only workers can log shifts' });
        }

        const { platform, shift_date, hours_worked, gross_earned, platform_deductions, net_received } = req.body;

        // Validate required fields
        if (!platform || !shift_date || !hours_worked || !gross_earned || !platform_deductions || !net_received) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        // Validate hours
        if (hours_worked <= 0 || hours_worked > 24) {
            return res.status(400).json({ error: 'Hours must be between 1 and 24' });
        }

        // Validate amounts
        if (gross_earned < 0 || platform_deductions < 0 || net_received < 0) {
            return res.status(400).json({ error: 'Amounts cannot be negative' });
        }

        // Validate net = gross - deductions (approximately)
        const calculatedNet = gross_earned - platform_deductions;
        if (Math.abs(calculatedNet - net_received) > 1) {
            return res.status(400).json({ error: 'Net amount should equal gross minus deductions' });
        }

        const shift = await Shift.create({
            user_id: req.user.id,
            platform,
            shift_date,
            hours_worked,
            gross_earned,
            platform_deductions,
            net_received
        });

        res.status(201).json({
            success: true,
            message: 'Shift logged successfully',
            shift
        });

    } catch (error) {
        console.error('Create shift error:', error);
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

// Get income summary
export const getIncomeSummary = async (req, res) => {
    try {
        if (req.user.role !== 'worker') {
            return res.status(403).json({ error: 'Only workers can view income summary' });
        }

        const { period = 'all' } = req.query; // week, month, year, all

        const summary = await Shift.getIncomeSummary(req.user.id, period);
        const platformBreakdown = await Shift.getPlatformBreakdown(req.user.id, period);

        res.json({
            success: true,
            period,
            summary: {
                total_gross: parseFloat(summary.total_gross),
                total_deductions: parseFloat(summary.total_deductions),
                total_net: parseFloat(summary.total_net),
                total_hours: parseFloat(summary.total_hours),
                total_shifts: parseInt(summary.total_shifts),
                avg_hourly_rate: parseFloat(summary.avg_hourly_rate)
            },
            platform_breakdown: platformBreakdown
        });

    } catch (error) {
        console.error('Income summary error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Get shifts by date range
// In earnings-service/src/controllers/shiftsController.js
export const getShiftsByDateRange = async (req, res) => {
    try {
        const { start_date, end_date } = req.query;
        
        // Validate dates
        if (!start_date || !end_date) {
            return res.status(400).json({ error: 'Start date and end date are required' });
        }
        
        // Database already sorts by shift_date ASC
        const shifts = await Shift.findByDateRange(req.user.id, start_date, end_date);
        
        res.json({
            success: true,
            shifts: shifts  // Already sorted by date from DB
        });
        
    } catch (error) {
        console.error('Date range error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
// Get pending shifts (for verifier)
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

// Verify a shift (for verifier)
export const verifyShift = async (req, res) => {
    try {
        if (req.user.role !== 'verifier') {
            return res.status(403).json({ error: 'Only verifiers can verify shifts' });
        }

        const { shift_id } = req.params;
        const { status, notes } = req.body;

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

        // Get existing shift
        const existingShift = await Shift.findById(shift_id);

        if (!existingShift) {
            return res.status(404).json({ error: 'Shift not found' });
        }

        // Check if user owns this shift
        if (existingShift.user_id !== req.user.id) {
            return res.status(403).json({ error: 'You can only update your own shifts' });
        }

        const updatedShift = await Shift.update(shift_id, {
            platform,
            shift_date,
            hours_worked,
            gross_earned,
            platform_deductions,
            net_received
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

        // Get existing shift
        const existingShift = await Shift.findById(shift_id);

        if (!existingShift) {
            return res.status(404).json({ error: 'Shift not found' });
        }

        // Check if user owns this shift
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