// src/models/shift.model.js
import { query } from '../utils/db.js';

const Shift = {
    // Create a new shift
    async create(data) {
        const result = await query(
            `INSERT INTO shifts (user_id, platform, shift_date, hours_worked, gross_earned, platform_deductions, net_received)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             RETURNING id, user_id, platform, shift_date, hours_worked, gross_earned, platform_deductions, net_received, verification_status, created_at`,
            [data.user_id, data.platform, data.shift_date, data.hours_worked, data.gross_earned, data.platform_deductions, data.net_received]
        );
        return result.rows[0];
    },

    // ✅ NEW: Update screenshot (base64)
    async updateScreenshot(id, screenshotBase64) {
        const result = await query(
            `UPDATE shifts SET screenshot_url = $1 WHERE id = $2 RETURNING *`,
            [screenshotBase64, id]
        );
        return result.rows[0];
    },

    // Get all shifts for a user
    async findByUserId(userId) {
        const result = await query(
            `SELECT id, user_id, platform, shift_date, hours_worked, gross_earned, 
                platform_deductions, net_received, verification_status, created_at, screenshot_url
             FROM shifts 
             WHERE user_id = $1
             ORDER BY shift_date DESC`,
            [userId]
        );
        return result.rows;
    },

    // Get shifts by date range
    async findByDateRange(userId, startDate, endDate) {
        const result = await query(
            `SELECT id, user_id, platform, shift_date, hours_worked, gross_earned, 
                platform_deductions, net_received, verification_status, created_at, screenshot_url
             FROM shifts 
             WHERE user_id = $1 AND shift_date BETWEEN $2 AND $3
             ORDER BY shift_date ASC`,
            [userId, startDate, endDate]
        );
        return result.rows;
    },

    // Get income summary
    async getIncomeSummary(userId, period = 'all') {
        let dateFilter = '';
        if (period === 'week') {
            dateFilter = "AND shift_date >= NOW() - INTERVAL '7 days'";
        } else if (period === 'month') {
            dateFilter = "AND shift_date >= NOW() - INTERVAL '30 days'";
        } else if (period === 'year') {
            dateFilter = "AND shift_date >= NOW() - INTERVAL '365 days'";
        }

        const result = await query(`
            SELECT 
                COALESCE(SUM(gross_earned), 0) as total_gross,
                COALESCE(SUM(platform_deductions), 0) as total_deductions,
                COALESCE(SUM(net_received), 0) as total_net,
                COALESCE(SUM(hours_worked), 0) as total_hours,
                COUNT(*) as total_shifts,
                ROUND(AVG(net_received / NULLIF(hours_worked, 0)), 2) as avg_hourly_rate
            FROM shifts 
            WHERE user_id = $1 ${dateFilter}
        `, [userId]);

        return result.rows[0];
    },

    // Get platform breakdown
    async getPlatformBreakdown(userId, period = 'all') {
        let dateFilter = '';
        if (period === 'week') {
            dateFilter = "AND shift_date >= NOW() - INTERVAL '7 days'";
        } else if (period === 'month') {
            dateFilter = "AND shift_date >= NOW() - INTERVAL '30 days'";
        } else if (period === 'year') {
            dateFilter = "AND shift_date >= NOW() - INTERVAL '365 days'";
        }

        const result = await query(`
            SELECT 
                platform,
                COUNT(*) as shifts,
                SUM(hours_worked) as total_hours,
                SUM(gross_earned) as total_gross,
                SUM(platform_deductions) as total_deductions,
                SUM(net_received) as total_net,
                ROUND(AVG(net_received / NULLIF(hours_worked, 0)), 2) as avg_hourly_rate
            FROM shifts 
            WHERE user_id = $1 ${dateFilter}
            GROUP BY platform
            ORDER BY total_net DESC
        `, [userId]);

        return result.rows;
    },

    // Get pending shifts for verifier
    async findPending() {
        const result = await query(`
            SELECT s.*, u.name as worker_name, u.email as worker_email
            FROM shifts s
            JOIN users u ON s.user_id = u.id
            WHERE s.verification_status = 'pending'
            ORDER BY s.created_at ASC
        `);
        return result.rows;
    },

    // ✅ NEW: Get verified shifts (confirmed)
    async findVerified() {
        const result = await query(`
            SELECT s.*, u.name as worker_name, u.email as worker_email
            FROM shifts s
            JOIN users u ON s.user_id = u.id
            WHERE s.verification_status = 'confirmed'
            ORDER BY s.updated_at DESC
        `);
        return result.rows;
    },

    // ✅ NEW: Get flagged shifts (discrepancy or unverifiable)
    async findFlagged() {
        const result = await query(`
            SELECT s.*, u.name as worker_name, u.email as worker_email
            FROM shifts s
            JOIN users u ON s.user_id = u.id
            WHERE s.verification_status IN ('discrepancy', 'unverifiable')
            ORDER BY s.updated_at DESC
        `);
        return result.rows;
    },

    // Update verification status
    async updateVerification(id, status) {
        const result = await query(
            `UPDATE shifts SET verification_status = $1, updated_at = CURRENT_TIMESTAMP 
             WHERE id = $2 
             RETURNING *`,
            [status, id]
        );
        return result.rows[0];
    },

    // Get shift by ID
    async findById(id) {
        const result = await query(
            `SELECT * FROM shifts WHERE id = $1`,
            [id]
        );
        return result.rows[0];
    },

    // Update shift
    async update(id, data) {
        const result = await query(
            `UPDATE shifts 
             SET platform = $1, shift_date = $2, hours_worked = $3, 
                 gross_earned = $4, platform_deductions = $5, net_received = $6,
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = $7 
             RETURNING *`,
            [data.platform, data.shift_date, data.hours_worked,
            data.gross_earned, data.platform_deductions, data.net_received, id]
        );
        return result.rows[0];
    },

    // Delete shift
    async delete(id) {
        const result = await query(
            `DELETE FROM shifts WHERE id = $1 RETURNING id`,
            [id]
        );
        return result.rows[0];
    }
};

export default Shift;