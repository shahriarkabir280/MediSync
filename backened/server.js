//const express = require('express');
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { sql } from './config/db.js'; // Import the database connection
import productRoutes from './routes/productRoutes.js';
import doctorRoutes from './routes/doctorRoutes.js';
import appointmentRoutes from './routes/appointmentRoutes.js';
import patientRoutes from './routes/patientRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import billingRoutes from './routes/billingRoutes.js';
import fileRoutes from './routes/fileRoutes.js';
import labRoutes from './routes/labRoutes.js';
import websiteRoutes from './routes/websiteRoutes.js';
import authRoutes from './routes/authRoutes.js';
import helpRoutes from './routes/helpRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import blogRoutes from './routes/blogRoutes.js';
// import { initWebsiteTables } from './sampleData/websiteTables.js'; // Disabled to prevent auto-adding data

// import { aj } from './lib/arcjet.js'; // Import Arcjet middleware - DISABLED FOR DEVELOPMENT

dotenv.config();// Load environment variables from .env file

// Get current directory for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000; // Default to port 3000 if not specified in .env 


// Middleware setup
app.use(express.json({ limit: '10mb' })); // Increase limit for base64 images
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Serve uploaded files statically with absolute path
const uploadsPath = path.join(__dirname, '../uploads');
console.log('📁 Serving uploads from:', uploadsPath);
console.log('📁 Uploads directory exists:', fs.existsSync(uploadsPath));
app.use('/uploads', express.static(uploadsPath));

// Configure CORS to allow frontend requests
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:5174', 
    'http://localhost:3000',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:5174'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

app.use(helmet());
app.use(morgan('dev'));

// Serve static files from uploads directory
app.use('/uploads', express.static('uploads'));

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
app.use('/api/notifications', notificationRoutes);
app.use('/api/blog', blogRoutes);

// File upload routes
app.use('/api', fileRoutes);

// Laboratory routes
app.use('/api/lab', labRoutes);

// Website/Profile routes
console.log('Loading website routes...');
console.log('websiteRoutes:', typeof websiteRoutes);
app.use('/api/website', websiteRoutes);

// Authentication routes
app.use('/api/auth', authRoutes);

// Help & Support routes
app.use('/api/help', helpRoutes);

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
        password_hash VARCHAR(255),
        phone VARCHAR(20),
        specialization VARCHAR(100),
        license_number VARCHAR(50),
        years_of_experience INTEGER,
        bio TEXT,
        profile_image_url VARCHAR(500),
        two_factor_enabled BOOLEAN DEFAULT false,
        backup_codes JSONB,
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
        notification_settings JSONB,
        billing_settings JSONB,
        payment_methods JSONB,
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
        diagnosis TEXT,
        prescription TEXT,
        notes TEXT,
        lab_results TEXT,
        file_name VARCHAR(255),
        file_path VARCHAR(500),
        file_type VARCHAR(50),
        file_size INTEGER,
        original_name VARCHAR(255),
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

    // Notifications table
    await sql`
      CREATE TABLE IF NOT EXISTS notifications (
        id SERIAL PRIMARY KEY,
        doctor_id INTEGER REFERENCES doctors(id) ON DELETE CASCADE,
        type VARCHAR(50) NOT NULL,
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        data JSONB,
        read BOOLEAN DEFAULT false,
        priority VARCHAR(20) DEFAULT 'medium',
        actionable BOOLEAN DEFAULT false,
        action_url VARCHAR(500),
        expires_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        read_at TIMESTAMP
      )`;

    // Notification delivery logs table
    await sql`
      CREATE TABLE IF NOT EXISTS notification_delivery_logs (
        id SERIAL PRIMARY KEY,
        notification_id INTEGER REFERENCES notifications(id) ON DELETE CASCADE,
        delivery_method VARCHAR(20) NOT NULL,
        recipient VARCHAR(255) NOT NULL,
        status VARCHAR(20) DEFAULT 'pending',
        delivered_at TIMESTAMP,
        error_message TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`;

    // Blog posts table
    await sql`
      CREATE TABLE IF NOT EXISTS blog_posts (
        id SERIAL PRIMARY KEY,
        doctor_id INTEGER REFERENCES doctors(id) ON DELETE CASCADE,
        title VARCHAR(500) NOT NULL,
        slug VARCHAR(600) UNIQUE NOT NULL,
        content TEXT NOT NULL,
        excerpt TEXT,
        featured_image VARCHAR(500),
        category VARCHAR(100),
        tags JSONB DEFAULT '[]',
        status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
        published_at TIMESTAMP,
        views INTEGER DEFAULT 0,
        read_time INTEGER DEFAULT 0,
        meta_title VARCHAR(600),
        meta_description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`;

    // Blog categories table
    await sql`
      CREATE TABLE IF NOT EXISTS blog_categories (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) UNIQUE NOT NULL,
        slug VARCHAR(120) UNIQUE NOT NULL,
        description TEXT,
        color VARCHAR(7) DEFAULT '#3B82F6',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`;

    // Blog comments table
    await sql`
      CREATE TABLE IF NOT EXISTS blog_comments (
        id SERIAL PRIMARY KEY,
        blog_post_id INTEGER REFERENCES blog_posts(id) ON DELETE CASCADE,
        author_name VARCHAR(100) NOT NULL,
        author_email VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`;

    // Create indexes for better performance
    await sql`CREATE INDEX IF NOT EXISTS idx_appointments_doctor_id ON appointments(doctor_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_appointments_patient_id ON appointments(patient_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(appointment_date)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_medical_records_patient_id ON medical_records(patient_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_billing_doctor_id ON billing(doctor_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_notifications_doctor_id ON notifications(doctor_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_blog_posts_doctor_id ON blog_posts(doctor_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_blog_posts_status ON blog_posts(status)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON blog_posts(slug)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_blog_comments_post_id ON blog_comments(blog_post_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_billing_status ON billing(status)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_notifications_doctor_id ON notifications(doctor_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_notification_delivery_logs_notification_id ON notification_delivery_logs(notification_id)`;

    // Initialize website-related tables - DISABLED to prevent auto-adding data
    // console.log('Initializing website tables...');
    // await initWebsiteTables();

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