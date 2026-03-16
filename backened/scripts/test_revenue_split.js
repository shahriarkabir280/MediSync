import { supabase } from '../config/db.js';
import { processRevenueSplit } from '../controllers/walletController.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const testRevenueSplit = async () => {
  console.log('--- Starting Revenue Split Test ---');
  
  try {
    // 1. Find a test doctor and patient
    const { data: doctor } = await supabase.from('doctors').select('id').limit(1).single();
    const { data: patient } = await supabase.from('patients').select('id').limit(1).single();

    if (!doctor || !patient) {
      console.error('Test data (doctor/patient) not found. Please seed data first.');
      return;
    }

    console.log(`Using Doctor ID: ${doctor.id}, Patient ID: ${patient.id}`);

    // 2. Create a test billing record
    const testAmount = 1000.00;
    const { data: bill, error: billError } = await supabase
      .from('billing')
      .insert({
        doctor_id: doctor.id,
        patient_id: patient.id,
        amount: testAmount,
        description: 'Test Referral for Revenue Split',
        status: 'paid', // Mark as paid to trigger split
        appointment_id: null // Simulate referral/lab test
      })
      .select()
      .single();

    if (billError) throw billError;
    console.log(`Created test bill #${bill.id} with amount ৳${testAmount}`);

    // 3. Trigger Revenue Split
    console.log('Triggering revenue split...');
    const success = await processRevenueSplit(bill.id);
    
    if (success) {
      console.log('Revenue split processed successfully!');
      
      // 4. Verify Wallet Update
      const { data: wallet } = await supabase
        .from('wallets')
        .select('*')
        .eq('doctor_id', doctor.id)
        .single();
      
      console.log('--- Wallet Status ---');
      console.log(`Current Balance: ৳${wallet.balance}`);
      console.log(`Total Earned: ৳${wallet.total_earned}`);

      // Expected doctor share: 70% of 1000 = 700
      if (parseFloat(wallet.balance) >= 700) {
        console.log('✅ VERIFICATION SUCCESS: Wallet balance updated correctly.');
      } else {
        console.warn('⚠️ VERIFICATION WARNING: Wallet balance might be incorrect. Expected >= 700.');
      }

      // 5. Verify Transaction Log
      const { data: tx } = await supabase
        .from('wallet_transactions')
        .select('*')
        .eq('source_id', bill.id)
        .single();
      
      if (tx) {
        console.log('--- Transaction Log ---');
        console.log(`Log Amount: ৳${tx.amount}`);
        console.log(`Description: ${tx.description}`);
        console.log('✅ VERIFICATION SUCCESS: Transaction ledger entry created.');
      }
    } else {
      console.error('❌ VERIFICATION FAILED: Revenue split engine returned false.');
    }

  } catch (err) {
    console.error('Error during test:', err);
  } finally {
    console.log('--- Test Completed ---');
    process.exit();
  }
};

testRevenueSplit();
