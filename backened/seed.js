import { sql } from './config/db.js';
import dotenv from 'dotenv';

dotenv.config();

async function seedDatabase() {
  try {
    console.log('Starting database seeding...');

    // Insert sample doctors
    const doctors = await sql`
      INSERT INTO doctors (unique_id, first_name, last_name, email, phone, specialization, license_number, years_of_experience, bio)
      VALUES 
        ('DOC-001', 'John', 'Doe', 'john.doe@careconnect.com', '+1-555-0101', 'Cardiologist', 'MD12345', 15, 'Experienced cardiologist specializing in heart disease prevention and treatment.'),
        ('DOC-002', 'Sarah', 'Smith', 'sarah.smith@careconnect.com', '+1-555-0102', 'Pediatrician', 'MD12346', 10, 'Dedicated pediatrician with focus on child health and development.'),
        ('DOC-003', 'Michael', 'Johnson', 'michael.johnson@careconnect.com', '+1-555-0103', 'Orthopedic Surgeon', 'MD12347', 12, 'Orthopedic surgeon specializing in sports injuries and joint replacement.')
      ON CONFLICT (email) DO NOTHING
      RETURNING id, unique_id
    `;

    let doctorId;
    if (doctors.length > 0) {
      console.log(`✓ Inserted ${doctors.length} doctors`);
      doctorId = doctors[0].id;
    } else {
      const existingDoctors = await sql`SELECT id FROM doctors WHERE email = 'john.doe@careconnect.com'`;
      if (existingDoctors.length > 0) {
        doctorId = existingDoctors[0].id;
        console.log('✓ Found existing doctor, proceeding with data expansion');
      }
    }

    if (doctorId) {
      // Insert doctor settings
      await sql`
        INSERT INTO doctor_settings (doctor_id, default_appointment_duration, working_hours_start, working_hours_end, consultation_fee, accept_new_patients)
        VALUES 
          (${doctorId}, 30, '09:00', '17:00', 150.00, true)
        ON CONFLICT (doctor_id) DO NOTHING
      `;
      console.log('✓ Inserted doctor settings');

      // Insert sample patients
      const patients = await sql`
        INSERT INTO patients (unique_id, first_name, last_name, email, phone, date_of_birth, gender, blood_group, address, medical_history, allergies, emergency_contact_name, emergency_contact_phone)
        VALUES 
          ('PAT-001', 'John', 'Smith', 'john.smith@example.com', '+1-555-1001', '1990-05-15', 'Male', 'A+', '123 Main St, New York, NY 10001', 'No significant medical history', 'No known allergies', 'Jane Smith', '+1-555-1101'),
          ('PAT-002', 'Mary', 'Johnson', 'mary.johnson@example.com', '+1-555-1002', '1985-08-22', 'Female', 'B+', '456 Oak Ave, Los Angeles, CA 90210', 'Type 2 Diabetes, diagnosed 2020', 'Penicillin allergy', 'Robert Johnson', '+1-555-1102'),
          ('PAT-003', 'David', 'Brown', 'david.brown@example.com', '+1-555-1003', '1975-11-30', 'Male', 'O+', '789 Pine Rd, Chicago, IL 60601', 'Hypertension, High cholesterol', 'Shellfish allergy', 'Susan Brown', '+1-555-1103'),
          ('PAT-004', 'Emily', 'Davis', 'emily.davis@example.com', '+1-555-1004', '1992-03-18', 'Female', 'AB-', '321 Elm St, Houston, TX 77001', 'Asthma, mild anxiety', 'Latex allergy', 'Michael Davis', '+1-555-1104'),
          ('PAT-005', 'Robert', 'Wilson', 'robert.wilson@example.com', '+1-555-1005', '1988-07-25', 'Male', 'A-', '654 Maple Dr, Phoenix, AZ 85001', 'No significant medical history', 'No known allergies', 'Lisa Wilson', '+1-555-1105'),
          ('PAT-006', 'Sarah', 'Martinez', 'sarah.martinez@example.com', '+1-555-1006', '1995-12-08', 'Female', 'O-', '987 Cedar Lane, Miami, FL 33101', 'Migraine headaches', 'Sulfa drugs allergy', 'Carlos Martinez', '+1-555-1106'),
          ('PAT-007', 'James', 'Taylor', 'james.taylor@example.com', '+1-555-1007', '1982-06-14', 'Male', 'B-', '147 Birch St, Seattle, WA 98101', 'Lower back pain, arthritis', 'No known allergies', 'Jennifer Taylor', '+1-555-1107'),
          ('PAT-008', 'Lisa', 'Anderson', 'lisa.anderson@example.com', '+1-555-1008', '1978-09-03', 'Female', 'A+', '258 Spruce Ave, Denver, CO 80201', 'Thyroid disorder, osteoporosis', 'Iodine allergy', 'Mark Anderson', '+1-555-1108'),
          ('PAT-009', 'Kevin', 'Clark', 'kevin.clark@example.com', '+1-555-1009', '1991-01-20', 'Male', 'AB+', '369 Willow Dr, Boston, MA 02101', 'Sports injury history', 'No known allergies', 'Amy Clark', '+1-555-1109'),
          ('PAT-010', 'Amanda', 'Lewis', 'amanda.lewis@example.com', '+1-555-1010', '1987-04-11', 'Female', 'O+', '741 Redwood Blvd, San Francisco, CA 94101', 'Depression, anxiety disorder', 'Aspirin allergy', 'Brian Lewis', '+1-555-1110')
        ON CONFLICT (email) DO UPDATE SET email = EXCLUDED.email
        RETURNING id, unique_id
      `;
      console.log(`✓ Synchronized ${patients.length} patients`);

      if (patients.length > 0) {
        // Insert comprehensive sample appointments for testing
        const appointments = await sql`
          INSERT INTO appointments (doctor_id, patient_id, appointment_date, appointment_time, status, appointment_type, notes, actual_start_time, actual_end_time)
          VALUES 
            -- Today's appointments
            (${doctorId}, ${patients[0].id}, CURRENT_DATE, '09:00', 'confirmed', 'consultation', 'Initial consultation for new patient', NULL, NULL),
            (${doctorId}, ${patients[1]?.id || patients[0].id}, CURRENT_DATE, '09:30', 'confirmed', 'follow-up', 'Diabetes follow-up - blood sugar check', NULL, NULL),
            (${doctorId}, ${patients[2]?.id || patients[0].id}, CURRENT_DATE, '10:00', 'pending', 'consultation', 'Routine consultation', NULL, NULL),
            (${doctorId}, ${patients[3]?.id || patients[0].id}, CURRENT_DATE, '10:30', 'confirmed', 'check-up', 'Annual physical examination', NULL, NULL),
            (${doctorId}, ${patients[4]?.id || patients[0].id}, CURRENT_DATE, '11:00', 'pending', 'consultation', 'New patient - complaint of chest pain', NULL, NULL),
            (${doctorId}, ${patients[5]?.id || patients[0].id}, CURRENT_DATE, '11:30', 'confirmed', 'consultation', 'Migraine consultation', NULL, NULL),
            (${doctorId}, ${patients[0].id}, CURRENT_DATE, '14:00', 'confirmed', 'follow-up', 'Follow-up for previous treatment', NULL, NULL),
            (${doctorId}, ${patients[1]?.id || patients[0].id}, CURRENT_DATE, '14:30', 'cancelled', 'consultation', 'Patient cancelled due to emergency', NULL, NULL),
            (${doctorId}, ${patients[2]?.id || patients[0].id}, CURRENT_DATE, '15:00', 'completed', 'check-up', 'Completed routine check-up', NULL, NULL),
            (${doctorId}, ${patients[6]?.id || patients[0].id}, CURRENT_DATE, '15:30', 'confirmed', 'procedure', 'Back pain evaluation', NULL, NULL),
            (${doctorId}, ${patients[7]?.id || patients[0].id}, CURRENT_DATE, '16:00', 'confirmed', 'emergency', 'Emergency consultation - urgent care needed', NULL, NULL),
            
            -- Tomorrow's appointments
            (${doctorId}, ${patients[0].id}, CURRENT_DATE + INTERVAL '1 day', '09:00', 'confirmed', 'consultation', 'Follow-up consultation', NULL, NULL),
            (${doctorId}, ${patients[1]?.id || patients[0].id}, CURRENT_DATE + INTERVAL '1 day', '09:30', 'confirmed', 'follow-up', 'Medication review', NULL, NULL),
            (${doctorId}, ${patients[2]?.id || patients[0].id}, CURRENT_DATE + INTERVAL '1 day', '10:00', 'pending', 'check-up', 'Preventive health screening', NULL, NULL),
            (${doctorId}, ${patients[3]?.id || patients[0].id}, CURRENT_DATE + INTERVAL '1 day', '11:00', 'confirmed', 'consultation', 'New symptoms evaluation', NULL, NULL),
            (${doctorId}, ${patients[4]?.id || patients[0].id}, CURRENT_DATE + INTERVAL '1 day', '14:00', 'pending', 'procedure', 'Pre-procedure consultation', NULL, NULL),
            (${doctorId}, ${patients[8]?.id || patients[0].id}, CURRENT_DATE + INTERVAL '1 day', '14:30', 'confirmed', 'consultation', 'Sports injury follow-up', NULL, NULL),
            (${doctorId}, ${patients[9]?.id || patients[0].id}, CURRENT_DATE + INTERVAL '1 day', '15:00', 'pending', 'consultation', 'Mental health consultation', NULL, NULL),
            (${doctorId}, ${patients[5]?.id || patients[0].id}, CURRENT_DATE + INTERVAL '1 day', '16:30', 'pending', 'emergency', 'Emergency slot - patient called in', NULL, NULL),
            
            -- Day after tomorrow
            (${doctorId}, ${patients[0].id}, CURRENT_DATE + INTERVAL '2 days', '09:30', 'confirmed', 'follow-up', 'Treatment progress review', NULL, NULL),
            (${doctorId}, ${patients[1]?.id || patients[0].id}, CURRENT_DATE + INTERVAL '2 days', '10:30', 'pending', 'consultation', 'Second opinion consultation', NULL, NULL),
            (${doctorId}, ${patients[2]?.id || patients[0].id}, CURRENT_DATE + INTERVAL '2 days', '11:00', 'confirmed', 'check-up', 'Lab results discussion', NULL, NULL),
            (${doctorId}, ${patients[7]?.id || patients[0].id}, CURRENT_DATE + INTERVAL '2 days', '14:00', 'confirmed', 'follow-up', 'Thyroid medication adjustment', NULL, NULL),
            (${doctorId}, ${patients[8]?.id || patients[0].id}, CURRENT_DATE + INTERVAL '2 days', '15:00', 'pending', 'procedure', 'Physical therapy consultation', NULL, NULL),
            
            -- Next week appointments
            (${doctorId}, ${patients[3]?.id || patients[0].id}, CURRENT_DATE + INTERVAL '7 days', '09:00', 'confirmed', 'consultation', 'Weekly follow-up', NULL, NULL),
            (${doctorId}, ${patients[4]?.id || patients[0].id}, CURRENT_DATE + INTERVAL '7 days', '10:00', 'pending', 'procedure', 'Scheduled procedure', NULL, NULL),
            (${doctorId}, ${patients[0].id}, CURRENT_DATE + INTERVAL '8 days', '09:30', 'confirmed', 'follow-up', 'Post-treatment follow-up', NULL, NULL),
            (${doctorId}, ${patients[1]?.id || patients[0].id}, CURRENT_DATE + INTERVAL '9 days', '14:00', 'pending', 'consultation', 'Consultation for new symptoms', NULL, NULL),
            (${doctorId}, ${patients[6]?.id || patients[0].id}, CURRENT_DATE + INTERVAL '10 days', '10:30', 'confirmed', 'follow-up', 'Arthritis management review', NULL, NULL),
            (${doctorId}, ${patients[9]?.id || patients[0].id}, CURRENT_DATE + INTERVAL '11 days', '11:00', 'pending', 'consultation', 'Therapy progress review', NULL, NULL),
            
            -- Past appointments for history
            (${doctorId}, ${patients[0].id}, CURRENT_DATE - INTERVAL '1 day', '10:00', 'completed', 'consultation', 'Initial diagnosis completed', (CURRENT_DATE - INTERVAL '1 day' + INTERVAL '10 hours 12 minutes'), (CURRENT_DATE - INTERVAL '1 day' + INTERVAL '10 hours 45 minutes')),
            (${doctorId}, ${patients[1]?.id || patients[0].id}, CURRENT_DATE - INTERVAL '2 days', '11:00', 'completed', 'follow-up', 'Follow-up completed successfully', (CURRENT_DATE - INTERVAL '2 days' + INTERVAL '11 hours 05 minutes'), (CURRENT_DATE - INTERVAL '2 days' + INTERVAL '11 hours 35 minutes')),
            (${doctorId}, ${patients[2]?.id || patients[0].id}, CURRENT_DATE - INTERVAL '3 days', '09:30', 'completed', 'check-up', 'Annual check-up completed', (CURRENT_DATE - INTERVAL '3 days' + INTERVAL '09 hours 40 minutes'), (CURRENT_DATE - INTERVAL '3 days' + INTERVAL '10 hours 10 minutes')),
            (${doctorId}, ${patients[3]?.id || patients[0].id}, CURRENT_DATE - INTERVAL '7 days', '14:30', 'completed', 'consultation', 'Treatment consultation completed', (CURRENT_DATE - INTERVAL '7 days' + INTERVAL '14 hours 45 minutes'), (CURRENT_DATE - INTERVAL '7 days' + INTERVAL '15 hours 20 minutes')),
            (${doctorId}, ${patients[4]?.id || patients[0].id}, CURRENT_DATE - INTERVAL '14 days', '10:30', 'cancelled', 'consultation', 'Patient no-show', NULL, NULL),
            (${doctorId}, ${patients[5]?.id || patients[0].id}, CURRENT_DATE - INTERVAL '5 days', '15:00', 'completed', 'consultation', 'Migraine treatment plan completed', (CURRENT_DATE - INTERVAL '5 days' + INTERVAL '15 hours 10 minutes'), (CURRENT_DATE - INTERVAL '5 days' + INTERVAL '15 hours 35 minutes')),
            (${doctorId}, ${patients[6]?.id || patients[0].id}, CURRENT_DATE - INTERVAL '10 days', '09:00', 'completed', 'procedure', 'Physical therapy evaluation completed', (CURRENT_DATE - INTERVAL '10 days' + INTERVAL '09 hours 05 minutes'), (CURRENT_DATE - INTERVAL '10 days' + INTERVAL '09 hours 55 minutes')),
            (${doctorId}, ${patients[7]?.id || patients[0].id}, CURRENT_DATE - INTERVAL '21 days', '11:30', 'completed', 'follow-up', 'Thyroid check-up completed', (CURRENT_DATE - INTERVAL '21 days' + INTERVAL '11 hours 40 minutes'), (CURRENT_DATE - INTERVAL '21 days' + INTERVAL '12 hours 10 minutes')),
            (${doctorId}, ${patients[8]?.id || patients[0].id}, CURRENT_DATE - INTERVAL '30 days', '14:00', 'completed', 'consultation', 'Initial sports injury assessment', (CURRENT_DATE - INTERVAL '30 days' + INTERVAL '14 hours 15 minutes'), (CURRENT_DATE - INTERVAL '30 days' + INTERVAL '14 hours 50 minutes')),
            (${doctorId}, ${patients[9]?.id || patients[0].id}, CURRENT_DATE - INTERVAL '60 days', '10:00', 'completed', 'consultation', 'Mental health initial consultation', (CURRENT_DATE - INTERVAL '60 days' + INTERVAL '10 hours 20 minutes'), (CURRENT_DATE - INTERVAL '60 days' + INTERVAL '11 hours 00 minutes'))
          RETURNING id
        `;
        console.log(`✓ Inserted ${appointments.length} appointments`);

        // Insert sample medical records
        await sql`
          INSERT INTO medical_records (patient_id, doctor_id, diagnosis, prescription, notes, record_date)
          VALUES 
            (${patients[0].id}, ${doctorId}, 'Common Cold', 'Rest and fluids, Vitamin C', 'Patient showing mild symptoms', CURRENT_TIMESTAMP - INTERVAL '7 days'),
            (${patients[1]?.id || patients[0].id}, ${doctorId}, 'Type 2 Diabetes', 'Metformin 500mg twice daily', 'Blood sugar levels stable', CURRENT_TIMESTAMP - INTERVAL '14 days')
        `;
        console.log('✓ Inserted sample medical records');

        // Insert sample billing records
        await sql`
          INSERT INTO billing (doctor_id, patient_id, appointment_id, amount, description, status, due_date, created_at)
          VALUES 
            (${doctorId}, ${patients[0].id}, ${appointments[0].id}, 150.00, 'Initial Consultation', 'paid', CURRENT_DATE, CURRENT_DATE),
            (${doctorId}, ${patients[1]?.id || patients[0].id}, ${appointments[1]?.id || appointments[0].id}, 100.00, 'Follow-up Visit', 'paid', CURRENT_DATE - INTERVAL '30 days', CURRENT_DATE - INTERVAL '30 days'),
            (${doctorId}, ${patients[2]?.id || patients[0].id}, ${appointments[2]?.id || appointments[0].id}, 120.00, 'Routine Check-up', 'paid', CURRENT_DATE - INTERVAL '60 days', CURRENT_DATE - INTERVAL '60 days'),
            (${doctorId}, ${patients[3]?.id || patients[0].id}, ${appointments[3]?.id || appointments[0].id}, 150.00, 'Specialist Consultation', 'pending', CURRENT_DATE + INTERVAL '7 days', CURRENT_DATE)
        `;
        console.log('✓ Inserted sample billing records');

        // Insert sample patient feedback
        await sql`
          INSERT INTO patient_feedback (doctor_id, patient_id, appointment_id, rating, comment)
          VALUES 
            (${doctorId}, ${patients[0].id}, ${appointments[0].id}, 5, 'Excellent service, highly professional.'),
            (${doctorId}, ${patients[1]?.id || patients[0].id}, ${appointments[1]?.id || appointments[0].id}, 4, 'Very helpful guidance on my diabetes management.'),
            (${doctorId}, ${patients[2]?.id || patients[0].id}, ${appointments[2]?.id || appointments[0].id}, 5, 'Quick wait time and friendly staff.')
        `;
        console.log('✓ Inserted sample patient feedback');
      }
    } else {
      console.log('Doctors already exist in database');
    }

    console.log('\n✓ Database seeding completed successfully!');
    console.log('\nSample credentials:');
    console.log('Doctor Email: john.doe@careconnect.com');
    console.log('Doctor ID: Use the ID from the doctors table');
    console.log('Doctor Unique ID: DOC-001');
    console.log('\nSample Patient Unique IDs: PAT-001, PAT-002, PAT-003, etc.\n');

  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    process.exit(0);
  }
}

seedDatabase();
