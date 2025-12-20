import { sql } from '../config/db.js';

async function checkEmails() {
    try {
        console.log('Fetching emails...');
        const emails = await sql`SELECT * FROM emails ORDER BY created_at DESC LIMIT 10`;
        console.log(`Found ${emails.length} emails:`);
        console.dir(emails, { depth: null });

        // Also check doctors to see IDs
        const doctors = await sql`SELECT id, email, first_name, last_name FROM doctors LIMIT 5`;
        console.log('\nDoctors:');
        console.dir(doctors, { depth: null });

    } catch (error) {
        console.error('Error fetching data:', error);
    }
}

checkEmails();
