//const express = require('express');
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { sql } from './config/db.js'; // Import the database connection
import productRoutes from './routes/productRoutes.js';
import doctorRoutes from './routes/doctorRoutes.js';
import appointmentRoutes from './routes/appointmentRoutes.js';
import patientRoutes from './routes/patientRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import billingRoutes from './routes/billingRoutes.js';

// import { aj } from './lib/arcjet.js'; // Import Arcjet middleware - DISABLED FOR DEVELOPMENT

dotenv.config();// Load environment variables from .env file

const app = express();
const PORT = process.env.PORT || 5000; // Default to port 3000 if not specified in .env 


// Middleware setup
app.use(express.json());
app.use(cors());
app.use(helmet());
app.use(morgan('dev'));

//apply arcjet rate limiting to all routes - DISABLED FOR DEVELOPMENT
/*
app.use(async (req, res, next) => {
  try {
    const decision = await aj.protect(req,{
      requested:1
    })
   
    if(decision.isDenied()){
      if(decision.reason.isRateLimit()){
        res.status(429).json({
          error:"Too many requests, please try again later.",
        });
      }
      else if(decision.reason.isBot()){
        res.status(403).json({
          error:"Bot access denied.",
        });
      }
      else{
        res.status(403).json({
          error:"Forbidden access.",
        });
      }
      return;
    }
    if(decision.results.some((result)=> result.reason.isBot() && result.reason.isSpoofed())){
      res.status(403).json({
        error: "Spoofed bot detected, access denied.",  
      });
      return;
    }

     next();
  }
  catch(error){
    console.log("Arcjet error:", error);
    next(error); // Pass the error to the next middleware
  }
});
*/


app.get('/', (req, res) => {
  res.send('Server is running!');
});

// Product routes
app.use('/api/products', productRoutes);

// Doctor Dashboard routes
app.use('/api/doctors', doctorRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/billing', billingRoutes);

// Database initialization
async function initDB() {
  try {
    // Products table
    await sql`
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        image_url VARCHAR(255) NOT NULL,
        price DECIMAL(10, 2) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`;

    // Doctors table
    await sql`
      CREATE TABLE IF NOT EXISTS doctors (
        id SERIAL PRIMARY KEY,
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

    // Doctor settings table
    await sql`
      CREATE TABLE IF NOT EXISTS doctor_settings (
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

    // Patients table
    await sql`
      CREATE TABLE IF NOT EXISTS patients (
        id SERIAL PRIMARY KEY,
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

    // Appointments table
    await sql`
      CREATE TABLE IF NOT EXISTS appointments (
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

    // Medical records table
    await sql`
      CREATE TABLE IF NOT EXISTS medical_records (
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

    // Billing table
    await sql`
      CREATE TABLE IF NOT EXISTS billing (
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

    // Create indexes for better performance
    await sql`CREATE INDEX IF NOT EXISTS idx_appointments_doctor_id ON appointments(doctor_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_appointments_patient_id ON appointments(patient_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(appointment_date)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_medical_records_patient_id ON medical_records(patient_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_billing_doctor_id ON billing(doctor_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_billing_status ON billing(status)`;

    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Error initializing the database:', error);
  }
}

// Start server
initDB().then(() => {
  app.listen(PORT,'0.0.0.0', () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
}).catch((error) => {
  console.error('Failed to initialize the database:', error);
  process.exit(1);
});