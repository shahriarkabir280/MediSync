import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkLabTables() {
    console.log('Checking medical_records table:');
    const { data: records, error: err1 } = await supabase.from('medical_records').select('*').limit(1);
    console.log(err1 ? `Error: ${err1.message}` : (records.length ? 'Exists with data' : 'Exists, empty'));

    console.log('\nChecking lab_orders table:');
    const { data: orders, error: err2 } = await supabase.from('lab_orders').select('*').limit(1);
    console.log(err2 ? `Error: ${err2.message}` : (orders.length ? 'Exists with data' : 'Exists, empty'));

    console.log('\nChecking lab_tests table:');
    const { data: tests, error: err3 } = await supabase.from('lab_tests').select('*').limit(1);
    console.log(err3 ? `Error: ${err3.message}` : (tests.length ? 'Exists with data' : 'Exists, empty'));
    
    console.log('\nChecking doctors table:');
    const { data: docs, error: err4 } = await supabase.from('doctors').select('id, first_name').limit(5);
    console.log(docs);
}

checkLabTables();
