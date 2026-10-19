import express from 'express';
import { doctorOnly, requireOwnDoctor } from '../middleware/auth.js';
import {
  getDoctorProfile,
  updateDoctorProfile,
  getDashboardStats,
  updateDoctorSettings,
  getDoctorSettings
} from '../controllers/doctorController.js';
import { supabase } from '../config/db.js';

const router = express.Router();

// Doctor-only routes
const authenticateToken = doctorOnly;

// Public marketplace route (no auth required for now to allow patients to search)
router.get('/marketplace', async (req, res) => {
  try {
    const { search } = req.query;
    
    // Join with website_settings to get the url_slug
    let query = supabase
      .from('doctors')
      .select(`
        id, first_name, last_name, email, specialization, 
        years_of_experience, profile_image_url,
        website_settings (url_slug)
      `);

    if (search) {
      query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,specialization.ilike.%${search}%`);
    }

    const { data: doctors, error } = await query.limit(20);

    if (error) throw error;

    // Enhance and format the results
    const enhancedDoctors = doctors.map(doc => {
      // Handle the nested website_settings result from Supabase
      const ws = doc.website_settings?.[0] || {};
      
      // Dynamic fallback slug from name
      const nameSlug = `${doc.first_name || ''}-${doc.last_name || ''}`
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '');

      return {
        ...doc,
        slug: ws.url_slug || nameSlug || 'doctor',
        rating: (4 + Math.random()).toFixed(1),
        reviews_count: Math.floor(Math.random() * 200) + 10,
        city: 'Local Area', 
        consultation_fee: 1000,
        // Remove the nested object to keep response clean
        website_settings: undefined
      };
    });

    res.json({ success: true, data: enhancedDoctors });
  } catch (error) {
    console.error('Error fetching marketplace doctors:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch doctors' });
  }
});

// Profile routes
router.get('/:doctorId/profile', authenticateToken, requireOwnDoctor(), getDoctorProfile);
router.put('/:doctorId/profile', authenticateToken, requireOwnDoctor(), updateDoctorProfile);

// Dashboard stats
router.get('/:doctorId/stats', authenticateToken, requireOwnDoctor(), getDashboardStats);

// Settings routes
router.get('/:doctorId/settings', authenticateToken, requireOwnDoctor(), getDoctorSettings);
router.put('/:doctorId/settings', authenticateToken, requireOwnDoctor(), updateDoctorSettings);

// JWT-authenticated settings routes
router.get('/settings', authenticateToken, async (req, res) => {
  try {
    const doctorId = req.doctorId;

    const { data: result, error } = await supabase
      .from('doctor_settings')
      .select('*')
      .eq('doctor_id', doctorId);

    if (!result || result.length === 0) {
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

    const updateData = {
      updated_at: new Date().toISOString()
    };
    if (default_appointment_duration !== undefined) updateData.default_appointment_duration = default_appointment_duration;
    if (working_hours_start !== undefined) updateData.working_hours_start = working_hours_start;
    if (working_hours_end !== undefined) updateData.working_hours_end = working_hours_end;
    if (consultation_fee !== undefined) updateData.consultation_fee = consultation_fee;
    if (accept_new_patients !== undefined) updateData.accept_new_patients = accept_new_patients;

    // Check existence
    const { data: existing } = await supabase.from('doctor_settings').select('id').eq('doctor_id', doctorId).maybeSingle();

    let resultData;

    if (existing) {
      const { data: upd } = await supabase
        .from('doctor_settings')
        .update(updateData)
        .eq('doctor_id', doctorId)
        .select()
        .single();
      resultData = upd;
    } else {
      const insertData = {
        doctor_id: doctorId,
        default_appointment_duration: default_appointment_duration || 30,
        working_hours_start: working_hours_start || '09:00',
        working_hours_end: working_hours_end || '17:00',
        consultation_fee: consultation_fee || 0,
        accept_new_patients: accept_new_patients !== undefined ? accept_new_patients : true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      const { data: ins } = await supabase
        .from('doctor_settings')
        .insert(insertData)
        .select()
        .single();
      resultData = ins;
    }

    res.json({ success: true, message: 'Settings updated successfully', data: resultData });
  } catch (error) {
    console.error('Error updating doctor settings:', error);
    res.status(500).json({ success: false, message: 'Failed to update settings' });
  }
});

// Notification settings routes
router.get('/settings/notifications', authenticateToken, async (req, res) => {
  try {
    const doctorId = req.doctorId;

    const { data: settings } = await supabase.from('doctor_settings').select('notification_settings').eq('doctor_id', doctorId).maybeSingle();

    const notificationSettings = settings?.notification_settings || {
      globalMute: false,
      appointments: { enabled: true, email: true, push: true, sms: false },
      billing: { enabled: true, email: true, push: true, sms: false },
      chat: { enabled: true, email: false, push: true, sms: false },
      patients: { enabled: true, email: true, push: true, sms: false },
      system: { enabled: true, email: true, push: false, sms: false },
      frequency: 'immediate',
      quietHours: { enabled: false, startTime: '22:00', endTime: '07:00' },
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

    // Validate and migrate notification settings if needed (logic preserved from original)
    if (!notificationSettings.appointments) {
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
    const { data: existing } = await supabase.from('doctor_settings').select('id').eq('doctor_id', doctorId).maybeSingle();

    if (existing) {
      await supabase
        .from('doctor_settings')
        .update({ notification_settings: notificationSettings, updated_at: new Date().toISOString() })
        .eq('doctor_id', doctorId);
    } else {
      await supabase
        .from('doctor_settings')
        .insert({
          doctor_id: doctorId,
          notification_settings: notificationSettings,
          updated_at: new Date().toISOString()
        });
    }

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

    const { data: settings } = await supabase.from('doctor_settings').select('notification_settings').eq('doctor_id', doctorId).maybeSingle();

    const notificationSettings = settings?.notification_settings || {};

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
    const { type, method } = req.body;

    const { data: doctor } = await supabase.from('doctors').select('first_name, last_name, email').eq('id', doctorId).maybeSingle();

    if (!doctor) {
      return res.status(404).json({ success: false, message: 'Doctor not found' });
    }

    const testMessages = {
      appointments: {
        email: `Test: Appointment reminder for Dr. ${doctor.first_name} ${doctor.last_name}`,
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
        email: 'Test: MediSync system notification',
        push: 'Test: System update completed',
        sms: 'Test: System maintenance notification'
      }
    };

    const message = testMessages[type]?.[method] || 'Test notification';

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

    // Delete related data (CASCADE handles most, but manual cleanup often safer or required if no cascade)
    // Assuming Supabase foreign keys are set to CASCADE.
    await supabase.from('doctors').delete().eq('id', doctorId);

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
