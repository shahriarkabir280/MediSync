import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_KEY
);

async function checkEvents() {
    console.log('🔍 Checking latest events in database...');

    // 1. Get Doctors
    const { data: doctors, error: docError } = await supabase
        .from('doctors')
        .select('id, email, first_name');

    if (docError) {
        console.error('Error fetching doctors:', docError.message);
        process.exit(1);
    }

    const doctor = doctors.find(d => d.email === 'john.doe@careconnect.com' || d.email === 'john.doe@cc.com');

    if (!doctor) {
        console.error('Doctor not found. Available doctors:', doctors.map(d => d.email).join(', '));
        process.exit(1);
    }

    console.log(`\nFound doctor: ${doctor.first_name} (ID: ${doctor.id}, Email: ${doctor.email})`);

    // 2. Fetch latest calendar events
    const { data: events, error: eventError } = await supabase
        .from('calendar_events')
        .select('*')
        .eq('doctor_id', doctor.id)
        .order('created_at', { ascending: false })
        .limit(10);

    if (eventError) {
        console.error('Error fetching events:', eventError.message);
        process.exit(1);
    }

    console.log('\n--- Latest 10 Events ---');
    events.forEach(ev => {
        console.log(`ID: ${ev.id}`);
        console.log(`Title: ${ev.title}`);
        console.log(`Start Time (Raw DB): ${ev.start_time}`);
        console.log(`Start Time (Parsed): ${new Date(ev.start_time).toLocaleString()}`);
        console.log(`Created At: ${ev.created_at}`);
        console.log(`------------------------`);
    });

    process.exit(0);
}

checkEvents();
