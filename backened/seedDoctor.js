import { sql } from './config/db.js';

async function seedDoctorData() {
  try {
    console.log('🌱 Seeding doctor data for authentication...');

    // Check if doctor already exists
    const existingDoctors = await sql`
      SELECT id FROM doctors WHERE email = 'doctor@careconnect.com'
    `;

    if (existingDoctors.length > 0) {
      console.log('✅ Demo doctor already exists with email: doctor@careconnect.com');
      return;
    }

    // Insert demo doctor
    await sql`
      INSERT INTO doctors (
        first_name, 
        last_name, 
        email, 
        specialization,
        years_of_experience,
        bio,
        license_number
      ) VALUES (
        'Demo',
        'Doctor',
        'doctor@careconnect.com',
        'General Practice',
        10,
        'Demo doctor account for CareConnect system testing.',
        'DEMO123'
      )
    `;

    console.log('✅ Demo doctor created successfully!');
    console.log('📧 Email: doctor@careconnect.com');
    console.log('🔑 Password: password123');
    
  } catch (error) {
    console.error('❌ Error seeding doctor data:', error);
  }
}

// Run the seed function
seedDoctorData();