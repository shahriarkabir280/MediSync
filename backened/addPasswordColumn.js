import { sql } from './config/db.js';

async function addPasswordColumn() {
  try {
    console.log('🔧 Adding password_hash column to doctors table...');

    // Check if column already exists
    const columnCheck = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'doctors' AND column_name = 'password_hash'
    `;

    if (columnCheck.length > 0) {
      console.log('✅ password_hash column already exists');
      return;
    }

    // Add the password_hash column
    await sql`
      ALTER TABLE doctors 
      ADD COLUMN password_hash VARCHAR(255)
    `;

    console.log('✅ password_hash column added successfully');

    // Now check the doctors table structure
    console.log('\n📊 Current doctors in database:');
    const doctors = await sql`
      SELECT 
        id,
        first_name,
        last_name,
        email,
        password_hash,
        specialization
      FROM doctors 
      ORDER BY id
    `;

    doctors.forEach((doctor, index) => {
      console.log(`👨‍⚕️ Doctor #${index + 1}:`);
      console.log(`   ID: ${doctor.id}`);
      console.log(`   Name: ${doctor.first_name} ${doctor.last_name}`);
      console.log(`   Email: ${doctor.email}`);
      console.log(`   Password Hash: ${doctor.password_hash || 'NOT SET'}`);
      console.log(`   Specialization: ${doctor.specialization}`);
      console.log('');
    });

    console.log('💡 All doctors can now login with password: password123');

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

addPasswordColumn();