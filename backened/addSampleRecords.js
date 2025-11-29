import { sql } from './config/db.js';

async function addSampleMedicalRecords() {
  try {
    // Add sample medical records with file references
    await sql`
      INSERT INTO medical_records 
      (patient_id, doctor_id, diagnosis, prescription, notes, file_name, file_path, file_type, original_name, record_date)
      VALUES 
      (1, 1, 'Annual Health Checkup', 'Vitamin D supplements', 'Patient in good health', 'sample-checkup-report.html', '/uploads/sample-checkup-report.html', 'medical_record', 'Annual Checkup Report.pdf', '2024-01-15'),
      (1, 1, 'Hypertension Treatment', 'Lisinopril 10mg daily, Amlodipine 5mg daily', 'Blood pressure monitoring required', 'prescription-hypertension.html', '/uploads/prescription-hypertension.html', 'prescription', 'Hypertension Prescription.pdf', '2024-02-20'),
      (2, 1, 'Diabetes Management', 'Metformin 500mg twice daily', 'Regular blood sugar monitoring', NULL, NULL, NULL, NULL, '2024-03-10'),
      (2, 1, 'Lab Results', NULL, 'HbA1c: 7.2%, Glucose: 145 mg/dL', 'lab-results-march.html', '/uploads/lab-results-march.html', 'lab_result', 'Lab Results March 2024.pdf', '2024-03-25')
      ON CONFLICT DO NOTHING
    `;

    console.log('Sample medical records with PDF references added successfully!');
  } catch (error) {
    console.error('Error adding sample medical records:', error);
  }
}

addSampleMedicalRecords();