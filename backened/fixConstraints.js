import { sql } from './config/db.js';

async function fixMedicalRecordsConstraints() {
  try {
    // Remove NOT NULL constraint from diagnosis column
    await sql`
      ALTER TABLE medical_records 
      ALTER COLUMN diagnosis DROP NOT NULL
    `;

    console.log('Medical records table constraints fixed successfully!');
  } catch (error) {
    console.error('Error fixing medical records constraints:', error);
  }
}

fixMedicalRecordsConstraints();