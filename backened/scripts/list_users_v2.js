import { sql } from '../config/db.js';

async function listUsers() {
    try {
        const doctors = await sql`SELECT first_name, last_name, email FROM doctors LIMIT 5`;
        const patients = await sql`SELECT first_name, last_name, email FROM patients LIMIT 5`;
        console.log('Doctors:', doctors);
        console.log('Patients:', patients);
    } catch (error) {
        console.error('Error listing users:', error);
    } finally {
        process.exit();
    }
}

listUsers();
