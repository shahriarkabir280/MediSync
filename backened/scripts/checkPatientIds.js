import { supabase } from '../config/db.js';

/**
 * Script to verify and optionally fix patient ID formats in the database
 * Run this script to check if there are any patient IDs with incorrect formats
 */

async function checkPatientIds() {
    console.log('🔍 Checking patient IDs in database...\n');

    try {
        // Get all patients
        const { data: patients, error } = await supabase
            .from('patients')
            .select('id, unique_id, first_name, last_name')
            .order('id', { ascending: true });

        if (error) {
            console.error('❌ Error fetching patients:', error);
            return;
        }

        if (!patients || patients.length === 0) {
            console.log('ℹ️  No patients found in database.');
            return;
        }

        console.log(`📊 Found ${patients.length} patients in database\n`);

        // Check for issues
        const issues = [];
        const validPattern = /^PAT-\d{3}$/;

        patients.forEach((patient, index) => {
            if (!patient.unique_id) {
                issues.push({
                    type: 'MISSING',
                    patient,
                    message: `Patient #${patient.id} (${patient.first_name} ${patient.last_name}) has no unique_id`
                });
            } else if (!validPattern.test(patient.unique_id)) {
                issues.push({
                    type: 'INVALID_FORMAT',
                    patient,
                    message: `Patient #${patient.id} (${patient.first_name} ${patient.last_name}) has invalid format: "${patient.unique_id}"`
                });
            }
        });

        // Display results
        if (issues.length === 0) {
            console.log('✅ All patient IDs are in correct format (PAT-XXX)\n');

            // Show all IDs
            console.log('Patient IDs:');
            patients.forEach(p => {
                console.log(`  ${p.unique_id} - ${p.first_name} ${p.last_name}`);
            });
        } else {
            console.log(`⚠️  Found ${issues.length} issue(s):\n`);
            issues.forEach((issue, idx) => {
                console.log(`${idx + 1}. ${issue.message}`);
            });

            console.log('\n💡 To fix these issues, you can:');
            console.log('   1. Manually update the records in Supabase dashboard');
            console.log('   2. Delete and re-register the patients');
            console.log('   3. Run a migration script to fix the IDs\n');
        }

        // Show summary
        console.log('\n📈 Summary:');
        console.log(`   Total patients: ${patients.length}`);
        console.log(`   Valid IDs: ${patients.length - issues.length}`);
        console.log(`   Issues found: ${issues.length}`);

    } catch (err) {
        console.error('❌ Unexpected error:', err);
    }
}

// Run the check
checkPatientIds()
    .then(() => {
        console.log('\n✨ Check complete!');
        process.exit(0);
    })
    .catch(err => {
        console.error('Fatal error:', err);
        process.exit(1);
    });
