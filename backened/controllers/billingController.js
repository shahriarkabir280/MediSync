import { sql } from '../config/db.js';

// Get all billing records for a doctor
export const getBillingRecords = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const { status, limit = 50, offset = 0 } = req.query;

    let query = sql`
      SELECT 
        b.*,
        p.first_name as patient_first_name,
        p.last_name as patient_last_name,
        p.email as patient_email,
        p.phone as patient_phone
      FROM billing b
      JOIN patients p ON b.patient_id = p.id
      WHERE b.doctor_id = ${doctorId}
    `;

    if (status) {
      query = sql`${query} AND b.status = ${status}`;
    }

    query = sql`${query}
      ORDER BY b.created_at DESC
      LIMIT ${limit}
      OFFSET ${offset}
    `;

    const billingRecords = await query;

    res.json({ success: true, data: billingRecords, count: billingRecords.length });
  } catch (error) {
    console.error('Error fetching billing records:', error);
    res.status(500).json({ error: 'Failed to fetch billing records' });
  }
};

// Create billing record
export const createBillingRecord = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const {
      patient_id,
      appointment_id,
      amount,
      description,
      due_date
    } = req.body;

    if (!patient_id || !amount) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const result = await sql`
      INSERT INTO billing (
        doctor_id,
        patient_id,
        appointment_id,
        amount,
        description,
        due_date,
        status
      )
      VALUES (
        ${doctorId},
        ${patient_id},
        ${appointment_id || null},
        ${amount},
        ${description || ''},
        ${due_date || null},
        'pending'
      )
      RETURNING *
    `;

    res.status(201).json({
      success: true,
      message: 'Billing record created successfully',
      data: result[0]
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

    const result = await sql`
      UPDATE billing
      SET
        amount = COALESCE(${amount}, amount),
        description = COALESCE(${description}, description),
        status = COALESCE(${status}, status),
        due_date = COALESCE(${due_date}, due_date),
        payment_date = COALESCE(${payment_date}, payment_date),
        updated_at = NOW()
      WHERE id = ${billingId}
      RETURNING *
    `;

    if (result.length === 0) {
      return res.status(404).json({ error: 'Billing record not found' });
    }

    res.json({
      success: true,
      message: 'Billing record updated successfully',
      data: result[0]
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

    const result = await sql`
      UPDATE billing
      SET 
        status = 'paid',
        payment_date = NOW(),
        updated_at = NOW()
      WHERE id = ${billingId}
      RETURNING *
    `;

    if (result.length === 0) {
      return res.status(404).json({ error: 'Billing record not found' });
    }

    res.json({
      success: true,
      message: 'Billing marked as paid',
      data: result[0]
    });
  } catch (error) {
    console.error('Error marking billing as paid:', error);
    res.status(500).json({ error: 'Failed to mark billing as paid' });
  }
};

// Get billing summary
export const getBillingSummary = async (req, res) => {
  try {
    const { doctorId } = req.params;

    const summary = await sql`
      SELECT 
        COUNT(*) as total_records,
        SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END) as total_paid,
        SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END) as total_pending,
        SUM(CASE WHEN status = 'overdue' THEN amount ELSE 0 END) as total_overdue
      FROM billing
      WHERE doctor_id = ${doctorId}
    `;

    res.json({ success: true, data: summary[0] });
  } catch (error) {
    console.error('Error fetching billing summary:', error);
    res.status(500).json({ error: 'Failed to fetch billing summary' });
  }
};
