import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function clearMedicalRecords() {
    console.log('Clearing medical_records table...');
    const { error } = await supabase.from('medical_records').delete().neq('id', 0); // Delete all rows where id != 0

    if (error) {
        console.error(`Error clearing medical_records: ${error.message}`);
    } else {
        console.log('Successfully removed all records from medical_records.');
    }
}

clearMedicalRecords();
