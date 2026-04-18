import { query } from '../utils/db.js';
import bcrypt from 'bcryptjs';

const User = {
    async signUp({ email, password, fullName, role }) {
        const hashedPassword = await bcrypt.hash(password, 10);
        
        const result = await query(
            `INSERT INTO users (email, password, name, role) 
             VALUES ($1, $2, $3, $4) 
             RETURNING id, email, name, role, created_at`,
            [email.toLowerCase(), hashedPassword, fullName, role || 'worker']
        );
        
        return result.rows[0];
    },
    
    async findByEmail(email) {
        const result = await query(
            `SELECT * FROM users WHERE email = $1`,
            [email.toLowerCase()]
        );
        return result.rows[0];
    },
    
    async findById(id) {
        const result = await query(
            `SELECT id, email, name, role, city, created_at FROM users WHERE id = $1`,
            [id]
        );
        return result.rows[0];
    },
    
    async login({ email, password }) {
        const user = await this.findByEmail(email);
        
        if (!user) return null;
        
        const isValid = await bcrypt.compare(password, user.password);
        
        if (!isValid) return null;
        
        const { password: _, ...userWithoutPassword } = user;
        return userWithoutPassword;
    },
    
    // ✅ Store refresh token in users table (NO separate table!)
    async storeRefreshToken(userId, refreshToken) {
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7); // 7 days
        
        await query(
            `UPDATE users 
             SET refresh_token = $1, refresh_token_expires_at = $2 
             WHERE id = $3`,
            [refreshToken, expiresAt, userId]
        );
    },
    
    // ✅ Verify refresh token from users table
    async verifyRefreshToken(userId, refreshToken) {
        const result = await query(
            `SELECT * FROM users 
             WHERE id = $1 AND refresh_token = $2 AND refresh_token_expires_at > NOW()`,
            [userId, refreshToken]
        );
        return result.rows.length > 0;
    },
    
    // ✅ Clear refresh token on logout
    async revokeRefreshToken(refreshToken) {
        await query(
            `UPDATE users SET refresh_token = NULL, refresh_token_expires_at = NULL 
             WHERE refresh_token = $1`,
            [refreshToken]
        );
    }
};

export default User;