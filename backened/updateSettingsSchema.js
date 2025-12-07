import { sql } from './config/db.js';

async function updateSettingsSchema() {
  try {
    console.log('🔄 Updating database schema for settings...');

    // Add 2FA columns to doctors table if they don't exist
    try {
      await sql`ALTER TABLE doctors ADD COLUMN IF NOT EXISTS two_factor_enabled BOOLEAN DEFAULT false`;
      console.log('✅ Added two_factor_enabled column to doctors table');
    } catch (error) {
      console.log('ℹ️ two_factor_enabled column already exists or error:', error.message);
    }

    try {
      await sql`ALTER TABLE doctors ADD COLUMN IF NOT EXISTS backup_codes JSONB`;
      console.log('✅ Added backup_codes column to doctors table');
    } catch (error) {
      console.log('ℹ️ backup_codes column already exists or error:', error.message);
    }

    // Add settings columns to doctor_settings table if they don't exist
    try {
      await sql`ALTER TABLE doctor_settings ADD COLUMN IF NOT EXISTS notification_settings JSONB`;
      console.log('✅ Added notification_settings column to doctor_settings table');
    } catch (error) {
      console.log('ℹ️ notification_settings column already exists or error:', error.message);
    }

    try {
      await sql`ALTER TABLE doctor_settings ADD COLUMN IF NOT EXISTS billing_settings JSONB`;
      console.log('✅ Added billing_settings column to doctor_settings table');
    } catch (error) {
      console.log('ℹ️ billing_settings column already exists or error:', error.message);
    }

    try {
      await sql`ALTER TABLE doctor_settings ADD COLUMN IF NOT EXISTS payment_methods JSONB`;
      console.log('✅ Added payment_methods column to doctor_settings table');
    } catch (error) {
      console.log('ℹ️ payment_methods column already exists or error:', error.message);
    }

    console.log('🎉 Database schema update completed!');
    
  } catch (error) {
    console.error('❌ Error updating database schema:', error);
    throw error;
  }
}

// Auto-run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  updateSettingsSchema()
    .then(() => {
      console.log('✅ Schema update successful');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Schema update failed:', error);
      process.exit(1);
    });
}

export { updateSettingsSchema };