import { supabase } from '../config/db.js';
import { processRevenueSplit } from './walletController.js';


// Get all billing records for a doctor
export const getBillingRecords = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const { status, limit = 50, offset = 0 } = req.query;

    let query = supabase
      .from('billing')
      .select(`
        *,
        patients (
          first_name, last_name, email, phone
        )
      `, { count: 'exact' })
      .eq('doctor_id', doctorId);

    if (status) {
      query = query.eq('status', status);
    }

    const from = parseInt(offset);
    const to = from + parseInt(limit) - 1;

    const { data: billingRecords, error, count } = await query
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) throw error;

    const flattened = billingRecords.map(record => ({
      ...record,
      patient_first_name: record.patients?.first_name,
      patient_last_name: record.patients?.last_name,
      patient_email: record.patients?.email,
      patient_phone: record.patients?.phone,
      patients: undefined
    }));

    res.json({ success: true, data: flattened, count });
  } catch (error) {
    console.error('Error fetching billing records:', error);
    res.status(500).json({ error: 'Failed to fetch billing records' });
  }
};

// Create billing record
export const createBillingRecord = async (req, res) => {
  try {
    const { doctorId } = req.params;
    let {
      patient_id,
      patient_name,
      patient_email,
      appointment_id,
      amount,
      description,
      due_date
    } = req.body;

    if (!amount) {
      return res.status(400).json({ error: 'Amount is required' });
    }

    // If patient_id is missing, try to find or create a patient by email
    if (!patient_id && patient_email) {
      const { data: existingPatient } = await supabase
        .from('patients')
        .select('id')
        .eq('email', patient_email)
        .maybeSingle();

      if (existingPatient) {
        patient_id = existingPatient.id;
      } else {
        // Create a new patient
        const names = (patient_name || 'Generic Patient').split(' ');
        const first_name = names[0];
        const last_name = names.slice(1).join(' ') || 'Patient';

        const { data: newPatient, error: pError } = await supabase
          .from('patients')
          .insert({
            first_name,
            last_name,
            email: patient_email,
            updated_at: new Date().toISOString()
          })
          .select()
          .single();

        if (pError) {
          console.error('Error creating patient during billing:', pError);
          // Fallback: if we can't create a patient, we can't create a bill due to FK
          return res.status(400).json({ error: 'Failed to find or create patient' });
        }
        patient_id = newPatient.id;
      }
    }

    if (!patient_id) {
      return res.status(400).json({ error: 'Patient ID or Patient Email is required' });
    }

    const { data, error } = await supabase
      .from('billing')
      .insert({
        doctor_id: doctorId,
        patient_id,
        appointment_id: appointment_id || null,
        amount,
        description: description || '',
        due_date: due_date || null,
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({
      success: true,
      message: 'Billing record created successfully',
      data
    });
  } catch (error) {
    console.error('Error creating billing record:', error);
    res.status(500).json({ error: 'Failed to create billing record' });
  }
};

// Update billing record
export const updateBillingRecord = async (req, res) => {
  try {
    const { billingId } = req.params;
    const { amount, description, status, due_date, payment_date } = req.body;

    const updates = {};
    if (amount !== undefined) updates.amount = amount;
    if (description !== undefined) updates.description = description;
    if (status !== undefined) updates.status = status;
    if (due_date !== undefined) updates.due_date = due_date;
    if (payment_date !== undefined) updates.payment_date = payment_date;
    updates.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('billing')
      .update(updates)
      .eq('id', billingId)
      .select()
      .single();

    if (error) throw error;

    if (!data) {
      return res.status(404).json({ error: 'Billing record not found' });
    }

    res.json({
      success: true,
      message: 'Billing record updated successfully',
      data
    });
  } catch (error) {
    console.error('Error updating billing record:', error);
    res.status(500).json({ error: 'Failed to update billing record' });
  }
};

// Mark billing as paid
export const markAsPaid = async (req, res) => {
  try {
    const { billingId } = req.params;

    const { data, error } = await supabase
      .from('billing')
      .update({
        status: 'paid',
        payment_date: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', billingId)
      .select()
      .single();

    if (error) throw error;

    if (!data) {
      return res.status(404).json({ error: 'Billing record not found' });
    }

    res.json({
      success: true,
      message: 'Billing marked as paid',
      data
    });

    // Trigger Revenue Split Engine
    processRevenueSplit(billingId);
  } catch (error) {
    console.error('Error marking billing as paid:', error);
    res.status(500).json({ error: 'Failed to mark billing as paid' });
  }
};

// Get billing summary
export const getBillingSummary = async (req, res) => {
  try {
    const { doctorId } = req.params;

    // Fetch all billing records for stats calculation
    // This might be heavy for very large datasets, but for individual doctors it's likely okay.
    // Ideally, use Supabase RPC or Views for performance.
    const { data: allBillings, error } = await supabase
      .from('billing')
      .select('amount, status')
      .eq('doctor_id', doctorId);

    if (error) throw error;

    const summary = {
      total_records: allBillings?.length || 0,
      total_paid: 0,
      total_pending: 0,
      total_overdue: 0
    };

    allBillings?.forEach(bill => {
      const amount = parseFloat(bill.amount);
      if (bill.status === 'paid') summary.total_paid += amount;
      else if (bill.status === 'pending') summary.total_pending += amount;
      else if (bill.status === 'overdue') summary.total_overdue += amount;
    });

    res.json({ success: true, data: summary });
  } catch (error) {
    console.error('Error fetching billing summary:', error);
    res.status(500).json({ error: 'Failed to fetch billing summary' });
  }
};
