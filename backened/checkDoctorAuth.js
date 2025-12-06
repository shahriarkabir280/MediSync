import { sql } from './config/db.js';

async function checkDoctorAuth() {
  try {
    console.log('🔍 Checking doctor authentication data in database...\n');

    // Get all doctors with their email and password info
    const doctors = await sql`
      SELECT 
        id,
        first_name,
        last_name,
        email,
        password_hash,
        specialization,
        created_at
      FROM doctors 
      ORDER BY id
    `;

    console.log(`📊 Total doctors found: ${doctors.length}\n`);

    if (doctors.length === 0) {
      console.log('❌ No doctors found in database!');
      return;
    }

    doctors.forEach((doctor, index) => {
      console.log(`👨‍⚕️ Doctor #${index + 1}:`);
      console.log(`   ID: ${doctor.id}`);
      console.log(`   Name: ${doctor.first_name} ${doctor.last_name}`);
      console.log(`   Email: ${doctor.email}`);
      console.log(`   Password Hash: ${doctor.password_hash ? 'EXISTS' : 'NOT SET'}`);
      console.log(`   Specialization: ${doctor.specialization}`);
      console.log(`   Created: ${doctor.created_at}`);
      console.log('');
    });

    // Check specifically for john.doe@careconnect.com
    const johnDoe = await sql`
      SELECT * FROM doctors WHERE email = 'john.doe@careconnect.com'
    `;

    console.log('🎯 Checking for john.doe@careconnect.com:');
    if (johnDoe.length > 0) {
      console.log('✅ Found john.doe@careconnect.com');
      console.log(`   Has password_hash: ${johnDoe[0].password_hash ? 'YES' : 'NO'}`);
    } else {
      console.log('❌ john.doe@careconnect.com NOT FOUND');
    }

    // Check for the demo doctor we created
    const demoDoctor = await sql`
      SELECT * FROM doctors WHERE email = 'doctor@careconnect.com'
    `;

    console.log('\n🎯 Checking for doctor@careconnect.com:');
    if (demoDoctor.length > 0) {
      console.log('✅ Found doctor@careconnect.com');
      console.log(`   Has password_hash: ${demoDoctor[0].password_hash ? 'YES' : 'NO'}`);
    } else {
      console.log('❌ doctor@careconnect.com NOT FOUND');
    }

    console.log('\n💡 For login, you can use:');
    console.log('   Email: Any of the emails above');
    console.log('   Password: password123 (works for any doctor without password_hash)');

  } catch (error) {
    console.error('❌ Error checking doctor authentication data:', error);
  }
}

// Run the check
checkDoctorAuth();