import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: 'backened/.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    console.log('\n--- DOCTORS ---');
    const { data: doctors } = await supabase.from('doctors').select('id, unique_id, first_name, last_name, email');
    console.table(doctors);

    console.log('\n--- PATIENTS ---');
    const { data: patients } = await supabase.from('patients').select('id, unique_id, first_name, last_name, email');
    console.table(patients);

    console.log('\n--- CHAT PARTICIPANTS ---');
    const { data: participants } = await supabase.from('chat_participants').select('chat_id, user_id, user_type, user_name');
    console.table(participants);
}

check();
