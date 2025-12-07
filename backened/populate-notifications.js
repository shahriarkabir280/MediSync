#!/usr/bin/env node

/**
 * Script to populate sample notifications for testing
 * 
 * Usage:
 * node populate-notifications.js [doctorId]
 */

import { sql } from './config/db.js';
import { createSampleNotifications } from './utils/notificationUtils.js';

async function populateNotifications() {
  try {
    console.log('🚀 Starting notification population...');
    
    // Get doctor ID from command line or use default
    const doctorId = process.argv[2] ? parseInt(process.argv[2]) : null;
    let finalDoctorId;
    
    if (!doctorId) {
      // Get the first doctor from database
      const doctors = await sql`SELECT id, first_name, last_name FROM doctors LIMIT 1`;
      
      if (doctors.length === 0) {
        console.log('❌ No doctors found in database. Please create a doctor first.');
        return;
      }
      
      const doctor = doctors[0];
      finalDoctorId = doctor.id;
      console.log(`📝 Using doctor: ${doctor.first_name} ${doctor.last_name} (ID: ${doctor.id})`);
      
      await createSampleNotifications(doctor.id);
      
    } else {
      // Use specified doctor ID
      const doctor = await sql`SELECT id, first_name, last_name FROM doctors WHERE id = ${doctorId}`;
      
      if (doctor.length === 0) {
        console.log(`❌ Doctor with ID ${doctorId} not found.`);
        return;
      }
      
      finalDoctorId = doctorId;
      console.log(`📝 Using doctor: ${doctor[0].first_name} ${doctor[0].last_name} (ID: ${doctorId})`);
      await createSampleNotifications(doctorId);
    }
    
    // Show final stats
    const stats = await sql`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN read = false THEN 1 END) as unread,
        COUNT(CASE WHEN priority = 'high' THEN 1 END) as high_priority
      FROM notifications 
      WHERE doctor_id = ${finalDoctorId}
    `;
    
    console.log('\n📊 Final Statistics:');
    console.log(`   Total notifications: ${stats[0].total}`);
    console.log(`   Unread: ${stats[0].unread}`);
    console.log(`   High priority: ${stats[0].high_priority}`);
    
    console.log('\n🎉 Notification population completed successfully!');
    
  } catch (error) {
    console.error('❌ Error populating notifications:', error);
  }
  
  process.exit(0);
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  populateNotifications();
}