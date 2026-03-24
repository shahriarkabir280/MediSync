// Migration: Add missing columns to website-related tables
import { supabase } from '../config/db.js';

async function runMigration() {
  console.log('🔄 Running website tables migration...');

  try {
    // Add missing columns to doctor_services
    const { error: e1 } = await supabase.rpc('exec_sql', {
      sql: `ALTER TABLE doctor_services ADD COLUMN IF NOT EXISTS features TEXT;`
    });
    const { error: e2 } = await supabase.rpc('exec_sql', {
      sql: `ALTER TABLE doctor_services ADD COLUMN IF NOT EXISTS color_theme VARCHAR(100) DEFAULT 'from-blue-500 to-cyan-500';`
    });

    // Add missing columns to doctor_chambers
    const { error: e3 } = await supabase.rpc('exec_sql', {
      sql: `ALTER TABLE doctor_chambers ADD COLUMN IF NOT EXISTS day VARCHAR(50);`
    });

    // Add missing columns to doctor_testimonials
    const { error: e4 } = await supabase.rpc('exec_sql', {
      sql: `ALTER TABLE doctor_testimonials ADD COLUMN IF NOT EXISTS rating INTEGER DEFAULT 5;`
    });
    const { error: e5 } = await supabase.rpc('exec_sql', {
      sql: `ALTER TABLE doctor_testimonials ADD COLUMN IF NOT EXISTS location VARCHAR(255);`
    });
    const { error: e6 } = await supabase.rpc('exec_sql', {
      sql: `ALTER TABLE doctor_testimonials ADD COLUMN IF NOT EXISTS avatar_url VARCHAR(500);`
    });

    console.log('✅ Migration completed!');
    if (e1) console.warn('services.features:', e1.message);
    if (e2) console.warn('services.color_theme:', e2.message);
    if (e3) console.warn('chambers.day:', e3.message);
    if (e4) console.warn('testimonials.rating:', e4.message);
    if (e5) console.warn('testimonials.location:', e5.message);
    if (e6) console.warn('testimonials.avatar_url:', e6.message);
  } catch (err) {
    console.error('Migration error:', err);
  }
}

runMigration();
