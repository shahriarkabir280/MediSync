import { supabase } from '../config/db.js';

async function fixPrescriptionFileTypes() {
    console.log('🔍 Scanning medical_records for mistagged prescription files...\n');

    // Fetch all records that are NOT already tagged as prescription
    const { data: records, error } = await supabase
        .from('medical_records')
        .select('id, file_name, file_type, original_name')
        .neq('file_type', 'prescription');

    if (error) {
        console.error('❌ Failed to fetch records:', error.message);
        process.exit(1);
    }

    // Identify prescription files by filename pattern: contains "prescription_"
    // (multer prefixes a timestamp, e.g. "1773426493441-prescription_45_...")
    const toUpdate = records.filter(r =>
        r.file_name && r.file_name.includes('prescription_')
    );

    if (toUpdate.length === 0) {
        console.log('✅ No mistagged prescription records found. Nothing to update.');
        return;
    }

    console.log(`📋 Found ${toUpdate.length} prescription record(s) to fix:\n`);
    toUpdate.forEach(r => {
        console.log(`  • id=${r.id}  file_name="${r.file_name}"  current file_type="${r.file_type}"`);
    });

    const ids = toUpdate.map(r => r.id);

    const { error: updateError } = await supabase
        .from('medical_records')
        .update({ file_type: 'prescription' })
        .in('id', ids);

    if (updateError) {
        console.error('\n❌ Update failed:', updateError.message);
        process.exit(1);
    }

    console.log(`\n✅ Successfully updated ${toUpdate.length} record(s) to file_type='prescription'.`);
}

fixPrescriptionFileTypes().catch(err => {
    console.error('Unexpected error:', err);
    process.exit(1);
});
