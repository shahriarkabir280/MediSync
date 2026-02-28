// Migration: Alter calendar_events columns to TIMESTAMPTZ to fix timezone shift issues
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY
);

async function fixTimezone() {
    console.log('🚀 Altering calendar_events columns to TIMESTAMPTZ...');

    const { error: rpcError } = await supabase.rpc('exec_sql', {
        sql_query: `
            ALTER TABLE calendar_events 
            ALTER COLUMN start_time TYPE TIMESTAMPTZ,
            ALTER COLUMN end_time TYPE TIMESTAMPTZ;
        `
    });

    if (rpcError) {
        if (rpcError.message.includes('exec_sql')) {
            console.error('❌ RPC exec_sql is not available in your Supabase project.');
            console.log('Please run this SQL manually in the Supabase Dashboard SQL Editor:');
            console.log('\n  ALTER TABLE calendar_events \n  ALTER COLUMN start_time TYPE TIMESTAMPTZ,\n  ALTER COLUMN end_time TYPE TIMESTAMPTZ;\n');
        } else {
            console.error('❌ Migration failed:', rpcError.message);
        }
        process.exit(1);
    }

    console.log('✅ Migration successful! start_time and end_time are now TIMESTAMPTZ.');
    process.exit(0);
}

fixTimezone();
