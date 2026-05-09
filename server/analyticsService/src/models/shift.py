from ..utils.db import query, query_row

"""
Shift Model - All shift-related database queries
Similar to: const getCommissionTrends = async () => { ... }
"""

class ShiftModel:
    
    @staticmethod
    async def get_commission_trends():
        """Get commission trends for last 3 months"""
        sql = """
            WITH weekly AS (
                SELECT
                    platform,
                    date_trunc('week', shift_date)::date AS week_start,
                    AVG(platform_deductions / NULLIF(gross_earned, 0) * 100) AS avg_commission
                FROM shifts
                WHERE verification_status = 'confirmed'
                  AND gross_earned > 0
                  AND shift_date >= CURRENT_DATE - INTERVAL '84 days'
                GROUP BY platform, date_trunc('week', shift_date)::date
            )
            SELECT platform, week_start, avg_commission
            FROM weekly
            ORDER BY week_start ASC, platform ASC
        """
        return await query(sql)
    
    @staticmethod
    async def get_vulnerable_workers(limit: int = 20):
        """Get workers with >20% income drop"""
        sql = """
            WITH current_period AS (
                SELECT
                    user_id,
                    SUM(net_received) AS current_earnings,
                    COUNT(*) AS current_shift_count
                FROM shifts
                WHERE verification_status = 'confirmed'
                  AND shift_date >= CURRENT_DATE - INTERVAL '30 days'
                GROUP BY user_id
            ),
            previous_period AS (
                SELECT
                    user_id,
                    SUM(net_received) AS previous_earnings,
                    COUNT(*) AS previous_shift_count
                FROM shifts
                WHERE verification_status = 'confirmed'
                  AND shift_date >= CURRENT_DATE - INTERVAL '60 days'
                  AND shift_date < CURRENT_DATE - INTERVAL '30 days'
                GROUP BY user_id
            )
            SELECT
                u.id AS user_id,
                u.name,
                COALESCE(NULLIF(u.city, ''), 'Unknown') AS city,
                COALESCE(c.current_earnings, 0) AS current_earnings,
                COALESCE(p.previous_earnings, 0) AS previous_earnings,
                COALESCE(c.current_shift_count, 0) AS current_shift_count,
                COALESCE(p.previous_shift_count, 0) AS previous_shift_count
            FROM users u
            JOIN previous_period p ON p.user_id = u.id
            LEFT JOIN current_period c ON c.user_id = u.id
            WHERE u.role = 'worker'
              AND COALESCE(p.previous_earnings, 0) > 0
              AND ((p.previous_earnings - COALESCE(c.current_earnings, 0)) / p.previous_earnings) > 0.20
            ORDER BY ((p.previous_earnings - COALESCE(c.current_earnings, 0)) / p.previous_earnings) DESC
            LIMIT $1
        """
        return await query(sql, limit)
    
    @staticmethod
    async def get_overview_stats():
        """Get overview statistics"""
        sql = """
            WITH vulnerable AS (
                WITH current_period AS (
                    SELECT user_id, SUM(net_received) AS current_earnings
                    FROM shifts
                    WHERE verification_status = 'confirmed'
                      AND shift_date >= CURRENT_DATE - INTERVAL '30 days'
                    GROUP BY user_id
                ),
                previous_period AS (
                    SELECT user_id, SUM(net_received) AS previous_earnings
                    FROM shifts
                    WHERE verification_status = 'confirmed'
                      AND shift_date >= CURRENT_DATE - INTERVAL '60 days'
                      AND shift_date < CURRENT_DATE - INTERVAL '30 days'
                    GROUP BY user_id
                )
                SELECT COUNT(*) AS vulnerable_count
                FROM previous_period p
                LEFT JOIN current_period c ON c.user_id = p.user_id
                WHERE COALESCE(p.previous_earnings, 0) > 0
                  AND ((p.previous_earnings - COALESCE(c.current_earnings, 0)) / p.previous_earnings) > 0.20
            ),
            commissions AS (
                SELECT AVG(platform_deductions / NULLIF(gross_earned, 0) * 100) AS avg_commission
                FROM shifts
                WHERE verification_status = 'confirmed'
                  AND gross_earned > 0
                  AND shift_date >= CURRENT_DATE - INTERVAL '7 days'
            )
            SELECT
                (SELECT vulnerable_count FROM vulnerable) AS vulnerable_workers,
                (SELECT avg_commission FROM commissions) AS avg_commission
        """
        return await query_row(sql)
    
    @staticmethod
    async def get_rising_platforms():
        """Get platforms with rising commissions"""
        sql = """
            WITH weekly AS (
                SELECT
                    platform,
                    date_trunc('week', shift_date)::date AS week_start,
                    AVG(platform_deductions / NULLIF(gross_earned, 0) * 100) AS avg_commission
                FROM shifts
                WHERE verification_status = 'confirmed'
                  AND gross_earned > 0
                  AND shift_date >= CURRENT_DATE - INTERVAL '56 days'
                GROUP BY platform, date_trunc('week', shift_date)::date
            )
            SELECT
                platform,
                AVG(avg_commission) FILTER (WHERE week_start >= CURRENT_DATE - INTERVAL '28 days') AS recent_avg,
                AVG(avg_commission) FILTER (
                    WHERE week_start < CURRENT_DATE - INTERVAL '28 days'
                      AND week_start >= CURRENT_DATE - INTERVAL '56 days'
                ) AS previous_avg
            FROM weekly
            GROUP BY platform
        """
        return await query(sql)