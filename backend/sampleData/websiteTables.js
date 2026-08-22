import { sql } from '../config/db.js';

export async function initWebsiteTables() {
  try {
    console.log('🔄 Initializing website-related database tables...');

    // Website Settings Table
    await sql`
      CREATE TABLE IF NOT EXISTS website_settings (
        id SERIAL PRIMARY KEY,
        doctor_id INTEGER UNIQUE REFERENCES doctors(id) ON DELETE CASCADE,
        title VARCHAR(255) DEFAULT 'Dr. Profile',
        tagline TEXT,
        description TEXT,
        theme_color VARCHAR(7) DEFAULT '#2563eb',
        layout_style VARCHAR(50) DEFAULT 'modern',
        show_phone BOOLEAN DEFAULT true,
        show_email BOOLEAN DEFAULT true,
        show_address BOOLEAN DEFAULT true,
        show_appointment BOOLEAN DEFAULT true,
        show_social BOOLEAN DEFAULT true,
        meta_keywords TEXT,
        url_slug VARCHAR(255) UNIQUE,
        visibility BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Doctor Education Table
    await sql`
      CREATE TABLE IF NOT EXISTS doctor_education (
        id SERIAL PRIMARY KEY,
        doctor_id INTEGER REFERENCES doctors(id) ON DELETE CASCADE,
        degree VARCHAR(255) NOT NULL,
        institution VARCHAR(255) NOT NULL,
        passing_year INTEGER,
        short_description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Doctor Experience Table
    await sql`
      CREATE TABLE IF NOT EXISTS doctor_experience (
        id SERIAL PRIMARY KEY,
        doctor_id INTEGER REFERENCES doctors(id) ON DELETE CASCADE,
        designation VARCHAR(255) NOT NULL,
        organization VARCHAR(255) NOT NULL,
        start_date DATE,
        end_date DATE,
        short_description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Doctor Services Table
    await sql`
      CREATE TABLE IF NOT EXISTS doctor_services (
        id SERIAL PRIMARY KEY,
        doctor_id INTEGER REFERENCES doctors(id) ON DELETE CASCADE,
        service_icon VARCHAR(100),
        service_name VARCHAR(255) NOT NULL,
        service_description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Doctor Chambers Table
    await sql`
      CREATE TABLE IF NOT EXISTS doctor_chambers (
        id SERIAL PRIMARY KEY,
        doctor_id INTEGER REFERENCES doctors(id) ON DELETE CASCADE,
        chamber_location TEXT NOT NULL,
        available_time VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Doctor Testimonials Table
    await sql`
      CREATE TABLE IF NOT EXISTS doctor_testimonials (
        id SERIAL PRIMARY KEY,
        doctor_id INTEGER REFERENCES doctors(id) ON DELETE CASCADE,
        patient_name VARCHAR(255) NOT NULL,
        patient_feedback TEXT NOT NULL,
        feedback_date DATE DEFAULT CURRENT_DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Doctor Sponsors Table
    await sql`
      CREATE TABLE IF NOT EXISTS doctor_sponsors (
        id SERIAL PRIMARY KEY,
        doctor_id INTEGER REFERENCES doctors(id) ON DELETE CASCADE,
        organization_logo VARCHAR(500),
        organization_name VARCHAR(255) NOT NULL,
        organization_description TEXT,
        start_date DATE,
        end_date DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Doctor Social Media Table
    await sql`
      CREATE TABLE IF NOT EXISTS doctor_social_media (
        id SERIAL PRIMARY KEY,
        doctor_id INTEGER REFERENCES doctors(id) ON DELETE CASCADE,
        platform VARCHAR(50) NOT NULL,
        profile_url VARCHAR(500) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(doctor_id, platform)
      )
    `;

    // Doctor Contact Table
    await sql`
      CREATE TABLE IF NOT EXISTS doctor_contact (
        id SERIAL PRIMARY KEY,
        doctor_id INTEGER UNIQUE REFERENCES doctors(id) ON DELETE CASCADE,
        phone VARCHAR(20),
        whatsapp VARCHAR(20),
        email VARCHAR(255),
        address TEXT,
        emergency_contact_name VARCHAR(255),
        emergency_contact_phone VARCHAR(20),
        office_phone VARCHAR(20),
        fax VARCHAR(20),
        website_url VARCHAR(500),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Create indexes for better performance
    console.log('📊 Creating performance indexes...');
    
    await sql`CREATE INDEX IF NOT EXISTS idx_website_settings_doctor_id ON website_settings(doctor_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_website_settings_url_slug ON website_settings(url_slug)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_website_settings_visibility ON website_settings(visibility)`;
    
    await sql`CREATE INDEX IF NOT EXISTS idx_doctor_education_doctor_id ON doctor_education(doctor_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_doctor_education_year ON doctor_education(passing_year DESC)`;
    
    await sql`CREATE INDEX IF NOT EXISTS idx_doctor_experience_doctor_id ON doctor_experience(doctor_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_doctor_experience_dates ON doctor_experience(start_date DESC, end_date DESC)`;
    
    await sql`CREATE INDEX IF NOT EXISTS idx_doctor_services_doctor_id ON doctor_services(doctor_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_doctor_chambers_doctor_id ON doctor_chambers(doctor_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_doctor_testimonials_doctor_id ON doctor_testimonials(doctor_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_doctor_testimonials_date ON doctor_testimonials(feedback_date DESC)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_doctor_sponsors_doctor_id ON doctor_sponsors(doctor_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_doctor_social_media_doctor_id ON doctor_social_media(doctor_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_doctor_contact_doctor_id ON doctor_contact(doctor_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_doctor_contact_email ON doctor_contact(email)`;

    // Add some sample data for better performance testing
    console.log('📝 Adding sample website data...');
    
    // Insert sample website settings
    await sql`
      INSERT INTO website_settings (
        doctor_id, title, tagline, description, url_slug, visibility
      ) VALUES 
        (1, 'Dr. John Doe - Cardiologist', 'Caring for Your Heart Health', 
         'Experienced cardiologist providing comprehensive heart care services.', 
         'dr-john-doe', true)
      ON CONFLICT (doctor_id) DO NOTHING
    `;

    // Insert sample education
    await sql`
      INSERT INTO doctor_education (
        doctor_id, degree, institution, passing_year, short_description
      ) VALUES 
        (1, 'MBBS', 'Harvard Medical School', 2010, 'Bachelor of Medicine and Surgery'),
        (1, 'MD Cardiology', 'Johns Hopkins University', 2014, 'Specialization in Cardiovascular Medicine')
      ON CONFLICT DO NOTHING
    `;

    // Insert sample experience
    await sql`
      INSERT INTO doctor_experience (
        doctor_id, designation, organization, start_date, end_date, short_description
      ) VALUES 
        (1, 'Senior Cardiologist', 'City General Hospital', '2014-01-01', '2020-12-31', 'Led cardiology department for 6 years'),
        (1, 'Chief of Cardiology', 'Metropolitan Heart Center', '2021-01-01', NULL, 'Currently serving as department head')
      ON CONFLICT DO NOTHING
    `;

    // Insert sample services
    await sql`
      INSERT INTO doctor_services (
        doctor_id, service_icon, service_name, service_description
      ) VALUES 
        (1, '🫀', 'Cardiac Consultation', 'Comprehensive heart health assessment and diagnosis'),
        (1, '📊', 'ECG & Echo Tests', 'Advanced cardiac testing and monitoring'),
        (1, '💊', 'Medication Management', 'Personalized cardiac medication planning')
      ON CONFLICT DO NOTHING
    `;

    // Insert sample chambers
    await sql`
      INSERT INTO doctor_chambers (
        doctor_id, chamber_location, available_time
      ) VALUES 
        (1, 'Metropolitan Heart Center, 123 Medical Ave, Suite 400', 'Mon-Fri: 9:00 AM - 5:00 PM'),
        (1, 'Downtown Medical Plaza, 456 Health St, Floor 2', 'Tue, Thu: 6:00 PM - 8:00 PM')
      ON CONFLICT DO NOTHING
    `;

    // Insert sample testimonials
    await sql`
      INSERT INTO doctor_testimonials (
        doctor_id, patient_name, patient_feedback, feedback_date
      ) VALUES 
        (1, 'Sarah Johnson', 'Dr. Doe saved my life with his expert diagnosis and treatment. Highly recommended!', '2024-11-15'),
        (1, 'Michael Chen', 'Excellent bedside manner and thorough care. Best cardiologist in the city.', '2024-11-20'),
        (1, 'Emily Rodriguez', 'Professional, knowledgeable, and truly cares about patient outcomes.', '2024-11-25')
      ON CONFLICT DO NOTHING
    `;

    // Insert sample social media
    await sql`
      INSERT INTO doctor_social_media (
        doctor_id, platform, profile_url
      ) VALUES 
        (1, 'facebook', 'https://facebook.com/drjohndoe'),
        (1, 'twitter', 'https://twitter.com/drjohndoe'),
        (1, 'linkedin', 'https://linkedin.com/in/drjohndoe')
      ON CONFLICT (doctor_id, platform) DO NOTHING
    `;

    // Insert sample contact information
    await sql`
      INSERT INTO doctor_contact (
        doctor_id, phone, whatsapp, email, address, office_phone
      ) VALUES 
        (1, '+1-555-0101', '+1-555-0101', 'john.doe@medisync.com', 
         '123 Medical Avenue, Suite 400, Metropolitan Heart Center, New York, NY 10001',
         '+1-555-0102')
      ON CONFLICT (doctor_id) DO NOTHING
    `;

    console.log('✅ Website tables and sample data initialized successfully!');
    
    return {
      success: true,
      tables_created: [
        'website_settings',
        'doctor_education', 
        'doctor_experience',
        'doctor_services',
        'doctor_chambers',
        'doctor_testimonials',
        'doctor_sponsors',
        'doctor_social_media',
        'doctor_contact'
      ],
      indexes_created: 12,
      sample_data_added: true
    };

  } catch (error) {
    console.error('❌ Error initializing website tables:', error);
    throw error;
  }
}

// Auto-run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  initWebsiteTables()
    .then((result) => {
      console.log('📊 Initialization Summary:', result);
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Initialization failed:', error);
      process.exit(1);
    });
}