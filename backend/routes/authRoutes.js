import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { doctorOnly, ROLES } from '../middleware/auth.js';
import { supabase } from '../config/db.js';

const router = express.Router();

// JWT Secret (in production, use environment variable)
const JWT_SECRET = process.env.JWT_SECRET;

// Login endpoint
router.post('/login', async (req, res) => {
  try {
    console.log('🔐 Login attempt:', req.body?.email);
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
    const { data: doctors, error } = await supabase
      .from('doctors')
      .select(`
        id,
        unique_id,
        first_name,
        last_name,
        email,
        password_hash,
        specialization,
        profile_image_url,
        created_at
      `)
      .eq('email', email);

    if (error) {
      console.error('Database error:', error);
      throw error;
    }

    console.log('📊 Found doctors:', doctors?.length || 0);
    if (!doctors || doctors.length === 0) {
      console.log('❌ No doctor found with email:', email);
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    const doctor = doctors[0];
    console.log('👨‍⚕️ Doctor found:', doctor.first_name, doctor.last_name);

    if (!doctor.password_hash) {
      return res.status(401).json({
        success: false,
        message: 'Password login is not enabled for this account. Please reset your password or contact support.'
      });
    }

    const isValidPassword = await bcrypt.compare(password, doctor.password_hash);

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
        name: `${doctor.first_name} ${doctor.last_name}`,
        role: 'doctor'
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
        uniqueId: doctor.unique_id,
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

// Patient Login endpoint
router.post('/patient-login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    console.log('🔍 Looking for patient with email:', email);
    // Find patient by email
    const { data: patients, error } = await supabase
      .from('patients')
      .select('*')
      .eq('email', email);

    if (error) {
      console.error('Database error:', error);
      throw error;
    }

    if (!patients || patients.length === 0) {
      console.log('❌ No patient found with email:', email);
      return res.status(401).json({
        success: false,
        message: 'Patient account not found. Please register first.'
      });
    }

    const patient = patients[0];
    console.log('👤 Patient found:', patient.first_name, patient.last_name);

    if (!patient.password_hash) {
      return res.status(401).json({
        success: false,
        message: 'Password login is not enabled for this account. Please reset your password or contact support.'
      });
    }

    const isValidPassword = await bcrypt.compare(password, patient.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    const safePatient = { ...patient };
    delete safePatient.password_hash;

    // Generate JWT token for patient
    const token = jwt.sign(
      {
        patientId: patient.id,
        email: patient.email,
        name: `${patient.first_name} ${patient.last_name}`,
        role: 'patient'
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    console.log('✅ Patient login successful:', patient.email);

    res.json({
      success: true,
      message: 'Login successful',
      token,
      data: safePatient
    });

  } catch (error) {
    console.error('❌ Patient login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Diagnostic center login. A single partner account configured through
// DIAGNOSTIC_EMAIL / DIAGNOSTIC_PASSWORD in backend/.env.
const safeEqual = (a, b) => {
  const left = crypto.createHash('sha256').update(String(a)).digest();
  const right = crypto.createHash('sha256').update(String(b)).digest();
  return crypto.timingSafeEqual(left, right);
};

router.post('/diagnostic-login', (req, res) => {
  const { DIAGNOSTIC_EMAIL, DIAGNOSTIC_PASSWORD } = process.env;
  if (!DIAGNOSTIC_EMAIL || !DIAGNOSTIC_PASSWORD) {
    return res.status(503).json({
      success: false,
      message: 'Diagnostic center login is not configured on this server'
    });
  }

  const { email, password } = req.body;
  const emailMatches = safeEqual((email || '').toLowerCase(), DIAGNOSTIC_EMAIL.toLowerCase());
  const passwordMatches = safeEqual(password || '', DIAGNOSTIC_PASSWORD);

  if (!emailMatches || !passwordMatches) {
    return res.status(401).json({ success: false, message: 'Invalid email or password' });
  }

  const token = jwt.sign(
    { id: 'diagnostic', email: DIAGNOSTIC_EMAIL, name: 'Diagnostic Center', role: ROLES.DIAGNOSTIC },
    JWT_SECRET,
    { expiresIn: '12h' }
  );

  res.json({ success: true, message: 'Login successful', token });
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

    if (decoded.role && decoded.role !== ROLES.DOCTOR) {
      return res.status(401).json({ success: false, message: 'Not a doctor session' });
    }

    // Get fresh doctor data
    const { data: doctors, error } = await supabase
      .from('doctors')
      .select(`
        id,
        unique_id,
        first_name,
        last_name,
        email,
        specialization,
        profile_image_url
      `)
      .eq('id', decoded.doctorId);

    if (error) throw error;

    if (!doctors || doctors.length === 0) {
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
        uniqueId: doctor.unique_id,
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

// Doctor-only middleware, shared with blog, calendar and email routes
const authenticateToken = doctorOnly;

// Change password endpoint
router.put('/change-password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const doctorId = req.doctorId;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required'
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters long'
      });
    }

    // Get current doctor data
    const { data: doctors, error } = await supabase
      .from('doctors')
      .select('password_hash')
      .eq('id', doctorId);

    if (error) throw error;

    if (!doctors || doctors.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found'
      });
    }

    const doctor = doctors[0];

    if (!doctor.password_hash) {
      return res.status(401).json({
        success: false,
        message: 'Password login is not enabled for this account. Please reset your password or contact support.'
      });
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, doctor.password_hash);

    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Hash new password
    const saltRounds = 10;
    const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

    // Update password in database
    const { error: updateError } = await supabase
      .from('doctors')
      .update({
        password_hash: newPasswordHash,
        updated_at: new Date().toISOString()
      })
      .eq('id', doctorId);

    if (updateError) throw updateError;

    res.json({
      success: true,
      message: 'Password changed successfully'
    });

  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Enable 2FA endpoint
router.post('/enable-2fa', authenticateToken, async (req, res) => {
  try {
    const doctorId = req.doctorId;

    // Generate backup codes
    const backupCodes = [];
    for (let i = 0; i < 10; i++) {
      backupCodes.push(Math.random().toString(36).substring(2, 8).toUpperCase());
    }

    // Update doctor settings to enable 2FA
    const { error } = await supabase
      .from('doctors')
      .update({
        two_factor_enabled: true,
        backup_codes: backupCodes, // Supabase handles JSONB automatically or pass as array/object
        updated_at: new Date().toISOString()
      })
      .eq('id', doctorId);

    if (error) throw error;

    res.json({
      success: true,
      message: '2FA enabled successfully',
      backupCodes
    });

  } catch (error) {
    console.error('Enable 2FA error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Disable 2FA endpoint
router.delete('/disable-2fa', authenticateToken, async (req, res) => {
  try {
    const doctorId = req.doctorId;

    // Update doctor settings to disable 2FA
    const { error } = await supabase
      .from('doctors')
      .update({
        two_factor_enabled: false,
        backup_codes: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', doctorId);

    if (error) throw error;

    res.json({
      success: true,
      message: '2FA disabled successfully'
    });

  } catch (error) {
    console.error('Disable 2FA error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

export default router;
export { authenticateToken };
