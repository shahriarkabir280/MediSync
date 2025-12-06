import { sql } from './config/db.js';
import dotenv from 'dotenv';

dotenv.config();

const sampleWebsiteData = {
  doctorId: 1,
  full_name: "Dr. John Doe",
  profile_photo_url: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?ixlib=rb-4.0.3&w=400&h=400&fit=crop&crop=face",
  active_status: true,
  served_total_patients: 2500,
  years_experience: 15,
  chamber: [
    { 
      available_time: "Mon-Fri: 9:00 AM - 6:00 PM, Sat: 9:00 AM - 2:00 PM", 
      chamber_location: "Heart Care Medical Center, 123 Medical Plaza, New York, NY 10001" 
    },
    { 
      available_time: "Wed-Thu: 7:00 PM - 9:00 PM", 
      chamber_location: "Downtown Cardiology Clinic, 456 Health Ave, New York, NY 10002" 
    }
  ],
  services: [
    { 
      service_icon: "🫀", 
      service_name: "Cardiac Consultation", 
      service_description: "Comprehensive heart health assessment and consultation for all cardiac conditions" 
    },
    { 
      service_icon: "🩺", 
      service_name: "Preventive Cardiology", 
      service_description: "Heart disease prevention, lifestyle counseling, and risk factor management" 
    },
    { 
      service_icon: "📊", 
      service_name: "Cardiac Imaging", 
      service_description: "Advanced cardiac imaging including echocardiograms and stress tests" 
    },
    { 
      service_icon: "💊", 
      service_name: "Medication Management", 
      service_description: "Specialized cardiac medication therapy and monitoring" 
    },
    { 
      service_icon: "🏥", 
      service_name: "Emergency Cardiac Care", 
      service_description: "24/7 emergency cardiac consultation and immediate intervention" 
    },
    { 
      service_icon: "🔬", 
      service_name: "Cardiac Catheterization", 
      service_description: "Advanced interventional cardiology procedures and treatments" 
    }
  ],
  education: [
    { 
      degree: "Doctor of Medicine (MD)", 
      institution: "Harvard Medical School", 
      passing_year: "2008", 
      short_description: "Graduated Magna Cum Laude with focus on cardiovascular medicine" 
    },
    { 
      degree: "Fellowship in Cardiology", 
      institution: "Mayo Clinic", 
      passing_year: "2012", 
      short_description: "Specialized training in interventional cardiology and cardiac imaging" 
    },
    { 
      degree: "Residency in Internal Medicine", 
      institution: "Johns Hopkins Hospital", 
      passing_year: "2011", 
      short_description: "Comprehensive internal medicine training with cardiac focus" 
    },
    { 
      degree: "Bachelor of Science in Biology", 
      institution: "MIT", 
      passing_year: "2004", 
      short_description: "Pre-medical studies with honors in biological sciences" 
    }
  ],
  experience: [
    {
      designation: "Senior Cardiologist",
      organization: "Heart Care Medical Center",
      start_date: "2015-01-01",
      end_date: null,
      short_description: "Leading cardiac care team, performing complex interventional procedures, and managing cardiac emergencies"
    },
    {
      designation: "Associate Cardiologist",
      organization: "Metropolitan Heart Institute",
      start_date: "2012-08-01",
      end_date: "2014-12-31",
      short_description: "Specialized in preventive cardiology and patient education programs"
    },
    {
      designation: "Cardiology Fellow",
      organization: "Mayo Clinic",
      start_date: "2011-07-01",
      end_date: "2012-07-31",
      short_description: "Advanced training in cardiac catheterization and interventional procedures"
    }
  ],
  testimonials: [
    { 
      patient_name: "Sarah Johnson", 
      patient_feedback: "Dr. John saved my life! His expertise and compassionate care during my heart attack was extraordinary. I'm forever grateful.", 
      feedback_date: "2024-11-15" 
    },
    { 
      patient_name: "Michael Chen", 
      patient_feedback: "The best cardiologist in the city. Dr. John explained everything clearly and helped me manage my heart condition perfectly.", 
      feedback_date: "2024-10-28" 
    },
    { 
      patient_name: "Emily Davis", 
      patient_feedback: "Professional, knowledgeable, and caring. Dr. John's preventive approach helped me avoid major cardiac issues.", 
      feedback_date: "2024-09-12" 
    }
  ],
  sponsors_company: [
    {
      organization_logo: "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=200&h=100&fit=crop",
      organization_name: "American Heart Association",
      organization_description: "Partnership in cardiac research and community heart health programs",
      start_date: "2020-01-01",
      end_date: null
    },
    {
      organization_logo: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?w=200&h=100&fit=crop",
      organization_name: "CardioTech Solutions",
      organization_description: "Research collaboration on innovative cardiac devices and treatments",
      start_date: "2018-06-01",
      end_date: null
    }
  ],
  contact: { 
    phone: "+1-555-0101", 
    whatsapp: "+1-555-0101", 
    email: "john.doe@careconnect.com" 
  },
  social_media: [
    { platform: "LinkedIn", profile_url: "https://linkedin.com/in/dr-john-doe-cardiology" },
    { platform: "Twitter", profile_url: "https://twitter.com/DrJohnDoeHeart" },
    { platform: "Facebook", profile_url: "https://facebook.com/DrJohnDoeCardiology" },
    { platform: "Instagram", profile_url: "https://instagram.com/drjohndoe_cardio" },
    { platform: "YouTube", profile_url: "https://youtube.com/c/DrJohnDoeCardiology" }
  ],
  website: {
    title: "Dr. John Doe - Cardiologist",
    tagline: "Expert Heart Care You Can Trust",
    description: "Leading cardiologist with 15+ years of experience in comprehensive cardiac care. Specializing in preventive cardiology, interventional procedures, and heart disease management. Committed to providing personalized, compassionate care for every patient.",
    theme_color: "#2563eb",
    layout_style: "modern",
    show_phone: true,
    show_email: true,
    show_address: true,
    show_appointment: true,
    show_reviews: true,
    show_services: true,
    show_achievements: true
  },
  certifications: [
    {
      certification_name: "Board Certified Cardiologist",
      issuing_authority: "American Board of Internal Medicine",
      certification_date: "2012-08-01",
      expiry_date: "2025-08-01",
      certification_url: "#"
    },
    {
      certification_name: "Advanced Cardiac Life Support (ACLS)",
      issuing_authority: "American Heart Association",
      certification_date: "2024-01-01",
      expiry_date: "2026-01-01",
      certification_url: "#"
    },
    {
      certification_name: "Interventional Cardiology Certification",
      issuing_authority: "Society for Cardiovascular Angiography",
      certification_date: "2013-03-01",
      expiry_date: "2025-03-01",
      certification_url: "#"
    }
  ],
  awards: [
    {
      award_name: "Excellence in Cardiac Care Award",
      awarding_organization: "New York Medical Association",
      award_date: "2023-12-01",
      award_description: "Recognized for outstanding patient care and innovative treatment approaches"
    },
    {
      award_name: "Top Cardiologist 2023",
      awarding_organization: "Healthcare Excellence Magazine",
      award_date: "2023-06-15",
      award_description: "Named among top 50 cardiologists in the United States"
    },
    {
      award_name: "Research Excellence Award",
      awarding_organization: "American College of Cardiology",
      award_date: "2022-04-20",
      award_description: "For groundbreaking research in preventive cardiology"
    }
  ],
  specialties: [
    "Interventional Cardiology",
    "Preventive Cardiology", 
    "Heart Failure Management",
    "Cardiac Imaging",
    "Coronary Artery Disease",
    "Arrhythmia Treatment",
    "Cardiac Catheterization",
    "Echocardiography",
    "Stress Testing",
    "Lipid Management"
  ],
  languages: ["English", "Spanish", "French"],
  insurance_accepted: [
    "Blue Cross Blue Shield",
    "Aetna",
    "Cigna", 
    "UnitedHealthcare",
    "Medicare",
    "Medicaid",
    "Empire BlueCross",
    "Oxford Health Plans"
  ]
};

async function seedJohnDoeWebsiteData() {
  try {
    console.log('🌱 Starting to seed Dr. John Doe website data...');

    const doctorId = 1;

    // Update doctor basic information
    await sql`
      UPDATE doctors SET 
        first_name = 'John',
        last_name = 'Doe',
        email = 'john.doe@careconnect.com',
        phone = '+1-555-0101',
        specialization = 'Cardiologist',
        license_number = 'MD12345',
        years_of_experience = 15,
        bio = 'Leading cardiologist with 15+ years of experience in comprehensive cardiac care.'
      WHERE id = ${doctorId}
    `;

    // Clear existing data and insert fresh data
    await sql`DELETE FROM doctor_chambers WHERE doctor_id = ${doctorId}`;
    await sql`DELETE FROM doctor_services WHERE doctor_id = ${doctorId}`;
    await sql`DELETE FROM doctor_education WHERE doctor_id = ${doctorId}`;
    await sql`DELETE FROM doctor_experience WHERE doctor_id = ${doctorId}`;
    await sql`DELETE FROM doctor_testimonials WHERE doctor_id = ${doctorId}`;
    await sql`DELETE FROM doctor_sponsors WHERE doctor_id = ${doctorId}`;
    await sql`DELETE FROM doctor_social_media WHERE doctor_id = ${doctorId}`;
    await sql`DELETE FROM contact WHERE doctor_id = ${doctorId}`;
    await sql`DELETE FROM website WHERE doctor_id = ${doctorId}`;

    // Insert chamber data
    for (const chamber of sampleWebsiteData.chamber) {
      await sql`
        INSERT INTO doctor_chambers (doctor_id, available_time, chamber_location)
        VALUES (${doctorId}, ${chamber.available_time}, ${chamber.chamber_location})
      `;
    }

    // Insert services data
    for (const service of sampleWebsiteData.services) {
      await sql`
        INSERT INTO doctor_services (doctor_id, service_icon, service_name, service_description)
        VALUES (${doctorId}, ${service.service_icon}, ${service.service_name}, ${service.service_description})
      `;
    }

    // Insert education data
    for (const edu of sampleWebsiteData.education) {
      await sql`
        INSERT INTO doctor_education (doctor_id, degree, institution, passing_year, short_description)
        VALUES (${doctorId}, ${edu.degree}, ${edu.institution}, ${edu.passing_year}, ${edu.short_description})
      `;
    }

    // Insert experience data
    for (const exp of sampleWebsiteData.experience) {
      await sql`
        INSERT INTO doctor_experience (doctor_id, designation, organization, start_date, end_date, short_description)
        VALUES (${doctorId}, ${exp.designation}, ${exp.organization}, ${exp.start_date}, ${exp.end_date}, ${exp.short_description})
      `;
    }

    // Insert testimonials data
    for (const testimonial of sampleWebsiteData.testimonials) {
      await sql`
        INSERT INTO doctor_testimonials (doctor_id, patient_name, patient_feedback, feedback_date)
        VALUES (${doctorId}, ${testimonial.patient_name}, ${testimonial.patient_feedback}, ${testimonial.feedback_date})
      `;
    }

    // Insert sponsors data
    for (const sponsor of sampleWebsiteData.sponsors_company) {
      await sql`
        INSERT INTO doctor_sponsors (doctor_id, organization_logo, organization_name, organization_description, start_date, end_date)
        VALUES (${doctorId}, ${sponsor.organization_logo}, ${sponsor.organization_name}, ${sponsor.organization_description}, ${sponsor.start_date}, ${sponsor.end_date})
      `;
    }

    // Insert social media data
    for (const social of sampleWebsiteData.social_media) {
      await sql`
        INSERT INTO doctor_social_media (doctor_id, platform, profile_url)
        VALUES (${doctorId}, ${social.platform}, ${social.profile_url})
      `;
    }

    // Insert contact data
    await sql`
      INSERT INTO contact (doctor_id, phone, whatsapp, email)
      VALUES (${doctorId}, ${sampleWebsiteData.contact.phone}, ${sampleWebsiteData.contact.whatsapp}, ${sampleWebsiteData.contact.email})
    `;

    // Insert website settings
    await sql`
      INSERT INTO website (doctor_id, title, tagline, description, theme_color, layout_style, 
                          show_phone, show_email, show_address, show_appointment, show_social, 
                          meta_keywords, url_slug, visibility)
      VALUES (${doctorId}, ${sampleWebsiteData.website.title}, ${sampleWebsiteData.website.tagline}, 
              ${sampleWebsiteData.website.description}, ${sampleWebsiteData.website.theme_color}, 
              ${sampleWebsiteData.website.layout_style}, ${sampleWebsiteData.website.show_phone}, 
              ${sampleWebsiteData.website.show_email}, ${sampleWebsiteData.website.show_address}, 
              ${sampleWebsiteData.website.show_appointment}, true, 
              'cardiology,heart,doctor,medical', 'dr-john-doe', true)
    `;

    console.log('✅ Successfully seeded Dr. John Doe website data!');
    console.log('📊 Data includes:');
    console.log(`   - ${sampleWebsiteData.chamber.length} chamber locations`);
    console.log(`   - ${sampleWebsiteData.services.length} medical services`);
    console.log(`   - ${sampleWebsiteData.education.length} education entries`);
    console.log(`   - ${sampleWebsiteData.experience.length} work experiences`);
    console.log(`   - ${sampleWebsiteData.testimonials.length} patient testimonials`);
    console.log(`   - ${sampleWebsiteData.social_media.length} social media profiles`);
    console.log('🌐 Website ready for editing and customization!');
    
  } catch (error) {
    console.error('❌ Error seeding website data:', error);
    throw error;
  }
}

// Run the seeding
seedJohnDoeWebsiteData()
  .then(() => {
    console.log('🎉 Seeding completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Seeding failed:', error);
    process.exit(1);
  });

export default seedJohnDoeWebsiteData;