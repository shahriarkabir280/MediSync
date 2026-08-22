import { supabase } from '../config/db.js';

// Helper function to create sample notifications for testing
export const createSampleNotifications = async (doctorId) => {
  try {
    console.log(`Creating sample notifications for doctor ${doctorId}...`);

    const sampleNotifications = [
      {
        type: 'appointment',
        title: 'New Appointment Scheduled',
        message: 'John Doe has scheduled an appointment for tomorrow at 2:00 PM',
        priority: 'high',
        actionable: true,
        data: { patientName: 'John Doe', appointmentTime: '2:00 PM' }
      },
      {
        type: 'billing',
        title: 'Payment Received',
        message: 'Payment of $150 received from Sarah Johnson for consultation',
        priority: 'medium',
        actionable: false,
        data: { amount: 150, patientName: 'Sarah Johnson' }
      },
      {
        type: 'chat',
        title: 'New Message',
        message: 'You have a new message from Dr. Smith regarding patient care protocols',
        priority: 'medium',
        actionable: true,
        data: { sender: 'Dr. Smith', subject: 'Patient care protocols' }
      },
      {
        type: 'appointment',
        title: 'Appointment Cancelled',
        message: 'Michael Brown has cancelled his appointment scheduled for Friday 10:00 AM',
        priority: 'low',
        actionable: true,
        data: { patientName: 'Michael Brown', appointmentTime: 'Friday 10:00 AM' },
        read: true
      },
      {
        type: 'patients',
        title: 'Patient Registration',
        message: 'New patient Emma Wilson has registered and completed medical history',
        priority: 'low',
        actionable: true,
        data: { patientName: 'Emma Wilson' },
        read: true,
        created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        type: 'system',
        title: 'System Update',
        message: 'MediSync will be undergoing maintenance tonight from 2:00 AM to 4:00 AM',
        priority: 'low',
        actionable: false,
        data: { maintenanceTime: '2:00 AM to 4:00 AM' },
        read: true,
        created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        type: 'billing',
        title: 'Invoice Overdue',
        message: 'Invoice #INV-2024-001 for Robert Davis is 7 days overdue',
        priority: 'high',
        actionable: true,
        data: { invoiceId: 'INV-2024-001', patientName: 'Robert Davis', daysOverdue: 7 }
      }
    ];

    const notificationsToInsert = sampleNotifications.map(n => ({
      doctor_id: doctorId,
      type: n.type,
      title: n.title,
      message: n.message,
      data: n.data,
      priority: n.priority,
      actionable: n.actionable,
      read: n.read || false,
      created_at: n.created_at || new Date().toISOString()
    }));

    const { error } = await supabase.from('notifications').insert(notificationsToInsert);
    if (error) throw error;

    console.log(`✅ Created ${sampleNotifications.length} sample notifications`);
    return sampleNotifications.length;

  } catch (error) {
    console.error('❌ Error creating sample notifications:', error);
    throw error;
  }
};

// Helper function to create appointment notifications
export const createAppointmentNotification = async (doctorId, appointmentData) => {
  try {
    const { action, patientName, appointmentTime, appointmentDate } = appointmentData;

    let title, message, priority;

    switch (action) {
      case 'scheduled':
        title = 'New Appointment Scheduled';
        message = `${patientName} has scheduled an appointment for ${appointmentDate} at ${appointmentTime}`;
        priority = 'high';
        break;
      case 'cancelled':
        title = 'Appointment Cancelled';
        message = `${patientName} has cancelled their appointment scheduled for ${appointmentDate} at ${appointmentTime}`;
        priority = 'medium';
        break;
      case 'rescheduled':
        title = 'Appointment Rescheduled';
        message = `${patientName} has rescheduled their appointment to ${appointmentDate} at ${appointmentTime}`;
        priority = 'medium';
        break;
      case 'reminder':
        title = 'Appointment Reminder';
        message = `Reminder: Appointment with ${patientName} in 1 hour at ${appointmentTime}`;
        priority = 'high';
        break;
      default:
        title = 'Appointment Update';
        message = `Appointment update for ${patientName}`;
        priority = 'medium';
    }

    const { data, error } = await supabase
      .from('notifications')
      .insert({
        doctor_id: doctorId,
        type: 'appointment',
        title,
        message,
        data: appointmentData,
        priority,
        actionable: true,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating appointment notification:', error);
    throw error;
  }
};

// Helper function to create billing notifications
export const createBillingNotification = async (doctorId, billingData) => {
  try {
    const { action, amount, patientName, invoiceId } = billingData;

    let title, message, priority;

    switch (action) {
      case 'payment_received':
        title = 'Payment Received';
        message = `Payment of $${amount} received from ${patientName}`;
        priority = 'medium';
        break;
      case 'invoice_created':
        title = 'New Invoice Created';
        message = `Invoice ${invoiceId} created for ${patientName} - Amount: $${amount}`;
        priority = 'low';
        break;
      case 'invoice_overdue':
        title = 'Invoice Overdue';
        message = `Invoice ${invoiceId} for ${patientName} is overdue - Amount: $${amount}`;
        priority = 'high';
        break;
      case 'payment_failed':
        title = 'Payment Failed';
        message = `Payment attempt failed for ${patientName} - Amount: $${amount}`;
        priority = 'high';
        break;
      default:
        title = 'Billing Update';
        message = `Billing update for ${patientName}`;
        priority = 'medium';
    }

    const { data, error } = await supabase
      .from('notifications')
      .insert({
        doctor_id: doctorId,
        type: 'billing',
        title,
        message,
        data: billingData,
        priority,
        actionable: true,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating billing notification:', error);
    throw error;
  }
};

// Helper function to create patient notifications
export const createPatientNotification = async (doctorId, patientData) => {
  try {
    const { action, patientName, patientId } = patientData;

    let title, message, priority;

    switch (action) {
      case 'registered':
        title = 'New Patient Registration';
        message = `${patientName} has registered as a new patient`;
        priority = 'medium';
        break;
      case 'updated_profile':
        title = 'Patient Profile Updated';
        message = `${patientName} has updated their medical profile`;
        priority = 'low';
        break;
      case 'emergency_contact':
        title = 'Emergency Contact Alert';
        message = `Emergency contact attempted for patient ${patientName}`;
        priority = 'high';
        break;
      default:
        title = 'Patient Update';
        message = `Update for patient ${patientName}`;
        priority = 'medium';
    }

    const { data, error } = await supabase
      .from('notifications')
      .insert({
        doctor_id: doctorId,
        type: 'patients',
        title,
        message,
        data: patientData,
        priority,
        actionable: true,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating patient notification:', error);
    throw error;
  }
};

// Helper function to create system notifications
export const createSystemNotification = async (doctorId, systemData) => {
  try {
    const { type, title, message, priority = 'low', expiresAt } = systemData;

    const { data, error } = await supabase
      .from('notifications')
      .insert({
        doctor_id: doctorId,
        type: 'system',
        title,
        message,
        data: systemData,
        priority,
        actionable: false,
        expires_at: expiresAt,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating system notification:', error);
    throw error;
  }
};

// Clean up expired notifications
export const cleanupExpiredNotifications = async () => {
  try {
    // Delete where expires_at < NOW and created_at < 7 days ago
    const now = new Date().toISOString();
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    const { count, error } = await supabase
      .from('notifications')
      .delete({ count: 'exact' })
      .lt('expires_at', now)
      .lt('created_at', sevenDaysAgo);

    if (error) throw error;

    console.log(`🧹 Cleaned up ${count} expired notifications`);
    return count;
  } catch (error) {
    console.error('Error cleaning up expired notifications:', error);
    throw error;
  }
};

// Get notification counts for a doctor
export const getNotificationCounts = async (doctorId) => {
  try {
    // Supabase doesn't support complex aggregated Case logic in one query easily without RPC.
    // We can run separate queries or fetch all minimal metadata.
    // Fetching minimal metadata is fine if not thousands.
    // Or just run 4 separate count queries.

    const { count: total, error: tErr } = await supabase.from('notifications').select('*', { count: 'exact', head: true }).eq('doctor_id', doctorId);
    if (tErr) throw tErr;

    const { count: unread, error: uErr } = await supabase.from('notifications').select('*', { count: 'exact', head: true }).eq('doctor_id', doctorId).eq('read', false);
    if (uErr) throw uErr;

    const { count: high, error: hErr } = await supabase.from('notifications').select('*', { count: 'exact', head: true }).eq('doctor_id', doctorId).eq('priority', 'high');
    if (hErr) throw hErr;

    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { count: today, error: dErr } = await supabase.from('notifications').select('*', { count: 'exact', head: true }).eq('doctor_id', doctorId).gte('created_at', twentyFourHoursAgo);
    if (dErr) throw dErr;

    return {
      total,
      unread,
      high_priority: high,
      today
    };
  } catch (error) {
    console.error('Error getting notification counts:', error);
    throw error;
  }
};