// Migration: Add description and location columns to calendar_events
// Uses Supabase JS client since direct pg connection is blocked.
// Run: node scripts/migrate_calendar.js

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

// Use service_role key so we can run DDL via rpc
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY
);

async function migrate() {
    console.log('Running calendar_events migration via Supabase...');

    // Try to insert a test row with the new columns to check if they exist.
    // If they don't, we need to create them via Supabase SQL editor or rpc.
    const { data: cols, error: colError } = await supabase
        .from('calendar_events')
        .select('description, location')
        .limit(1);

    if (!colError) {
        console.log('✅ Columns description and location already exist in calendar_events.');
        process.exit(0);
    }

    console.log('Columns are missing. Attempting migration via rpc exec_sql...');
    console.log('NOTE: If this fails, please run the following SQL in the Supabase Dashboard SQL editor:');
    console.log('');
    console.log('  ALTER TABLE calendar_events');
    console.log('  ADD COLUMN IF NOT EXISTS description TEXT,');
    console.log('  ADD COLUMN IF NOT EXISTS location VARCHAR(500);');
    console.log('');

    // Attempt via rpc if exec_sql exists
    const { error: rpcError } = await supabase.rpc('exec_sql', {
        sql_query: `
            ALTER TABLE calendar_events
            ADD COLUMN IF NOT EXISTS description TEXT,
            ADD COLUMN IF NOT EXISTS location VARCHAR(500);
        `
    });

    if (rpcError) {
        console.error('RPC migration failed (exec_sql not available):', rpcError.message);
        console.error('Please run the SQL above manually in the Supabase Dashboard SQL editor.');
        process.exit(1);
    }

    console.log('✅ Migration successful via rpc.');
}

migrate();
