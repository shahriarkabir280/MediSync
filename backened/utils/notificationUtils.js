import { sql } from '../config/db.js';

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
        created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) // 1 day ago
      },
      {
        type: 'system',
        title: 'System Update',
        message: 'CareConnect will be undergoing maintenance tonight from 2:00 AM to 4:00 AM',
        priority: 'low',
        actionable: false,
        data: { maintenanceTime: '2:00 AM to 4:00 AM' },
        read: true,
        created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) // 2 days ago
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

    for (const notification of sampleNotifications) {
      await sql`
        INSERT INTO notifications (
          doctor_id, type, title, message, data, priority, 
          actionable, read, created_at
        )
        VALUES (
          ${doctorId}, 
          ${notification.type}, 
          ${notification.title}, 
          ${notification.message}, 
          ${JSON.stringify(notification.data)}, 
          ${notification.priority},
          ${notification.actionable}, 
          ${notification.read || false},
          ${notification.created_at || new Date()}
        )
      `;
    }

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

    const result = await sql`
      INSERT INTO notifications (
        doctor_id, type, title, message, data, priority, actionable
      )
      VALUES (
        ${doctorId}, 'appointment', ${title}, ${message}, 
        ${JSON.stringify(appointmentData)}, ${priority}, true
      )
      RETURNING *
    `;

    return result[0];
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

    const result = await sql`
      INSERT INTO notifications (
        doctor_id, type, title, message, data, priority, actionable
      )
      VALUES (
        ${doctorId}, 'billing', ${title}, ${message}, 
        ${JSON.stringify(billingData)}, ${priority}, true
      )
      RETURNING *
    `;

    return result[0];
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

    const result = await sql`
      INSERT INTO notifications (
        doctor_id, type, title, message, data, priority, actionable
      )
      VALUES (
        ${doctorId}, 'patients', ${title}, ${message}, 
        ${JSON.stringify(patientData)}, ${priority}, true
      )
      RETURNING *
    `;

    return result[0];
  } catch (error) {
    console.error('Error creating patient notification:', error);
    throw error;
  }
};

// Helper function to create system notifications
export const createSystemNotification = async (doctorId, systemData) => {
  try {
    const { type, title, message, priority = 'low', expiresAt } = systemData;
    
    const result = await sql`
      INSERT INTO notifications (
        doctor_id, type, title, message, data, priority, 
        actionable, expires_at
      )
      VALUES (
        ${doctorId}, 'system', ${title}, ${message}, 
        ${JSON.stringify(systemData)}, ${priority}, false, ${expiresAt}
      )
      RETURNING *
    `;

    return result[0];
  } catch (error) {
    console.error('Error creating system notification:', error);
    throw error;
  }
};

// Clean up expired notifications
export const cleanupExpiredNotifications = async () => {
  try {
    const result = await sql`
      DELETE FROM notifications 
      WHERE expires_at IS NOT NULL 
      AND expires_at < NOW()
      AND created_at < NOW() - INTERVAL '7 days'
    `;

    console.log(`🧹 Cleaned up ${result.length} expired notifications`);
    return result.length;
  } catch (error) {
    console.error('Error cleaning up expired notifications:', error);
    throw error;
  }
};

// Get notification counts for a doctor
export const getNotificationCounts = async (doctorId) => {
  try {
    const counts = await sql`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN read = false THEN 1 END) as unread,
        COUNT(CASE WHEN priority = 'high' THEN 1 END) as high_priority,
        COUNT(CASE WHEN created_at >= NOW() - INTERVAL '24 hours' THEN 1 END) as today
      FROM notifications 
      WHERE doctor_id = ${doctorId}
    `;

    return counts[0];
  } catch (error) {
    console.error('Error getting notification counts:', error);
    throw error;
  }
};