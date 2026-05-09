from ..utils.db import query

"""
User Model - All user-related database queries
"""

class UserModel:
    
    @staticmethod
    async def get_income_distribution():
        """Get income distribution by city"""
        sql = """
            WITH worker_totals AS (
                SELECT
                    COALESCE(NULLIF(u.city, ''), 'Unknown') AS city_zone,
                    s.user_id,
                    SUM(s.net_received) AS worker_earnings
                FROM shifts s
                JOIN users u ON u.id = s.user_id
                WHERE s.verification_status = 'confirmed'
                  AND s.shift_date >= CURRENT_DATE - INTERVAL '30 days'
                GROUP BY COALESCE(NULLIF(u.city, ''), 'Unknown'), s.user_id
            )
            SELECT
                city_zone,
                COUNT(*) AS worker_count,
                AVG(worker_earnings) AS avg_earnings,
                PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY worker_earnings) AS median_earnings,
                MIN(worker_earnings) AS min_earnings,
                MAX(worker_earnings) AS max_earnings,
                SUM(worker_earnings) AS total_earnings
            FROM worker_totals
            GROUP BY city_zone
            ORDER BY total_earnings DESC, city_zone ASC
        """
        return await query(sql)