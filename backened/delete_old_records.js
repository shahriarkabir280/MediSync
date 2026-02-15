import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: 'backened/.env' });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function cleanup() {
    console.log('🧹 Starting Database Cleanup of Legacy IDs (00x sequence)...');

    const oldDocIds = ['DOC-001', 'DOC-002'];
    const oldPatIds = ['PAT-001', 'PAT-002', 'PAT-003'];

    try {
        // 1. Cleanup dependent chat data (just in case any escaped the previous unification)
        console.log('Cleaning up chat dependents...');
        await supabase.from('chat_participants').delete().in('user_id', [...oldDocIds, ...oldPatIds]);
        await supabase.from('message_status').delete().in('user_id', [...oldDocIds, ...oldPatIds]);
        await supabase.from('messages').delete().in('sender_id', [...oldDocIds, ...oldPatIds]);

        // 2. Cleanup Appointments and related medical records
        // Note: This project often uses the serial ID for appointments, let's find them.
        console.log('Cleaning up appointments and professional records...');

        // Deleting by unique_id is safer if the schema uses it, 
        // but many tables use doctor_id/patient_id (serial).
        // Let's get the serial IDs first.
        const { data: legacyDocs } = await supabase.from('doctors').select('id').in('unique_id', oldDocIds);
        const { data: legacyPats } = await supabase.from('patients').select('id').in('unique_id', oldPatIds);

        const docSerialIds = legacyDocs?.map(d => d.id) || [];
        const patSerialIds = legacyPats?.map(p => p.id) || [];

        if (docSerialIds.length > 0) {
            await supabase.from('appointments').delete().in('doctor_id', docSerialIds);
            await supabase.from('medical_records').delete().in('doctor_id', docSerialIds);
            await supabase.from('billing').delete().in('doctor_id', docSerialIds);
        }

        if (patSerialIds.length > 0) {
            await supabase.from('appointments').delete().in('patient_id', patSerialIds);
            await supabase.from('medical_records').delete().in('patient_id', patSerialIds);
        }

        // 3. Finally delete the users themselves
        console.log('Deleting legacy doctors and patients...');
        const { error: dErr } = await supabase.from('doctors').delete().in('unique_id', oldDocIds);
        if (dErr) throw dErr;

        const { error: pErr } = await supabase.from('patients').delete().in('unique_id', oldPatIds);
        if (pErr) throw pErr;

        console.log('✅ Cleanup successful! Old 00x IDs have been removed.');
    } catch (error) {
        console.error('❌ Cleanup failed:', error);
    }
}

cleanup();
