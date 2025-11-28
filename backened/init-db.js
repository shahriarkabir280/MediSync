import { sql } from './config/db.js';
import dotenv from 'dotenv';

dotenv.config();

async function cleanAndInitDB() {
  try {
    console.log('🧹 Cleaning existing tables...');
    
    // Drop all indexes first
    await sql`DROP INDEX IF EXISTS idx_appointments_doctor_id CASCADE`;
    await sql`DROP INDEX IF EXISTS idx_appointments_patient_id CASCADE`;
    await sql`DROP INDEX IF EXISTS idx_appointments_date CASCADE`;
    await sql`DROP INDEX IF EXISTS idx_medical_records_patient_id CASCADE`;
    await sql`DROP INDEX IF EXISTS idx_billing_doctor_id CASCADE`;
    await sql`DROP INDEX IF EXISTS idx_billing_status CASCADE`;
    
    // Drop all tables in correct order (reverse of foreign key dependencies)
    await sql`DROP TABLE IF EXISTS billing CASCADE`;
    await sql`DROP TABLE IF EXISTS medical_records CASCADE`;
    await sql`DROP TABLE IF EXISTS appointments CASCADE`;
    await sql`DROP TABLE IF EXISTS patients CASCADE`;
    await sql`DROP TABLE IF EXISTS doctor_settings CASCADE`;
    await sql`DROP TABLE IF EXISTS doctors CASCADE`;
    await sql`DROP TABLE IF EXISTS products CASCADE`;
    
    console.log('✓ Cleaned existing tables');
    console.log('');
    console.log('📦 Creating tables...');
    
    // Products table
    await sql`
      CREATE TABLE products (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        image_url VARCHAR(255) NOT NULL,
        price DECIMAL(10, 2) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`;
    console.log('✓ Created products table');

    // Doctors table
    await sql`
      CREATE TABLE doctors (
        id SERIAL PRIMARY KEY,
        unique_id VARCHAR(20) UNIQUE,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        phone VARCHAR(20),
        specialization VARCHAR(100),
        license_number VARCHAR(50),
        years_of_experience INTEGER,
        bio TEXT,
        profile_image_url VARCHAR(500),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`;
    console.log('✓ Created doctors table');

    // Doctor settings table
    await sql`
      CREATE TABLE doctor_settings (
        id SERIAL PRIMARY KEY,
        doctor_id INTEGER REFERENCES doctors(id) ON DELETE CASCADE,
        default_appointment_duration INTEGER DEFAULT 30,
        working_hours_start TIME DEFAULT '09:00',
        working_hours_end TIME DEFAULT '17:00',
        consultation_fee DECIMAL(10, 2) DEFAULT 0,
        accept_new_patients BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(doctor_id)
      )`;
    console.log('✓ Created doctor_settings table');

    // Patients table
    await sql`
      CREATE TABLE patients (
        id SERIAL PRIMARY KEY,
        unique_id VARCHAR(20) UNIQUE,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        phone VARCHAR(20),
        date_of_birth DATE,
        gender VARCHAR(20),
        blood_group VARCHAR(5),
        address TEXT,
        emergency_contact_name VARCHAR(100),
        emergency_contact_phone VARCHAR(20),
        medical_history TEXT,
        allergies TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`;
    console.log('✓ Created patients table');

    // Appointments table
    await sql`
      CREATE TABLE appointments (
        id SERIAL PRIMARY KEY,
        doctor_id INTEGER REFERENCES doctors(id) ON DELETE CASCADE,
        patient_id INTEGER REFERENCES patients(id) ON DELETE CASCADE,
        appointment_date DATE NOT NULL,
        appointment_time TIME NOT NULL,
        status VARCHAR(20) DEFAULT 'pending',
        appointment_type VARCHAR(50) DEFAULT 'consultation',
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`;
    console.log('✓ Created appointments table');

    // Medical records table
    await sql`
      CREATE TABLE medical_records (
        id SERIAL PRIMARY KEY,
        patient_id INTEGER REFERENCES patients(id) ON DELETE CASCADE,
        doctor_id INTEGER REFERENCES doctors(id) ON DELETE CASCADE,
        diagnosis TEXT NOT NULL,
        prescription TEXT,
        notes TEXT,
        lab_results TEXT,
        record_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`;
    console.log('✓ Created medical_records table');

    // Billing table
    await sql`
      CREATE TABLE billing (
        id SERIAL PRIMARY KEY,
        doctor_id INTEGER REFERENCES doctors(id) ON DELETE CASCADE,
        patient_id INTEGER REFERENCES patients(id) ON DELETE CASCADE,
        appointment_id INTEGER REFERENCES appointments(id) ON DELETE SET NULL,
        amount DECIMAL(10, 2) NOT NULL,
        description TEXT,
        status VARCHAR(20) DEFAULT 'pending',
        due_date DATE,
        payment_date TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`;
    console.log('✓ Created billing table');

    // Create indexes
    await sql`CREATE INDEX idx_appointments_doctor_id ON appointments(doctor_id)`;
    await sql`CREATE INDEX idx_appointments_patient_id ON appointments(patient_id)`;
    await sql`CREATE INDEX idx_appointments_date ON appointments(appointment_date)`;
    await sql`CREATE INDEX idx_medical_records_patient_id ON medical_records(patient_id)`;
    await sql`CREATE INDEX idx_billing_doctor_id ON billing(doctor_id)`;
    await sql`CREATE INDEX idx_billing_status ON billing(status)`;
    await sql`CREATE INDEX idx_doctors_unique_id ON doctors(unique_id)`;
    await sql`CREATE INDEX idx_patients_unique_id ON patients(unique_id)`;
    console.log('✓ Created indexes');

    console.log('');
    console.log('✅ Database initialized successfully!');
    console.log('');
    console.log('Next step: Run "npm run seed" to populate with sample data');
  } catch (error) {
    console.error('❌ Error initializing database:', error);
  } finally {
    process.exit(0);
  }
}

cleanAndInitDB();
