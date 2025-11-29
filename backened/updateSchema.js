import { sql } from './config/db.js';

async function updateMedicalRecordsTable() {
  try {
    // Add file-related columns to medical_records table
    await sql`
      ALTER TABLE medical_records 
      ADD COLUMN IF NOT EXISTS file_name VARCHAR(255),
      ADD COLUMN IF NOT EXISTS file_path VARCHAR(500),
      ADD COLUMN IF NOT EXISTS file_type VARCHAR(50),
      ADD COLUMN IF NOT EXISTS file_size INTEGER,
      ADD COLUMN IF NOT EXISTS original_name VARCHAR(255)
    `;

    console.log('Medical records table updated successfully!');
  } catch (error) {
    console.error('Error updating medical records table:', error);
  }
}

updateMedicalRecordsTable();