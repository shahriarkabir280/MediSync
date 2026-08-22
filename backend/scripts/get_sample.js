import { sql } from '../config/db.js';

async function getSample() {
    try {
        const res = await sql`SELECT * FROM emails ORDER BY created_at DESC LIMIT 5`;
        console.log('Result rows:', JSON.stringify(res.rows, null, 2));
    } catch (error) {
        console.error('Error getting sample:', error);
    } finally {
        process.exit(0);
    }
}

getSample();
