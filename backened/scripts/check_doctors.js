import { sql } from '../config/db.js';

async function checkDoctors() {
    try {
        const doctors = await sql`SELECT email, full_name FROM doctors LIMIT 10`;
        console.log('Doctors in DB:', doctors);
    } catch (error) {
        console.error('Error checking doctors:', error);
    } finally {
        process.exit();
    }
}

checkDoctors();
