import { query } from '../utils/db.js';

// Get city median for comparison
export const getCityMedian = async (req, res) => {
    try {
        const { city, platform } = req.query;

        if (!city || !platform) {
            return res.status(400).json({ error: 'City and platform are required' });
        }

        const result = await query(`
            SELECT PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY (net_received / hours_worked)) as median
            FROM shifts s
            JOIN users u ON s.user_id = u.id
            WHERE u.city = $1 
              AND s.platform = $2 
              AND s.verification_status = 'confirmed'
              AND s.hours_worked > 0
        `, [city, platform]);

        const median = result.rows[0]?.median || 0;

        res.json({
            success: true,
            city,
            platform,
            median_hourly_rate: Math.round(median * 100) / 100,
            currency: 'PKR'
        });

    } catch (error) {
        console.error('City median error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Get platform commission trends (for advocate)
export const getCommissionTrends = async (req, res) => {
    try {
        const { platform, days = 30 } = req.query;

        if (!platform) {
            return res.status(400).json({ error: 'Platform is required' });
        }

        const result = await query(`
            SELECT 
                DATE_TRUNC('day', shift_date) as day,
                AVG(platform_deductions / NULLIF(gross_earned, 0) * 100) as avg_commission_percentage,
                COUNT(*) as shift_count
            FROM shifts
            WHERE platform = $1 
              AND shift_date >= NOW() - INTERVAL '${days} days'
              AND verification_status = 'confirmed'
              AND gross_earned > 0
            GROUP BY DATE_TRUNC('day', shift_date)
            ORDER BY day DESC
        `, [platform]);

        res.json({
            success: true,
            platform,
            days,
            data: result.rows
        });

    } catch (error) {
        console.error('Commission trends error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};