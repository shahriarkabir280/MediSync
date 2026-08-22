import { supabase } from '../config/db.js';

/**
 * Migration script to fix patient IDs with invalid formats
 * This will update all "PAT-EXT-XXX" and other invalid formats to "PAT-XXX"
 */

async function fixPatientIds() {
    console.log('🔧 Starting patient ID migration...\n');

    try {
        // Get all patients
        const { data: patients, error: fetchError } = await supabase
            .from('patients')
            .select('id, unique_id, first_name, last_name')
            .order('id', { ascending: true });

        if (fetchError) {
            console.error('❌ Error fetching patients:', fetchError);
            return;
        }

        if (!patients || patients.length === 0) {
            console.log('ℹ️  No patients found in database.');
            return;
        }

        console.log(`📊 Found ${patients.length} patients\n`);

        // Identify patients with invalid IDs
        const validPattern = /^PAT-\d{3}$/;
        const invalidPatients = patients.filter(p => !p.unique_id || !validPattern.test(p.unique_id));

        if (invalidPatients.length === 0) {
            console.log('✅ All patient IDs are already in correct format!');
            return;
        }

        console.log(`⚠️  Found ${invalidPatients.length} patients with invalid IDs\n`);

        // Get the current maximum valid PAT number
        const validPatients = patients.filter(p => p.unique_id && validPattern.test(p.unique_id));
        let maxNumber = 0;

        if (validPatients.length > 0) {
            const numbers = validPatients.map(p => {
                const match = p.unique_id.match(/PAT-(\d+)/);
                return match ? parseInt(match[1], 10) : 0;
            });
            maxNumber = Math.max(...numbers);
        }

        console.log(`📈 Current maximum PAT number: ${maxNumber}`);
        console.log(`🔄 Will assign new IDs starting from PAT-${String(maxNumber + 1).padStart(3, '0')}\n`);

        // Ask for confirmation (in production, you might want to add a --force flag)
        console.log('⚠️  WARNING: This will update patient IDs in the database!');
        console.log('   Make sure you have a backup before proceeding.\n');

        // Update each invalid patient
        let nextNumber = maxNumber + 1;
        const updates = [];

        for (const patient of invalidPatients) {
            const newId = `PAT-${String(nextNumber).padStart(3, '0')}`;

            console.log(`  Updating: ${patient.unique_id || 'NULL'} → ${newId} (${patient.first_name} ${patient.last_name})`);

            const { error: updateError } = await supabase
                .from('patients')
                .update({ unique_id: newId })
                .eq('id', patient.id);

            if (updateError) {
                console.error(`    ❌ Error updating patient #${patient.id}:`, updateError);
                updates.push({ patient, success: false, error: updateError });
            } else {
                updates.push({ patient, success: true, newId });
                nextNumber++;
            }
        }

        // Summary
        const successful = updates.filter(u => u.success).length;
        const failed = updates.filter(u => !u.success).length;

        console.log('\n' + '='.repeat(60));
        console.log('📊 Migration Summary:');
        console.log(`   Total processed: ${updates.length}`);
        console.log(`   ✅ Successful: ${successful}`);
        console.log(`   ❌ Failed: ${failed}`);
        console.log('='.repeat(60));

        if (failed > 0) {
            console.log('\n⚠️  Some updates failed. Check the errors above.');
        } else {
            console.log('\n✨ All patient IDs have been successfully updated!');
        }

    } catch (err) {
        console.error('❌ Unexpected error:', err);
    }
}

// Run the migration
console.log('╔════════════════════════════════════════════════════════════╗');
console.log('║         Patient ID Format Migration Script                ║');
console.log('╚════════════════════════════════════════════════════════════╝\n');

fixPatientIds()
    .then(() => {
        console.log('\n✅ Migration complete!');
        process.exit(0);
    })
    .catch(err => {
        console.error('Fatal error:', err);
        process.exit(1);
    });
