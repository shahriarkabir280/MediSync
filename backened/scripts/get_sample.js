import { sql } from '../config/db.js';

async function getSample() {
    try {
        const doctors = await sql`SELECT * FROM doctors LIMIT 1`;
        console.log('Sample Doctor:', doctors);
    } catch (error) {
        console.error('Error getting sample:', error);
    } finally {
        process.exit();
    }
}

getSample();
