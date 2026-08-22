import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const { SUPABASE_URL, SUPABASE_KEY } = process.env;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const checkTables = async () => {
    console.log('--- Database Table Check ---');
    const tables = ['wallets', 'wallet_transactions', 'revenue_split_rules', 'withdrawal_requests'];
    
    for (const table of tables) {
        process.stdout.write(`Checking ${table}... `);
        const { data, error } = await supabase.from(table).select('*').limit(1);
        
        if (error) {
            if (error.code === 'PGRST116' || error.message.includes('not find')) {
                console.log('❌ MISSING');
            } else {
                console.log(`⚠️ ERROR: ${error.message} (${error.code})`);
            }
        } else {
            console.log('✅ EXISTS');
        }
    }
};

checkTables();
