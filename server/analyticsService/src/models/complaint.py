from ..utils.db import query, query_row

"""
Complaint Model - All complaint-related database queries (READ ONLY)
Analytics service only reads complaints, never writes
"""

class ComplaintModel:
    
    @staticmethod
    async def get_top_complaints():
        """Get top complaint categories this week"""
        sql = """
            SELECT
                COALESCE(NULLIF(category, ''), 'Uncategorized') AS category,
                COUNT(*) AS count,
                ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 1) AS percentage
            FROM complaints
            WHERE created_at >= NOW() - INTERVAL '7 days'
            GROUP BY COALESCE(NULLIF(category, ''), 'Uncategorized')
            ORDER BY count DESC
            LIMIT 5
        """
        return await query(sql)
    
    @staticmethod
    async def get_complaint_platforms():
        """Get complaints grouped by platform"""
        sql = """
            SELECT
                COALESCE(NULLIF(platform, ''), 'Unknown') AS platform,
                COUNT(*) AS count
            FROM complaints
            WHERE created_at >= NOW() - INTERVAL '7 days'
            GROUP BY COALESCE(NULLIF(platform, ''), 'Unknown')
            ORDER BY count DESC
            LIMIT 5
        """
        return await query(sql)
    
    @staticmethod
    async def get_systemic_issues():
        """Get systemic issues (platform + category combinations)"""
        sql = """
            SELECT
                COALESCE(NULLIF(platform, ''), 'Unknown') AS platform,
                COALESCE(NULLIF(category, ''), 'Uncategorized') AS category,
                COUNT(*) AS complaint_count,
                COUNT(*) FILTER (WHERE status = 'escalated') AS escalated_count,
                COUNT(*) FILTER (WHERE status != 'resolved') AS unresolved_count
            FROM complaints
            WHERE created_at >= NOW() - INTERVAL '7 days'
            GROUP BY COALESCE(NULLIF(platform, ''), 'Unknown'), COALESCE(NULLIF(category, ''), 'Uncategorized')
            ORDER BY complaint_count DESC, unresolved_count DESC
            LIMIT 6
        """
        return await query(sql)
    
    @staticmethod
    async def get_grievance_board(status=None, platform=None, search=None, page=1, limit=12):
        """Get complaints for moderation queue"""
        filters = ["1=1"]
        params = []
        param_index = 1

        if status:
            filters.append(f"c.status = ${param_index}")
            params.append(status)
            param_index += 1

        if platform:
            filters.append(f"c.platform = ${param_index}")
            params.append(platform)
            param_index += 1

        if search:
            filters.append(f"(c.title ILIKE ${param_index} OR c.description ILIKE ${param_index})")
            params.append(f"%{search}%")
            param_index += 1

        where_clause = " AND ".join(filters)
        offset = (page - 1) * limit

        sql = f"""
            SELECT
                c.id,
                c.user_id,
                c.platform,
                c.category,
                c.title,
                c.description,
                c.tags,
                c.cluster_id,
                c.upvotes,
                c.status,
                c.created_at,
                c.updated_at,
                u.name AS worker_name,
                COALESCE(NULLIF(u.city, ''), 'Unknown') AS city
            FROM complaints c
            LEFT JOIN users u ON u.id = c.user_id
            WHERE {where_clause}
            ORDER BY
                CASE WHEN c.status = 'escalated' THEN 0 ELSE 1 END,
                c.upvotes DESC,
                c.created_at DESC
            LIMIT ${param_index} OFFSET ${param_index + 1}
        """
        
        params.extend([limit, offset])
        return await query(sql, *params)
    
    @staticmethod
    async def get_complaints_count(status=None, platform=None, search=None):
        """Get total count for pagination"""
        filters = ["1=1"]
        params = []

        if status:
            filters.append(f"status = ${len(params) + 1}")
            params.append(status)

        if platform:
            filters.append(f"platform = ${len(params) + 1}")
            params.append(platform)

        if search:
            filters.append(f"(title ILIKE ${len(params) + 1} OR description ILIKE ${len(params) + 1})")
            params.append(f"%{search}%")

        where_clause = " AND ".join(filters)
        sql = f"SELECT COUNT(*) as total FROM complaints WHERE {where_clause}"
        
        result = await query_row(sql, *params)
        return result["total"] if result else 0
    
    @staticmethod
    async def update_complaint(complaint_id, status=None, tags=None, cluster_id=None):
        """Update complaint (status, tags, cluster)"""
        sql = """
            UPDATE complaints
            SET
                status = COALESCE($1, status),
                tags = COALESCE($2, tags),
                cluster_id = COALESCE($3, cluster_id),
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $4
            RETURNING *
        """
        return await query_row(sql, status, tags, cluster_id, complaint_id)
    
    @staticmethod
    async def get_complaint_stats():
        """Get complaint statistics"""
        sql = """
            SELECT
                COUNT(*) FILTER (WHERE status = 'pending') AS pending_count,
                COUNT(*) FILTER (WHERE status = 'escalated') AS escalated_count,
                COUNT(*) FILTER (WHERE status = 'resolved') AS resolved_count,
                COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days') AS complaints_this_week,
                COUNT(*) FILTER (WHERE status IN ('pending', 'escalated')) AS open_complaints
            FROM complaints
        """
        return await query_row(sql)