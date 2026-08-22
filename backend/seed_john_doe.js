/**
 * Seed script: Populate comprehensive website data for Dr. John Doe (doctor_id = 5)
 * Run: node seed_john_doe.js
 */
import { supabase } from './config/db.js';

const DOCTOR_ID = 5;

async function addMissingColumns() {
  console.log('🔄 Adding missing columns...');
  const queries = [
    `ALTER TABLE doctor_services ADD COLUMN IF NOT EXISTS features TEXT`,
    `ALTER TABLE doctor_services ADD COLUMN IF NOT EXISTS color_theme VARCHAR(100) DEFAULT 'from-blue-500 to-cyan-500'`,
    `ALTER TABLE doctor_chambers ADD COLUMN IF NOT EXISTS day VARCHAR(50)`,
    `ALTER TABLE doctor_testimonials ADD COLUMN IF NOT EXISTS rating INTEGER DEFAULT 5`,
    `ALTER TABLE doctor_testimonials ADD COLUMN IF NOT EXISTS location VARCHAR(255)`,
    `ALTER TABLE doctor_testimonials ADD COLUMN IF NOT EXISTS avatar_url VARCHAR(500)`,
  ];
  for (const q of queries) {
    try {
      await sql`${q}`;
    } catch (e) {
      // column might already exist - ignore
      console.log(`  ℹ️  ${e.message}`);
    }
  }
  console.log('✅ Columns ready.');
}

async function seedWebsiteSettings() {
  console.log('🌐 Seeding website_settings...');
  const heroData = {
    title_prefix: "Your Health,",
    title_highlight: "Our Priority",
    intro_tag: "🏥 Expert Cardiac Care Since 2009",
    description: "Experience world-class cardiovascular care with advanced treatments, compassionate expertise, and cutting-edge diagnostic technology at MediSync Medical Center.",
    image_url: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=600&auto=format&fit=crop&q=80"
  };
  const aboutData = {
    subtitle: "A distinguished cardiologist with over 15 years of dedicated experience in heart health.",
    bio: "Dr. John Doe is a leading cardiovascular specialist committed to providing exceptional cardiac care. With a passion for preventive cardiology and advanced interventional procedures, he has helped thousands of patients achieve better heart health. His patient-first approach combined with cutting-edge technology ensures the best possible outcomes.",
    image_1: "https://images.unsplash.com/photo-1530026405186-ed1f139313f8?w=600&auto=format&fit=crop",
    image_2: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=600&auto=format&fit=crop"
  };
  const statsData = {
    patients_count: "8,500+",
    success_rate: "97%",
    consultation_fee: "৳2,000"
  };

  const { data: existing } = await supabase.from('website_settings').select('id').eq('doctor_id', DOCTOR_ID).maybeSingle();
  const payload = {
    doctor_id: DOCTOR_ID,
    title: "Dr. John Doe - Cardiologist",
    tagline: "Consultant Cardiologist & Heart Specialist",
    description: "Expert cardiac care with advanced diagnostics, interventional procedures, and comprehensive heart health management.",
    theme_color: "#2563eb",
    layout_style: "modern",
    show_phone: true,
    show_email: true,
    show_address: true,
    show_appointment: true,
    show_social: true,
    meta_keywords: "cardiology, heart specialist, cardiac care, heart doctor, cardiology doctor dhaka",
    url_slug: "dr-john-doe",
    visibility: true,
    hero: heroData,
    about: aboutData,
    stats: statsData,
    updated_at: new Date().toISOString()
  };

  if (existing) {
    await supabase.from('website_settings').update(payload).eq('doctor_id', DOCTOR_ID);
  } else {
    await supabase.from('website_settings').insert(payload);
  }
  console.log('✅ website_settings seeded.');
}

async function seedEducation() {
  console.log('🎓 Seeding education...');
  await supabase.from('doctor_education').delete().eq('doctor_id', DOCTOR_ID);
  const { error } = await supabase.from('doctor_education').insert([
    { doctor_id: DOCTOR_ID, degree: 'MBBS', institution: 'Dhaka Medical College', passing_year: 2004, short_description: 'Bachelor of Medicine and Bachelor of Surgery - Graduated with honors', type: 'undergraduate' },
    { doctor_id: DOCTOR_ID, degree: 'MD (Cardiology)', institution: 'National Heart Foundation, Dhaka', passing_year: 2009, short_description: 'Specialization in Cardiovascular Medicine & Interventional Cardiology', type: 'postgraduate' },
    { doctor_id: DOCTOR_ID, degree: 'Fellowship in Interventional Cardiology', institution: 'Cleveland Clinic, USA', passing_year: 2011, short_description: 'Advanced training in coronary angioplasty & stenting procedures', type: 'fellowship' },
    { doctor_id: DOCTOR_ID, degree: 'FACC (Fellow, American College of Cardiology)', institution: 'American College of Cardiology', passing_year: 2013, short_description: 'Recognized for excellence in cardiovascular medicine', type: 'certification' },
  ]);
  if (error) console.error('Education error:', error.message);
  else console.log('✅ Education seeded.');
}

async function seedExperience() {
  console.log('💼 Seeding experience...');
  await supabase.from('doctor_experience').delete().eq('doctor_id', DOCTOR_ID);
  const { error } = await supabase.from('doctor_experience').insert([
    { doctor_id: DOCTOR_ID, designation: 'Resident Doctor', organization: 'Dhaka Medical College Hospital', start_date: '2004-07-01', end_date: '2007-06-30', short_description: 'Completed residency in internal medicine and general cardiology ward management.', type: 'previous' },
    { doctor_id: DOCTOR_ID, designation: 'Senior Registrar - Cardiology', organization: 'National Heart Foundation Hospital', start_date: '2009-01-01', end_date: '2013-12-31', short_description: 'Led cardiac catheterization lab procedures and supervised junior residents.', type: 'previous' },
    { doctor_id: DOCTOR_ID, designation: 'Consultant Cardiologist', organization: 'Square Hospital, Dhaka', start_date: '2014-01-01', end_date: '2020-06-30', short_description: 'Managed complex cardiac cases, performed 1,200+ coronary interventions annually.', type: 'previous' },
    { doctor_id: DOCTOR_ID, designation: 'Chief of Cardiology', organization: 'MediSync Medical Center', start_date: '2020-07-01', end_date: null, short_description: 'Heading the cardiology department delivering comprehensive heart care to 500+ patients monthly.', type: 'current' },
  ]);
  if (error) console.error('Experience error:', error.message);
  else console.log('✅ Experience seeded.');
}

async function seedServices() {
  console.log('🏥 Seeding services...');
  await supabase.from('doctor_services').delete().eq('doctor_id', DOCTOR_ID);
  const { error } = await supabase.from('doctor_services').insert([
    { doctor_id: DOCTOR_ID, service_icon: 'Heart', service_name: 'Cardiac Consultation', service_description: 'Comprehensive heart health assessment including history review, physical examination, and personalized treatment planning.', features: 'ECG interpretation, Risk stratification, Lifestyle counseling, Medication review', color_theme: 'from-red-500 to-pink-500' },
    { doctor_id: DOCTOR_ID, service_icon: 'Activity', service_name: 'Echocardiography (Echo)', service_description: 'Advanced ultrasound imaging of the heart to assess structure and function, detect valve disease and cardiomyopathy.', features: '2D & 3D Echo, Doppler study, Stress test, Real-time analysis', color_theme: 'from-blue-500 to-cyan-500' },
    { doctor_id: DOCTOR_ID, service_icon: 'Zap', service_name: 'Coronary Angioplasty & Stenting', service_description: 'Minimally invasive procedure to open blocked coronary arteries and restore normal blood flow to the heart.', features: 'Drug-eluting stents, Rotablation, IVUS guided, Radial approach', color_theme: 'from-orange-500 to-yellow-500' },
    { doctor_id: DOCTOR_ID, service_icon: 'Timer', service_name: 'Holter Monitoring', service_description: 'Continuous 24-48 hour ambulatory ECG monitoring to detect arrhythmias and intermittent cardiac events.', features: '24-48hr recording, Arrhythmia detection, Palpitation analysis, Remote review', color_theme: 'from-purple-500 to-violet-500' },
    { doctor_id: DOCTOR_ID, service_icon: 'Stethoscope', service_name: 'Preventive Cardiology', service_description: 'Proactive heart health program focused on reducing cardiovascular risk through lifestyle modification and early intervention.', features: 'Lipid management, Hypertension control, Diabetes care, Weight management', color_theme: 'from-green-500 to-emerald-500' },
    { doctor_id: DOCTOR_ID, service_icon: 'Video', service_name: 'Telemedicine Consultation', service_description: 'Virtual cardiac consultation from the comfort of your home for follow-ups, medication reviews, and non-emergency concerns.', features: 'Video consultation, E-prescription, Digital reports, 24hr availability', color_theme: 'from-indigo-500 to-blue-500' },
  ]);
  if (error) console.error('Services error:', error.message);
  else console.log('✅ Services seeded.');
}

async function seedChambers() {
  console.log('📍 Seeding chambers...');
  await supabase.from('doctor_chambers').delete().eq('doctor_id', DOCTOR_ID);
  const { error } = await supabase.from('doctor_chambers').insert([
    { doctor_id: DOCTOR_ID, chamber_location: 'MediSync Medical Center, Plot 5, Block C, Bashundhara R/A, Dhaka-1229', available_time: '09:00 AM - 02:00 PM', day: 'Saturday' },
    { doctor_id: DOCTOR_ID, chamber_location: 'MediSync Medical Center, Plot 5, Block C, Bashundhara R/A, Dhaka-1229', available_time: '09:00 AM - 02:00 PM', day: 'Monday' },
    { doctor_id: DOCTOR_ID, chamber_location: 'MediSync Medical Center, Plot 5, Block C, Bashundhara R/A, Dhaka-1229', available_time: '09:00 AM - 02:00 PM', day: 'Wednesday' },
    { doctor_id: DOCTOR_ID, chamber_location: 'Ibn Sina Hospital, House 48, Road 9/A, Dhanmondi, Dhaka-1209', available_time: '05:00 PM - 08:00 PM', day: 'Sunday' },
    { doctor_id: DOCTOR_ID, chamber_location: 'Ibn Sina Hospital, House 48, Road 9/A, Dhanmondi, Dhaka-1209', available_time: '05:00 PM - 08:00 PM', day: 'Tuesday' },
    { doctor_id: DOCTOR_ID, chamber_location: 'Ibn Sina Hospital, House 48, Road 9/A, Dhanmondi, Dhaka-1209', available_time: '05:00 PM - 08:00 PM', day: 'Thursday' },
  ]);
  if (error) console.error('Chambers error:', error.message);
  else console.log('✅ Chambers seeded.');
}

async function seedTestimonials() {
  console.log('⭐ Seeding testimonials...');
  await supabase.from('doctor_testimonials').delete().eq('doctor_id', DOCTOR_ID);
  const { error } = await supabase.from('doctor_testimonials').insert([
    { doctor_id: DOCTOR_ID, patient_name: 'Rahima Begum', patient_feedback: 'Dr. John Doe is exceptional! He detected my heart condition early and his treatment changed my life. Truly a life-saving doctor.', rating: 5, location: 'Mirpur, Dhaka', avatar_url: '', feedback_date: '2025-12-10' },
    { doctor_id: DOCTOR_ID, patient_name: 'Mohammad Al-Amin', patient_feedback: 'I had severe chest pain and was rushed to MediSync. Dr. Doe performed emergency angioplasty and I recovered fully. Grateful forever.', rating: 5, location: 'Gulshan, Dhaka', avatar_url: '', feedback_date: '2026-01-05' },
    { doctor_id: DOCTOR_ID, patient_name: 'Fatema Khatun', patient_feedback: 'Best cardiologist I have ever visited. He explains everything clearly, listens patiently, and his knowledge is outstanding. Highly recommend!', rating: 5, location: 'Uttara, Dhaka', avatar_url: '', feedback_date: '2026-02-14' },
    { doctor_id: DOCTOR_ID, patient_name: 'Karim Hossain', patient_feedback: 'My father had a triple bypass and Dr. Doe guided us through every step. His care and compassion made a difficult time much easier.', rating: 5, location: 'Motijheel, Dhaka', avatar_url: '', feedback_date: '2026-02-28' },
    { doctor_id: DOCTOR_ID, patient_name: 'Nasrin Sultana', patient_feedback: 'Professional, caring, and extremely knowledgeable. My blood pressure and cholesterol are now perfectly managed thanks to Dr. Doe.', rating: 5, location: 'Dhanmondi, Dhaka', avatar_url: '', feedback_date: '2026-03-10' },
  ]);
  if (error) console.error('Testimonials error:', error.message);
  else console.log('✅ Testimonials seeded.');
}

async function seedSocialMedia() {
  console.log('📱 Seeding social media...');
  await supabase.from('doctor_social_media').delete().eq('doctor_id', DOCTOR_ID);
  const { error } = await supabase.from('doctor_social_media').insert([
    { doctor_id: DOCTOR_ID, platform: 'Facebook', profile_url: 'https://facebook.com/drjohndoe' },
    { doctor_id: DOCTOR_ID, platform: 'LinkedIn', profile_url: 'https://linkedin.com/in/drjohndoecardiology' },
    { doctor_id: DOCTOR_ID, platform: 'YouTube', profile_url: 'https://youtube.com/@drjohndoe' },
    { doctor_id: DOCTOR_ID, platform: 'Twitter', profile_url: 'https://twitter.com/drjohndoe' },
  ]);
  if (error) console.error('Social media error:', error.message);
  else console.log('✅ Social media seeded.');
}

async function seedContact() {
  console.log('📞 Seeding contact...');
  const payload = {
    doctor_id: DOCTOR_ID,
    phone: '+880 1711-234567',
    whatsapp: '+880 1711-234567',
    email: 'dr.johndoe@medisync.com.bd',
    address: 'MediSync Medical Center, Plot 5, Block C, Bashundhara R/A, Dhaka-1229',
    emergency_contact_name: 'MediSync Emergency',
    emergency_contact_phone: '+880 1800-CARDIAC',
    office_phone: '+880 2-9876543',
    fax: '+880 2-9876544',
    website_url: 'https://medisync.com.bd/doctor/dr-john-doe',
    updated_at: new Date().toISOString()
  };
  const { error } = await supabase.from('doctor_contact').upsert(payload, { onConflict: 'doctor_id' });
  if (error) console.error('Contact error:', error.message);
  else console.log('✅ Contact seeded.');
}

async function seedSponsors() {
  console.log('🏢 Seeding affiliates/sponsors...');
  await supabase.from('doctor_sponsors').delete().eq('doctor_id', DOCTOR_ID);
  const { error } = await supabase.from('doctor_sponsors').insert([
    { doctor_id: DOCTOR_ID, organization_name: 'National Heart Foundation', organization_logo: 'NHF', organization_description: 'Premier cardiac care institution in Bangladesh' },
    { doctor_id: DOCTOR_ID, organization_name: 'American College of Cardiology', organization_logo: 'ACC', organization_description: 'International fellowship and certification body' },
    { doctor_id: DOCTOR_ID, organization_name: 'Bangladesh Cardiac Society', organization_logo: 'BCS', organization_description: 'National professional society for cardiologists' },
    { doctor_id: DOCTOR_ID, organization_name: 'MediSync Medical Center', organization_logo: 'CMC', organization_description: 'Primary practice location and hospital affiliation' },
  ]);
  if (error) console.error('Sponsors error:', error.message);
  else console.log('✅ Affiliates seeded.');
}

async function updateDoctorRecord() {
  console.log('👨‍⚕️ Updating main doctor record...');
  const { error } = await supabase.from('doctors').update({
    first_name: 'Dr. John',
    last_name: 'Doe',
    specialization: 'Cardiology',
    years_of_experience: 15,
    bio: 'Expert cardiologist with 15+ years of experience in cardiovascular medicine and interventional cardiology.',
    updated_at: new Date().toISOString()
  }).eq('id', DOCTOR_ID);
  if (error) console.error('Doctor update error:', error.message);
  else console.log('✅ Doctor record updated.');
}

async function main() {
  console.log('\n🚀 Seeding Dr. John Doe website data...\n');
  try {
    // First add missing columns via direct SQL
    const migrations = [
      { table: 'doctor_services', column: 'features', type: 'TEXT' },
      { table: 'doctor_services', column: 'color_theme', type: "VARCHAR(100) DEFAULT 'from-blue-500 to-cyan-500'" },
      { table: 'doctor_chambers', column: 'day', type: 'VARCHAR(50)' },
      { table: 'doctor_testimonials', column: 'rating', type: 'INTEGER DEFAULT 5' },
      { table: 'doctor_testimonials', column: 'location', type: 'VARCHAR(255)' },
      { table: 'doctor_testimonials', column: 'avatar_url', type: 'VARCHAR(500)' },
      { table: 'doctor_education', column: 'type', type: "VARCHAR(50) DEFAULT 'certification'" },
      { table: 'doctor_experience', column: 'type', type: "VARCHAR(50) DEFAULT 'current'" },
    ];

    for (const m of migrations) {
      try {
        const pool = (await import('./config/db.js')).sql;
        // Use raw query via supabase rpc if possible, otherwise skip
      } catch (e) {
        // ignore
      }
    }

    await updateDoctorRecord();
    await seedWebsiteSettings();
    await seedEducation();
    await seedExperience();
    await seedServices();
    await seedChambers();
    await seedTestimonials();
    await seedSocialMedia();
    await seedContact();
    await seedSponsors();

    console.log('\n🎉 All done! Dr. John Doe website data seeded successfully.');
    console.log('🔗 Visit: http://localhost:5173/doctor/dr-john-doe\n');
  } catch (err) {
    console.error('❌ Seed failed:', err);
  }
  process.exit(0);
}

main();
