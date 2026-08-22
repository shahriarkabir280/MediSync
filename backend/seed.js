
import { supabase } from './config/db.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

async function seed() {
  try {
    console.log('🌱 Starting database seeding...');

    // 1. Seed Products
    const products = [
      { name: 'Stethoscope Premium', image_url: 'https://images.unsplash.com/photo-1584982751601-97dcc096659c?w=500', price: 120.00 },
      { name: 'Digital Blood Pressure Monitor', image_url: 'https://images.unsplash.com/photo-1631815587646-b85a1bb027e1?w=500', price: 85.00 },
      { name: 'Pulse Oximeter', image_url: 'https://images.unsplash.com/photo-1584036561566-baf1f5f9b143?w=500', price: 45.00 }
    ];
    const { error: prodError } = await supabase.from('products').upsert(products, { onConflict: 'name' });
    if (prodError) console.warn('Warning seeding products:', prodError.message);
    else console.log('✅ Products seeded');

    // 2. Seed Doctors
    const doctors = [
      {
        unique_id: 'DOC-001',
        first_name: 'John',
        last_name: 'Doe',
        email: 'john.doe@medisync.com',
        phone: '+1-555-0101',
        specialization: 'Cardiologist',
        license_number: 'MD12345',
        years_of_experience: 15,
        bio: 'Experienced cardiologist specializing in heart disease prevention and treatment.'
      },
      {
        unique_id: 'DOC-002',
        first_name: 'Sarah',
        last_name: 'Smith',
        email: 'sarah.smith@medisync.com',
        phone: '+1-555-0102',
        specialization: 'Pediatrician',
        license_number: 'MD12346',
        years_of_experience: 10,
        bio: 'Dedicated pediatrician with focus on child health and development.'
      }
    ];
    const { data: seededDoctors, error: docError } = await supabase.from('doctors').upsert(doctors, { onConflict: 'email' }).select();
    if (docError) throw docError;
    console.log('✅ Doctors seeded');

    const doctor1 = seededDoctors.find(d => d.email === 'john.doe@medisync.com');
    const doctor2 = seededDoctors.find(d => d.email === 'sarah.smith@medisync.com');

    // 3. Seed Doctor Settings
    if (doctor1) {
      await supabase.from('doctor_settings').upsert({
        doctor_id: doctor1.id,
        default_appointment_duration: 30,
        working_hours_start: '09:00',
        working_hours_end: '17:00',
        consultation_fee: 150.00,
        accept_new_patients: true
      }, { onConflict: 'doctor_id' });
      console.log('✅ Doctor settings seeded');
    }

    // 4. Seed Patients
    const patients = [
      { unique_id: 'PAT-001', first_name: 'James', last_name: 'Wilson', email: 'james.wilson@example.com', phone: '+1-555-1001', gender: 'Male', blood_group: 'A+' },
      { unique_id: 'PAT-002', first_name: 'Mary', last_name: 'Johnson', email: 'mary.johnson@example.com', phone: '+1-555-1002', gender: 'Female', blood_group: 'B-' },
      { unique_id: 'PAT-003', first_name: 'Robert', last_name: 'Brown', email: 'robert.brown@example.com', phone: '+1-555-1003', gender: 'Male', blood_group: 'O+' }
    ];
    const { data: seededPatients, error: patError } = await supabase.from('patients').upsert(patients, { onConflict: 'email' }).select();
    if (patError) throw patError;
    console.log('✅ Patients seeded');

    // 5. Seed Appointments
    if (doctor1 && seededPatients.length > 0) {
      const appointments = [
        { doctor_id: doctor1.id, patient_id: seededPatients[0].id, appointment_date: new Date().toISOString().split('T')[0], appointment_time: '10:00', status: 'confirmed', appointment_type: 'consultation' },
        { doctor_id: doctor1.id, patient_id: seededPatients[1].id, appointment_date: new Date().toISOString().split('T')[0], appointment_time: '11:00', status: 'pending', appointment_type: 'follow-up' }
      ];
      await supabase.from('appointments').insert(appointments);
      console.log('✅ Appointments seeded');
    }

    // 6. Seed Help FAQ
    const faqs = [
      { category: 'Account', question: 'How to reset password?', answer: 'Go to settings and click reset.' },
      { category: 'Appointments', question: 'How to cancel?', answer: 'Navigate to appointments and click cancel.' }
    ];
    await supabase.from('help_faq').upsert(faqs, { onConflict: 'question' });
    console.log('✅ Help FAQs seeded');

    // 7. Seed Lab Test Categories & Tests
    const { data: catData, error: catError } = await supabase.from('lab_test_categories').upsert([
      { name: 'Hematology', description: 'Blood tests' },
      { name: 'Biochemistry', description: 'Chemical analysis' }
    ], { onConflict: 'name' }).select();

    if (catData) {
      const hematology = catData.find(c => c.name === 'Hematology');
      if (hematology) {
        const { data: tests } = await supabase.from('lab_tests').upsert([
          { test_code: 'CBC', test_name: 'Complete Blood Count', category_id: hematology.id, cost: 50, sample_type: 'Blood' },
          { test_code: 'HGB', test_name: 'Hemoglobin', category_id: hematology.id, cost: 20, sample_type: 'Blood' },
          { test_code: 'WBC', test_name: 'White Blood Cell Count', category_id: hematology.id, cost: 25, sample_type: 'Blood' }
        ], { onConflict: 'test_code' }).select();

        // 8. Seed Lab Orders for Doctor 1
        if (doctor1 && seededPatients.length > 0 && tests) {
          const orders = [
            {
              order_number: 'LAB-SEED-001',
              doctor_id: doctor1.id,
              patient_id: seededPatients[0].id,
              status: 'pending',
              priority: 'urgent',
              clinical_notes: 'Fever and fatigue'
            },
            {
              order_number: 'LAB-SEED-002',
              doctor_id: doctor1.id,
              patient_id: seededPatients[1].id,
              status: 'completed',
              priority: 'normal',
              clinical_notes: 'Routine checkup'
            }
          ];
          const { data: seededOrders } = await supabase.from('lab_orders').upsert(orders, { onConflict: 'order_number' }).select();

          if (seededOrders) {
            const orderItems = [
              { order_id: seededOrders[0].id, test_id: tests[0].id },
              { order_id: seededOrders[1].id, test_id: tests[1].id }
            ];
            const { data: items } = await supabase.from('lab_order_items').upsert(orderItems, { onConflict: 'id' }).select();

            // Add an unverified result for the completed order to test unreviewed stats
            if (items && seededOrders[1].status === 'completed') {
              await supabase.from('lab_results').upsert([
                {
                  order_item_id: items[1].id,
                  result_value: '14.5',
                  unit: 'g/dL',
                  status: 'normal',
                  verified_by: null // Unverified
                }
              ], { onConflict: 'order_item_id' });
            }
          }
        }
      }
      console.log('✅ Lab data seeded');
    }

    // 8. Website Settings for Doctor 1
    if (doctor1) {
      await supabase.from('website_settings').upsert({
        doctor_id: doctor1.id,
        title: 'Dr. John Doe | Premier Cardiology',
        tagline: 'Your Heart in Safe Hands',
        url_slug: 'dr-john-doe',
        hero: { title_prefix: "Expert", title_highlight: "Cardiology", description: "State of the art heart care." },
        about: { bio: "Over 15 years of experience." },
        stats: { patients_count: "5000+", success_rate: "98%" }
      }, { onConflict: 'doctor_id' });

      await supabase.from('doctor_services').upsert([
        { doctor_id: doctor1.id, service_name: 'Heart Checkup', service_icon: '🫀' },
        { doctor_id: doctor1.id, service_name: 'ECG Analysis', service_icon: '📈' }
      ]);
      console.log('✅ Website settings seeded');
    }

    console.log('\n🎉 Database seeding completed successfully!');
  } catch (error) {
    console.error('❌ Error seeding database:', error);
  } finally {
    process.exit(0);
  }
}

seed();
