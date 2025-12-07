import express from 'express';
import jwt from 'jsonwebtoken';
import {
  getDoctorProfile,
  updateDoctorProfile,
  getDashboardStats,
  updateDoctorSettings,
  getDoctorSettings
} from '../controllers/doctorController.js';
import { sql } from '../config/db.js';

const router = express.Router();

// JWT Secret (in production, use environment variable)
const JWT_SECRET = process.env.JWT_SECRET || 'careconnect_jwt_secret_2024';

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ success: false, message: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.doctorId = decoded.doctorId;
    next();
  } catch (error) {
    res.status(401).json({ success: false, message: 'Invalid token' });
  }
};

// Profile routes
router.get('/:doctorId/profile', getDoctorProfile);
router.put('/:doctorId/profile', updateDoctorProfile);

// Dashboard stats
router.get('/:doctorId/stats', getDashboardStats);

// Settings routes
router.get('/:doctorId/settings', getDoctorSettings);
router.put('/:doctorId/settings', updateDoctorSettings);

// JWT-authenticated settings routes
router.get('/settings', authenticateToken, async (req, res) => {
  try {
    const doctorId = req.doctorId;
    
    const result = await sql`
      SELECT *
      FROM doctor_settings
      WHERE doctor_id = ${doctorId}
    `;

    if (result.length === 0) {
      // Return default settings if none exist
      return res.json({
        success: true,
        data: {
          doctor_id: doctorId,
          default_appointment_duration: 30,
          working_hours_start: '09:00',
          working_hours_end: '17:00',
          consultation_fee: 0,
          accept_new_patients: true
        }
      });
    }

    res.json({ success: true, data: result[0] });
  } catch (error) {
    console.error('Error fetching doctor settings:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch settings' });
  }
});

router.put('/settings', authenticateToken, async (req, res) => {
  try {
    const doctorId = req.doctorId;
    const { 
      default_appointment_duration,
      working_hours_start,
      working_hours_end,
      consultation_fee,
      accept_new_patients
    } = req.body;

    const result = await sql`
      UPDATE doctor_settings 
      SET 
        default_appointment_duration = COALESCE(${default_appointment_duration}, default_appointment_duration),
        working_hours_start = COALESCE(${working_hours_start}, working_hours_start),
        working_hours_end = COALESCE(${working_hours_end}, working_hours_end),
        consultation_fee = COALESCE(${consultation_fee}, consultation_fee),
        accept_new_patients = COALESCE(${accept_new_patients}, accept_new_patients),
        updated_at = CURRENT_TIMESTAMP
      WHERE doctor_id = ${doctorId}
      RETURNING *
    `;

    if (result.length === 0) {
      // Create settings if they don't exist
      const newSettings = await sql`
        INSERT INTO doctor_settings (
          doctor_id, 
          default_appointment_duration, 
          working_hours_start, 
          working_hours_end,
          consultation_fee,
          accept_new_patients,
          created_at,
          updated_at
        )
        VALUES (
          ${doctorId}, 
          ${default_appointment_duration || 30}, 
          ${working_hours_start || '09:00'}, 
          ${working_hours_end || '17:00'},
          ${consultation_fee || 0},
          ${accept_new_patients !== undefined ? accept_new_patients : true},
          CURRENT_TIMESTAMP,
          CURRENT_TIMESTAMP
        )
        RETURNING *
      `;
      return res.json({ success: true, message: 'Settings created successfully', data: newSettings[0] });
    }

    res.json({ success: true, message: 'Settings updated successfully', data: result[0] });
  } catch (error) {
    console.error('Error updating doctor settings:', error);
    res.status(500).json({ success: false, message: 'Failed to update settings' });
  }
});

// Notification settings routes
router.get('/settings/notifications', authenticateToken, async (req, res) => {
  try {
    const doctorId = req.doctorId;
    
    const settings = await sql`
      SELECT notification_settings FROM doctor_settings WHERE doctor_id = ${doctorId}
    `;

    const notificationSettings = settings.length > 0 && settings[0].notification_settings 
      ? settings[0].notification_settings 
      : {
          emailNotifications: true,
          appointmentReminders: true,
          newPatientAlerts: true,
          billingAlerts: true,
          marketingEmails: false,
          smsNotifications: true,
          pushNotifications: true,
          weeklyReports: true
        };

    res.json(notificationSettings);
  } catch (error) {
    console.error('Get notification settings error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

router.put('/settings/notifications', authenticateToken, async (req, res) => {
  try {
    const doctorId = req.doctorId;
    const notificationSettings = req.body;

    // Upsert notification settings
    await sql`
      INSERT INTO doctor_settings (doctor_id, notification_settings, updated_at)
      VALUES (${doctorId}, ${JSON.stringify(notificationSettings)}, CURRENT_TIMESTAMP)
      ON CONFLICT (doctor_id) 
      DO UPDATE SET 
        notification_settings = ${JSON.stringify(notificationSettings)},
        updated_at = CURRENT_TIMESTAMP
    `;

    res.json({
      success: true,
      message: 'Notification settings updated successfully'
    });
  } catch (error) {
    console.error('Update notification settings error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Account deletion route
router.delete('/delete-account', authenticateToken, async (req, res) => {
  try {
    const doctorId = req.doctorId;

    // Delete all related data (cascade deletes should handle most of this)
    await sql`DELETE FROM doctors WHERE id = ${doctorId}`;

    res.json({
      success: true,
      message: 'Account deleted successfully'
    });
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

export default router;
