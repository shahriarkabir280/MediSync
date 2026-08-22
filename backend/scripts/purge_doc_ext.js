
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env from backened dir
dotenv.config({ path: path.join(__dirname, '../.env') });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function purgeDocExt() {
    console.log('🧹 Purging legacy DOC-EXT sequence records...');

    try {
        // 1. Identify all DOC-EXT unique_ids
        const { data: extDocs, error: fetchErr } = await supabase
            .from('doctors')
            .select('id, unique_id')
            .ilike('unique_id', 'DOC-EXT-%');

        if (fetchErr) throw fetchErr;

        if (!extDocs || extDocs.length === 0) {
            console.log('✅ No records found in DOC-EXT sequence. Skipping purge.');
            return;
        }

        const docSerialIds = extDocs.map(d => d.id);
        const docUniqueIds = extDocs.map(d => d.unique_id);

        console.log(`Found ${extDocs.length} DOC-EXT records to remove: ${docUniqueIds.join(', ')}`);

        // 2. Clean up Chat Data
        console.log('Cleaning up chat participants, message status, and messages...');
        await supabase.from('chat_participants').delete().in('user_id', docUniqueIds);
        await supabase.from('message_status').delete().in('user_id', docUniqueIds);
        await supabase.from('messages').delete().in('sender_id', docUniqueIds);

        // 3. Clean up Professional Records (Appointments, Billing, Medical Records)
        console.log('Cleaning up professional records (appointments, billing, etc)...');
        await supabase.from('appointments').delete().in('doctor_id', docSerialIds);
        await supabase.from('medical_records').delete().in('doctor_id', docSerialIds);
        await supabase.from('billing').delete().in('doctor_id', docSerialIds);
        await supabase.from('notifications').delete().in('doctor_id', docSerialIds);
        await supabase.from('blog_posts').delete().in('doctor_id', docSerialIds);
        await supabase.from('website_settings').delete().in('doctor_id', docSerialIds);
        await supabase.from('doctor_settings').delete().in('doctor_id', docSerialIds);
        await supabase.from('emails').delete().in('sender_id', docSerialIds);
        await supabase.from('calendar_events').delete().in('doctor_id', docSerialIds);

        // 4. Finally delete the doctors themselves
        console.log('Deleting legacy doctor records...');
        const { error: deleteErr } = await supabase
            .from('doctors')
            .delete()
            .in('id', docSerialIds);

        if (deleteErr) throw deleteErr;

        console.log('✅ DOC-EXT sequence successfully purged!');
    } catch (error) {
        console.error('❌ Purge failed:', error);
    }
}

purgeDocExt();
