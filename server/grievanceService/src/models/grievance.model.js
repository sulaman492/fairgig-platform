import { query } from '../utils/db.js';

const Complaint = {
    // Create a new complaint
    async create(data) {
        const result = await query(
            `INSERT INTO complaints (user_id, platform, category, title, description, tags)
             VALUES ($1, $2, $3, $4, $5, $6)
             RETURNING *`,
            [data.user_id, data.platform, data.category, data.title, data.description, data.tags || []]
        );
        return result.rows[0];
    },

    // Get all complaints (for advocates)
    // Update findAll method in Complaint object
    async findAll(filters = {}, page = 1, limit = 20) {
        const offset = (page - 1) * limit;
        let queryText = `SELECT c.* FROM complaints c WHERE 1=1`;
        let countText = `SELECT COUNT(*) as total FROM complaints c WHERE 1=1`;
        let params = [];
        let paramIndex = 1;

        // Add filters
        if (filters.status) {
            queryText += ` AND c.status = $${paramIndex}`;
            countText += ` AND c.status = $${paramIndex}`;
            params.push(filters.status);
            paramIndex++;
        }
        if (filters.platform) {
            queryText += ` AND c.platform = $${paramIndex}`;
            countText += ` AND c.platform = $${paramIndex}`;
            params.push(filters.platform);
            paramIndex++;
        }

        // Add sorting and pagination
        queryText += ` ORDER BY c.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
        params.push(limit, offset);

        // Execute queries
        const result = await query(queryText, params);
        const countResult = await query(countText, params.slice(0, paramIndex - 1));

        const total = parseInt(countResult.rows[0].total);
        const totalPages = Math.ceil(total / limit);

        return {
            data: result.rows,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: total,
                totalPages: totalPages,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1
            }
        };
    },

    // Add pagination to findByUserId
    async findByUserId(userId, page = 1, limit = 20) {
        const offset = (page - 1) * limit;

        const result = await query(
            `SELECT * FROM complaints 
         WHERE user_id = $1 
         ORDER BY created_at DESC 
         LIMIT $2 OFFSET $3`,
            [userId, limit, offset]
        );

        const countResult = await query(
            `SELECT COUNT(*) as total FROM complaints WHERE user_id = $1`,
            [userId]
        );

        const total = parseInt(countResult.rows[0].total);
        const totalPages = Math.ceil(total / limit);

        return {
            data: result.rows,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: total,
                totalPages: totalPages,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1
            }
        };
    },

    // Update complaint (advocate only)
    async update(id, data) {
        const result = await query(
            `UPDATE complaints 
             SET status = COALESCE($1, status),
                 tags = COALESCE($2, tags),
                 cluster_id = COALESCE($3, cluster_id),
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = $4
             RETURNING *`,
            [data.status, data.tags, data.cluster_id, id]
        );
        return result.rows[0];
    },

    // Delete complaint
    async delete(id) {
        await query(`DELETE FROM complaints WHERE id = $1`, [id]);
    },

    // Upvote complaint
    async upvote(id) {
        const result = await query(
            `UPDATE complaints SET upvotes = upvotes + 1 WHERE id = $1 RETURNING *`,
            [id]
        );
        return result.rows[0];
    },

    // Get trending complaints (last 7 days)
    async getTrending(limit = 5) {
        const result = await query(`
            SELECT category, COUNT(*) as count 
            FROM complaints 
            WHERE created_at >= NOW() - INTERVAL '7 days'
            GROUP BY category 
            ORDER BY count DESC 
            LIMIT $1
        `, [limit]);
        return result.rows;
    },
    // Add to Complaint object
    async getCommunityBulletin(page = 1, limit = 20) {
        const offset = (page - 1) * limit;

        const result = await query(`
        SELECT id, platform, category, title, description, 
               upvotes, status, created_at,
               'Anonymous' as user_name,
               NULL as user_id
        FROM complaints 
        WHERE status != 'deleted'
        ORDER BY upvotes DESC, created_at DESC
        LIMIT $1 OFFSET $2
    `, [limit, offset]);

        const countResult = await query(`
        SELECT COUNT(*) as total FROM complaints WHERE status != 'deleted'
    `);

        const total = parseInt(countResult.rows[0].total);
        const totalPages = Math.ceil(total / limit);

        return {
            data: result.rows,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: total,
                totalPages: totalPages,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1
            }
        };
    },
    async findById(id) {
        const result = await query(
            `SELECT * FROM complaints WHERE id = $1`,
            [id]
        );
        return result.rows[0];
    },
};


export default Complaint;