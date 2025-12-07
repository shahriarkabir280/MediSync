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
          globalMute: false,
          appointments: {
            enabled: true,
            email: true,
            push: true,
            sms: false
          },
          billing: {
            enabled: true,
            email: true,
            push: true,
            sms: false
          },
          chat: {
            enabled: true,
            email: false,
            push: true,
            sms: false
          },
          patients: {
            enabled: true,
            email: true,
            push: true,
            sms: false
          },
          system: {
            enabled: true,
            email: true,
            push: false,
            sms: false
          },
          frequency: 'immediate',
          quietHours: {
            enabled: false,
            startTime: '22:00',
            endTime: '07:00'
          },
          // Legacy support for existing clients
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
    let notificationSettings = req.body;

    // Validate and migrate notification settings if needed
    if (!notificationSettings.appointments) {
      // Legacy settings migration
      notificationSettings = {
        globalMute: notificationSettings.globalMute || false,
        appointments: {
          enabled: notificationSettings.appointmentReminders !== false,
          email: notificationSettings.emailNotifications !== false,
          push: notificationSettings.pushNotifications !== false,
          sms: notificationSettings.smsNotifications !== false
        },
        billing: {
          enabled: notificationSettings.billingAlerts !== false,
          email: notificationSettings.emailNotifications !== false,
          push: notificationSettings.pushNotifications !== false,
          sms: notificationSettings.smsNotifications !== false
        },
        chat: {
          enabled: true,
          email: false,
          push: notificationSettings.pushNotifications !== false,
          sms: false
        },
        patients: {
          enabled: notificationSettings.newPatientAlerts !== false,
          email: notificationSettings.emailNotifications !== false,
          push: notificationSettings.pushNotifications !== false,
          sms: notificationSettings.smsNotifications !== false
        },
        system: {
          enabled: true,
          email: notificationSettings.emailNotifications !== false,
          push: false,
          sms: false
        },
        frequency: notificationSettings.frequency || 'immediate',
        quietHours: notificationSettings.quietHours || {
          enabled: false,
          startTime: '22:00',
          endTime: '07:00'
        },
        // Preserve legacy fields for backward compatibility
        ...notificationSettings
      };
    }

    // Validate required fields
    const requiredCategories = ['appointments', 'billing', 'chat', 'patients', 'system'];
    for (const category of requiredCategories) {
      if (!notificationSettings[category]) {
        return res.status(400).json({
          success: false,
          message: `Missing notification category: ${category}`
        });
      }
    }

    // Validate frequency
    const validFrequencies = ['immediate', 'hourly', 'daily'];
    if (!validFrequencies.includes(notificationSettings.frequency)) {
      notificationSettings.frequency = 'immediate';
    }

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
      message: 'Notification settings updated successfully',
      data: notificationSettings
    });
  } catch (error) {
    console.error('Update notification settings error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Notification preferences endpoint (user-friendly format)
router.get('/settings/notification-preferences', authenticateToken, async (req, res) => {
  try {
    const doctorId = req.doctorId;
    
    const settings = await sql`
      SELECT notification_settings FROM doctor_settings WHERE doctor_id = ${doctorId}
    `;

    const notificationSettings = settings.length > 0 && settings[0].notification_settings 
      ? settings[0].notification_settings 
      : {};

    // Format for frontend consumption
    const preferences = {
      categories: {
        appointments: notificationSettings.appointments || { enabled: true, email: true, push: true, sms: false },
        billing: notificationSettings.billing || { enabled: true, email: true, push: true, sms: false },
        chat: notificationSettings.chat || { enabled: true, email: false, push: true, sms: false },
        patients: notificationSettings.patients || { enabled: true, email: true, push: true, sms: false },
        system: notificationSettings.system || { enabled: true, email: true, push: false, sms: false }
      },
      globalSettings: {
        globalMute: notificationSettings.globalMute || false,
        frequency: notificationSettings.frequency || 'immediate',
        quietHours: notificationSettings.quietHours || { enabled: false, startTime: '22:00', endTime: '07:00' }
      },
      summary: {
        totalEnabled: Object.values(notificationSettings.appointments || {}).filter(v => v === true).length +
                     Object.values(notificationSettings.billing || {}).filter(v => v === true).length +
                     Object.values(notificationSettings.chat || {}).filter(v => v === true).length +
                     Object.values(notificationSettings.patients || {}).filter(v => v === true).length +
                     Object.values(notificationSettings.system || {}).filter(v => v === true).length,
        emailEnabled: [notificationSettings.appointments?.email, notificationSettings.billing?.email, 
                      notificationSettings.chat?.email, notificationSettings.patients?.email, 
                      notificationSettings.system?.email].filter(Boolean).length,
        pushEnabled: [notificationSettings.appointments?.push, notificationSettings.billing?.push, 
                     notificationSettings.chat?.push, notificationSettings.patients?.push, 
                     notificationSettings.system?.push].filter(Boolean).length,
        smsEnabled: [notificationSettings.appointments?.sms, notificationSettings.billing?.sms, 
                    notificationSettings.chat?.sms, notificationSettings.patients?.sms, 
                    notificationSettings.system?.sms].filter(Boolean).length
      }
    };

    res.json({ success: true, data: preferences });
  } catch (error) {
    console.error('Get notification preferences error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Test notification endpoint
router.post('/settings/test-notification', authenticateToken, async (req, res) => {
  try {
    const doctorId = req.doctorId;
    const { type, method } = req.body; // type: 'appointments', 'billing', etc. method: 'email', 'push', 'sms'

    // Get doctor info for personalization
    const doctor = await sql`
      SELECT first_name, last_name, email FROM doctors WHERE id = ${doctorId}
    `;

    if (doctor.length === 0) {
      return res.status(404).json({ success: false, message: 'Doctor not found' });
    }

    const testMessages = {
      appointments: {
        email: `Test: Appointment reminder for Dr. ${doctor[0].first_name} ${doctor[0].last_name}`,
        push: 'Test: You have an upcoming appointment in 30 minutes',
        sms: 'Test: Appointment reminder - Patient John Doe at 2:00 PM today'
      },
      billing: {
        email: 'Test: New payment received - Invoice #12345',
        push: 'Test: Payment notification - $150 received',
        sms: 'Test: Payment alert - Invoice paid'
      },
      chat: {
        email: 'Test: New message from patient',
        push: 'Test: You have 1 unread message',
        sms: 'Test: New chat message received'
      },
      patients: {
        email: 'Test: New patient registration - Jane Smith',
        push: 'Test: New patient added to your practice',
        sms: 'Test: Patient registration notification'
      },
      system: {
        email: 'Test: CareConnect system notification',
        push: 'Test: System update completed',
        sms: 'Test: System maintenance notification'
      }
    };

    const message = testMessages[type]?.[method] || 'Test notification';

    // In a real implementation, you would send actual notifications here
    // For now, we'll just simulate it
    console.log(`Sending test ${method} notification to doctor ${doctorId}: ${message}`);

    res.json({
      success: true,
      message: `Test ${method} notification sent successfully`,
      data: {
        type,
        method,
        message,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Test notification error:', error);
    res.status(500).json({ success: false, message: 'Failed to send test notification' });
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
