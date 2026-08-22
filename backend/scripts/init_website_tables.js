import { sql } from '../config/db.js';
import dotenv from 'dotenv';

dotenv.config();

async function initWebsiteTables() {
    try {
        console.log('🏗️  Initializing Website Tables...');

        // 1. Website Settings (Extended)
        await sql`
      CREATE TABLE IF NOT EXISTS website_settings (
        id SERIAL PRIMARY KEY,
        doctor_id INTEGER REFERENCES doctors(id) ON DELETE CASCADE,
        title VARCHAR(255),
        tagline VARCHAR(255),
        description TEXT,
        theme_color VARCHAR(50) DEFAULT '#2563eb',
        layout_style VARCHAR(50) DEFAULT 'modern',
        show_phone BOOLEAN DEFAULT true,
        show_email BOOLEAN DEFAULT true,
        show_address BOOLEAN DEFAULT true,
        show_appointment BOOLEAN DEFAULT true,
        show_social BOOLEAN DEFAULT true,
        meta_keywords TEXT,
        url_slug VARCHAR(100) UNIQUE,
        visibility BOOLEAN DEFAULT true,
        -- New JSON fields for complex configs
        hero JSONB DEFAULT '{}',
        about JSONB DEFAULT '{}',
        stats JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(doctor_id)
      )
    `;
        console.log('✓ Verified website_settings table');

        // 2. Doctor Social Media
        await sql`
      CREATE TABLE IF NOT EXISTS doctor_social_media (
        id SERIAL PRIMARY KEY,
        doctor_id INTEGER REFERENCES doctors(id) ON DELETE CASCADE,
        platform VARCHAR(50),
        profile_url TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
        console.log('✓ Verified doctor_social_media table');

        // 3. Doctor Contact (Extended)
        await sql`
      CREATE TABLE IF NOT EXISTS doctor_contact (
        id SERIAL PRIMARY KEY,
        doctor_id INTEGER REFERENCES doctors(id) ON DELETE CASCADE,
        phone VARCHAR(50),
        whatsapp VARCHAR(50),
        email VARCHAR(255),
        address TEXT,
        office_phone VARCHAR(50),
        website_url TEXT,
        emergency_contact_name VARCHAR(100),
        emergency_contact_phone VARCHAR(50),
        fax VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(doctor_id)
      )
    `;
        console.log('✓ Verified doctor_contact table');

        // 4. Doctor Education (Extended with type)
        await sql`
      CREATE TABLE IF NOT EXISTS doctor_education (
        id SERIAL PRIMARY KEY,
        doctor_id INTEGER REFERENCES doctors(id) ON DELETE CASCADE,
        degree VARCHAR(255),
        institution VARCHAR(255),
        passing_year VARCHAR(50),
        short_description TEXT,
        type VARCHAR(50) DEFAULT 'certification', -- certification, fellowship, postgraduate, undergraduate
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
        // Add type column if it doesn't exist (migrations for existing dbs)
        try {
            await sql`ALTER TABLE doctor_education ADD COLUMN IF NOT EXISTS type VARCHAR(50) DEFAULT 'certification'`;
        } catch (e) { console.log('  - Edu type col exists perharps'); }
        console.log('✓ Verified doctor_education table');

        // 5. Doctor Experience (Extended with type)
        await sql`
      CREATE TABLE IF NOT EXISTS doctor_experience (
        id SERIAL PRIMARY KEY,
        doctor_id INTEGER REFERENCES doctors(id) ON DELETE CASCADE,
        designation VARCHAR(255),
        organization VARCHAR(255),
        start_date DATE,
        end_date DATE,
        short_description TEXT,
        type VARCHAR(50) DEFAULT 'current', -- current, previous, training, foundation
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
        try {
            await sql`ALTER TABLE doctor_experience ADD COLUMN IF NOT EXISTS type VARCHAR(50) DEFAULT 'current'`;
        } catch (e) { }
        console.log('✓ Verified doctor_experience table');

        // 6. Doctor Services (Extended with features, color)
        await sql`
      CREATE TABLE IF NOT EXISTS doctor_services (
        id SERIAL PRIMARY KEY,
        doctor_id INTEGER REFERENCES doctors(id) ON DELETE CASCADE,
        service_icon VARCHAR(100),
        service_name VARCHAR(255),
        service_description TEXT,
        features TEXT, -- Comma separated or JSON
        color_theme VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
        try {
            await sql`ALTER TABLE doctor_services ADD COLUMN IF NOT EXISTS features TEXT`;
            await sql`ALTER TABLE doctor_services ADD COLUMN IF NOT EXISTS color_theme VARCHAR(100)`;
        } catch (e) { }
        console.log('✓ Verified doctor_services table');

        // 7. Doctor Chambers (Extended with day)
        await sql`
      CREATE TABLE IF NOT EXISTS doctor_chambers (
        id SERIAL PRIMARY KEY,
        doctor_id INTEGER REFERENCES doctors(id) ON DELETE CASCADE,
        chamber_location TEXT,
        available_time TEXT, -- Keep this for backward compat or flexible time range
        day VARCHAR(20), -- Sunday, Monday etc.
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
        try {
            await sql`ALTER TABLE doctor_chambers ADD COLUMN IF NOT EXISTS day VARCHAR(20)`;
        } catch (e) { }
        console.log('✓ Verified doctor_chambers table');

        // 8. Doctor Testimonials (Extended)
        await sql`
      CREATE TABLE IF NOT EXISTS doctor_testimonials (
        id SERIAL PRIMARY KEY,
        doctor_id INTEGER REFERENCES doctors(id) ON DELETE CASCADE,
        patient_name VARCHAR(255),
        patient_feedback TEXT,
        feedback_date DATE DEFAULT CURRENT_DATE,
        rating INTEGER DEFAULT 5,
        location VARCHAR(255),
        avatar_url TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
        try {
            await sql`ALTER TABLE doctor_testimonials ADD COLUMN IF NOT EXISTS rating INTEGER DEFAULT 5`;
            await sql`ALTER TABLE doctor_testimonials ADD COLUMN IF NOT EXISTS location VARCHAR(255)`;
            await sql`ALTER TABLE doctor_testimonials ADD COLUMN IF NOT EXISTS avatar_url TEXT`;
        } catch (e) { }
        console.log('✓ Verified doctor_testimonials table');

        // 9. Doctor Sponsors (Affiliates)
        await sql`
      CREATE TABLE IF NOT EXISTS doctor_sponsors (
        id SERIAL PRIMARY KEY,
        doctor_id INTEGER REFERENCES doctors(id) ON DELETE CASCADE,
        organization_name VARCHAR(255),
        organization_logo TEXT, -- URL or letters
        organization_description TEXT,
        start_date DATE,
        end_date DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
        console.log('✓ Verified doctor_sponsors table');

        // 10. Helper: Update Column method for JSONB fields in website_settings if table existed but cols didn't
        try {
            await sql`ALTER TABLE website_settings ADD COLUMN IF NOT EXISTS hero JSONB DEFAULT '{}'`;
            await sql`ALTER TABLE website_settings ADD COLUMN IF NOT EXISTS about JSONB DEFAULT '{}'`;
            await sql`ALTER TABLE website_settings ADD COLUMN IF NOT EXISTS stats JSONB DEFAULT '{}'`;
        } catch (e) {
            console.log('  - JSON schemas update skipped (cols might exist)');
        }

        console.log('✅ Website Tables Initialized Successfully');
        process.exit(0);

    } catch (error) {
        console.error('❌ Error initializing website tables:', error);
        process.exit(1);
    }
}

initWebsiteTables();
