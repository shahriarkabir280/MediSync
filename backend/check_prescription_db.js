import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    console.log('Checking prescriptions table...');
    const { data: pData, error: pError } = await supabase.from('prescriptions').select('*').limit(1);
    if (pError) {
        console.error('Error fetching prescriptions:', pError);
    } else {
        console.log('Prescriptions table exists. Data:', pData);
    }

    console.log('Checking prescription_items table...');
    const { data: piData, error: piError } = await supabase.from('prescription_items').select('*').limit(1);
    if (piError) {
        console.error('Error fetching prescription_items:', piError);
    } else {
        console.log('Prescription_items table exists. Data:', piData);
    }
}

check();
