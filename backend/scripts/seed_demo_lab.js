import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function seedLabData() {
  const patientId = 45; // Charles Adams
  const doctorId = 5; // Valid doctor ID from DB

  console.log(`Seeding demo lab data for patient ${patientId}...`);

  // 1. Get some lab tests to use
  const { data: tests, error: testErr } = await supabase
    .from('lab_tests')
    .select('id, test_name, normal_range_min, normal_range_max, unit')
    .limit(5);

  if (testErr || !tests || tests.length === 0) {
    console.error("Error fetching lab tests or no tests available:", testErr);
    return;
  }
  
  console.log(`Found ${tests.length} tests to use for demo.`);

  // 2. Create a recent completed order
  const orderNumber = `LAB-DEMO-${Date.now()}`;
  const orderDate = new Date();
  orderDate.setDate(orderDate.getDate() - 2); // 2 days ago

  const { data: order, error: orderErr } = await supabase
    .from('lab_orders')
    .insert({
      order_number: orderNumber,
      doctor_id: doctorId,
      patient_id: patientId,
      status: 'completed',
      priority: 'normal',
      clinical_notes: 'Routine checkup. Patient complains of mild fatigue.',
      order_date: orderDate.toISOString(),
      sample_collection_date: orderDate.toISOString(),
      report_date: new Date().toISOString(),
      created_by: doctorId
    })
    .select()
    .single();

  if (orderErr) {
    console.error("Error creating order:", orderErr);
    return;
  }

  console.log(`Created order ${order.id}`);

  // 3. Create items and results
  for (const test of tests) {
    // Create item
    const { data: item, error: itemErr } = await supabase
      .from('lab_order_items')
      .insert({
        order_id: order.id,
        test_id: test.id,
        status: 'completed'
      })
      .select()
      .single();

    if (itemErr) {
      console.error(`Error creating item for test ${test.id}:`, itemErr);
      continue;
    }

    // Generate a realistic but slightly abnormal result for testing
    let resultValue;
    let isAbnormal = false;
    let isCritical = false;
    
    // Just fake it based on whether there's a min/max
    if (test.normal_range_min && test.normal_range_max && !isNaN(parseFloat(test.normal_range_max))) {
        const min = parseFloat(test.normal_range_min);
        const max = parseFloat(test.normal_range_max);
        
        // Make the first test critical, second test abnormal, rest normal
        if (test.id === tests[0].id) {
            resultValue = (max * 1.5).toFixed(1); // Critical high
            isCritical = true;
        } else if (test.id === tests[1].id) {
            resultValue = (min * 0.8).toFixed(1); // Abnormal low
            isAbnormal = true;
        } else {
            resultValue = ((min + max) / 2).toFixed(1); // Normal
        }
    } else {
        resultValue = "Positive"; // Fallback
        isAbnormal = true;
    }

    const { error: resErr } = await supabase
      .from('lab_results')
      .insert({
        order_item_id: item.id,
        result_value: resultValue.toString(),
        reference_range: test.normal_range_min ? `${test.normal_range_min} - ${test.normal_range_max}` : 'N/A',
        unit: test.unit || '',
        status: isCritical ? 'critical' : (isAbnormal ? 'abnormal' : 'normal'),
        abnormal_flag: isAbnormal,
        critical_flag: isCritical,
        verified_by: doctorId,
        verified_at: new Date().toISOString(),
        notes: isCritical ? 'Patient notified immediately.' : (isAbnormal ? 'Monitor closely.' : 'Within normal limits.')
      });

    if (resErr) {
      console.error(`Error creating result for item ${item.id}:`, resErr);
    } else {
      console.log(`Created result for test ${test.test_name}: ${resultValue} ${isCritical ? '(CRITICAL)' : (isAbnormal ? '(ABNORMAL)' : '')}`);
    }
  }

  console.log("Demo data seeding complete!");
}

seedLabData();
