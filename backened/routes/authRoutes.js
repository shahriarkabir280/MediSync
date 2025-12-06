import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { sql } from '../config/db.js';

const router = express.Router();

// JWT Secret (in production, use environment variable)
const JWT_SECRET = process.env.JWT_SECRET || 'careconnect_jwt_secret_2024';

// Login endpoint
router.post('/login', async (req, res) => {
  try {
    console.log('🔐 Login attempt:', req.body);
    const { email, password } = req.body;

    if (!email || !password) {
      console.log('❌ Missing email or password');
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    console.log('🔍 Looking for doctor with email:', email);
    // Find doctor by email
    const doctors = await sql`
      SELECT 
        id,
        first_name,
        last_name,
        email,
        password_hash,
        specialization,
        profile_image_url,
        created_at
      FROM doctors 
      WHERE email = ${email}
    `;

    console.log('📊 Found doctors:', doctors.length);
    if (doctors.length === 0) {
      console.log('❌ No doctor found with email:', email);
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    const doctor = doctors[0];
    console.log('👨‍⚕️ Doctor found:', doctor.first_name, doctor.last_name);

    // Check password (for demo, we'll allow plain text password 'password123')
    let isValidPassword = false;
    
    if (doctor.password_hash) {
      // Compare with hashed password
      isValidPassword = await bcrypt.compare(password, doctor.password_hash);
      console.log('🔒 Password hash comparison:', isValidPassword);
    } else {
      // Demo: Allow 'password123' for any doctor
      isValidPassword = password === 'password123';
      console.log('🔓 Plain text password check:', isValidPassword);
    }

    if (!isValidPassword) {
      console.log('❌ Invalid password for:', email);
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        doctorId: doctor.id,
        email: doctor.email,
        name: `${doctor.first_name} ${doctor.last_name}`
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    console.log('✅ Login successful for:', doctor.email);

    // Return success response
    res.json({
      success: true,
      message: 'Login successful',
      token,
      doctor: {
        id: doctor.id,
        name: `${doctor.first_name} ${doctor.last_name}`,
        email: doctor.email,
        specialization: doctor.specialization,
        profileImage: doctor.profile_image_url
      }
    });

  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Verify token endpoint
router.get('/verify', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided'
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Get fresh doctor data
    const doctors = await sql`
      SELECT 
        id,
        first_name,
        last_name,
        email,
        specialization,
        profile_image_url
      FROM doctors 
      WHERE id = ${decoded.doctorId}
    `;

    if (doctors.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Doctor not found'
      });
    }

    const doctor = doctors[0];

    res.json({
      success: true,
      doctor: {
        id: doctor.id,
        name: `${doctor.first_name} ${doctor.last_name}`,
        email: doctor.email,
        specialization: doctor.specialization,
        profileImage: doctor.profile_image_url
      }
    });

  } catch (error) {
    console.error('Token verification error:', error);
    res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }
});

// Logout endpoint (client-side token removal)
router.post('/logout', (req, res) => {
  res.json({
    success: true,
    message: 'Logout successful'
  });
});

export default router;