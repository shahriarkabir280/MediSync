import { sql } from './config/db.js';
import dotenv from 'dotenv';

dotenv.config();

async function addUniqueIds() {
  try {
    console.log('🔧 Adding unique ID fields for doctors and patients...');

    // Add unique_id column to doctors table
    console.log('📋 Adding unique_id column to doctors table...');
    await sql`
      ALTER TABLE doctors 
      ADD COLUMN IF NOT EXISTS unique_id VARCHAR(20) UNIQUE
    `;
    console.log('✓ Added unique_id column to doctors table');

    // Add unique_id column to patients table  
    console.log('📋 Adding unique_id column to patients table...');
    await sql`
      ALTER TABLE patients 
      ADD COLUMN IF NOT EXISTS unique_id VARCHAR(20) UNIQUE
    `;
    console.log('✓ Added unique_id column to patients table');

    // Generate unique IDs for existing doctors
    console.log('🏥 Generating unique IDs for existing doctors...');
    const doctors = await sql`SELECT id FROM doctors WHERE unique_id IS NULL ORDER BY id`;
    
    for (let i = 0; i < doctors.length; i++) {
      const doctor = doctors[i];
      const uniqueId = `DOC-${String(i + 1).padStart(3, '0')}`;
      await sql`
        UPDATE doctors 
        SET unique_id = ${uniqueId} 
        WHERE id = ${doctor.id}
      `;
      console.log(`✓ Assigned ${uniqueId} to doctor ID ${doctor.id}`);
    }

    // Generate unique IDs for existing patients
    console.log('👥 Generating unique IDs for existing patients...');
    const patients = await sql`SELECT id FROM patients WHERE unique_id IS NULL ORDER BY id`;
    
    for (let i = 0; i < patients.length; i++) {
      const patient = patients[i];
      const uniqueId = `PAT-${String(i + 1).padStart(3, '0')}`;
      await sql`
        UPDATE patients 
        SET unique_id = ${uniqueId} 
        WHERE id = ${patient.id}
      `;
      console.log(`✓ Assigned ${uniqueId} to patient ID ${patient.id}`);
    }

    // Create indexes on the new unique_id columns for better performance
    console.log('📊 Creating indexes for unique_id columns...');
    await sql`CREATE INDEX IF NOT EXISTS idx_doctors_unique_id ON doctors(unique_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_patients_unique_id ON patients(unique_id)`;
    console.log('✓ Created indexes for unique_id columns');

    // Verify the changes
    console.log('🔍 Verifying changes...');
    const doctorCount = await sql`SELECT COUNT(*) as count FROM doctors WHERE unique_id IS NOT NULL`;
    const patientCount = await sql`SELECT COUNT(*) as count FROM patients WHERE unique_id IS NOT NULL`;
    
    console.log(`✓ ${doctorCount[0].count} doctors have unique IDs`);
    console.log(`✓ ${patientCount[0].count} patients have unique IDs`);

    // Show sample data
    console.log('\n📋 Sample unique IDs:');
    const sampleDoctors = await sql`
      SELECT id, first_name, last_name, unique_id 
      FROM doctors 
      WHERE unique_id IS NOT NULL 
      ORDER BY id 
      LIMIT 3
    `;
    
    const samplePatients = await sql`
      SELECT id, first_name, last_name, unique_id 
      FROM patients 
      WHERE unique_id IS NOT NULL 
      ORDER BY id 
      LIMIT 3
    `;

    console.log('\nDoctors:');
    sampleDoctors.forEach(doc => {
      console.log(`  ${doc.unique_id} - ${doc.first_name} ${doc.last_name} (ID: ${doc.id})`);
    });

    console.log('\nPatients:');
    samplePatients.forEach(pat => {
      console.log(`  ${pat.unique_id} - ${pat.first_name} ${pat.last_name} (ID: ${pat.id})`);
    });

    console.log('\n✅ Successfully added unique IDs for all doctors and patients!');
    console.log('\nNext steps:');
    console.log('1. Update your API endpoints to include unique_id fields');
    console.log('2. Update your frontend to display and use unique IDs');
    console.log('3. Consider adding unique ID generation for new records');

  } catch (error) {
    console.error('❌ Error adding unique IDs:', error);
  } finally {
    process.exit(0);
  }
}

addUniqueIds();