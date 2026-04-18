import { query } from '../utils/db.js';
import bcrypt from 'bcryptjs';

const User = {
    async signUp({ email, password, fullName, role }) {
        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Insert user into database
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
    }
};

export default User;