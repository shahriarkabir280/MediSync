import { supabase } from '../config/db.js';

async function backfill() {
  try {
    console.log('Starting backfill for medical_records...');

    // 1. Fetch lab_report_files
    const { data: reportFiles, error: reportErr } = await supabase
      .from('lab_report_files')
      .select('*, lab_orders(patient_id, doctor_id)');

    if (reportErr) throw reportErr;

    console.log(`Processing ${reportFiles.length} lab report files...`);

    for (const file of reportFiles) {
      if (!file.lab_orders?.patient_id) continue;

      // Check if already in medical_records
      const { data: existing } = await supabase
        .from('medical_records')
        .select('id')
        .eq('file_name', file.file_name)
        .maybeSingle();

      if (!existing) {
        console.log(`Adding ${file.file_name} to medical_records...`);
        await supabase.from('medical_records').insert({
          patient_id: file.lab_orders.patient_id,
          doctor_id: file.lab_orders.doctor_id,
          file_name: file.file_name,
          file_path: file.file_path,
          file_type: 'application/pdf',
          record_date: file.uploaded_at || new Date().toISOString(),
          diagnosis: 'Lab Report',
          notes: `Migrated from Lab Report File (Order #${file.order_id})`
        });
      }
    }

    // 2. Fetch lab_results
    const { data: results, error: resultErr } = await supabase
      .from('lab_results')
      .select('*, lab_order_items(lab_orders(patient_id, doctor_id))');

    if (resultErr) throw resultErr;

    console.log(`Processing ${results.length} lab result files...`);

    for (const res of results) {
      if (!res.file_name || !res.lab_order_items?.lab_orders?.patient_id) continue;

      // Check if already in medical_records
      const { data: existing } = await supabase
        .from('medical_records')
        .select('id')
        .eq('file_name', res.file_name)
        .maybeSingle();

      if (!existing) {
        console.log(`Adding ${res.file_name} to medical_records...`);
        await supabase.from('medical_records').insert({
          patient_id: res.lab_order_items.lab_orders.patient_id,
          doctor_id: res.lab_order_items.lab_orders.doctor_id,
          file_name: res.file_name,
          file_path: res.file_path,
          file_type: 'application/pdf',
          record_date: res.result_date || res.created_at || new Date().toISOString(),
          diagnosis: 'Lab Result Report',
          notes: `Migrated from Lab Result (Item #${res.order_item_id})`
        });
      }
    }

    console.log('Backfill complete!');
    process.exit(0);
  } catch (err) {
    console.error('Backfill failed:', err);
    process.exit(1);
  }
}

backfill();
