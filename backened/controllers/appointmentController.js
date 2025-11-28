import { sql } from '../config/db.js';

// Get all appointments for a doctor
export const getAppointments = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const { status, date, limit = 50, offset = 0 } = req.query;

    let query = sql`
      SELECT 
        a.id,
        a.appointment_date,
        a.appointment_time,
        a.status,
        a.appointment_type,
        a.notes,
        a.created_at,
        p.id as patient_id,
        p.unique_id as patient_unique_id,
        p.first_name as patient_first_name,
        p.last_name as patient_last_name,
        p.email as patient_email,
        p.phone as patient_phone,
        p.date_of_birth as patient_dob
      FROM appointments a
      JOIN patients p ON a.patient_id = p.id
      WHERE a.doctor_id = ${doctorId}
    `;

    // Add filters
    if (status) {
      query = sql`${query} AND a.status = ${status}`;
    }

    if (date) {
      query = sql`${query} AND DATE(a.appointment_date) = ${date}`;
    }

    query = sql`${query}
      ORDER BY a.appointment_date DESC, a.appointment_time DESC
      LIMIT ${limit}
      OFFSET ${offset}
    `;

    const appointments = await query;

    res.json({ success: true, data: appointments, count: appointments.length });
  } catch (error) {
    console.error('Error fetching appointments:', error);
    res.status(500).json({ error: 'Failed to fetch appointments' });
  }
};

// Get today's appointments
export const getTodayAppointments = async (req, res) => {
  try {
    const { doctorId } = req.params;

    const appointments = await sql`
      SELECT 
        a.id,
        a.appointment_date,
        a.appointment_time,
        a.status,
        a.appointment_type,
        a.notes,
        p.id as patient_id,
        p.unique_id as patient_unique_id,
        p.first_name as patient_first_name,
        p.last_name as patient_last_name,
        p.email as patient_email,
        p.phone as patient_phone
      FROM appointments a
      JOIN patients p ON a.patient_id = p.id
      WHERE a.doctor_id = ${doctorId}
      AND DATE(a.appointment_date) = CURRENT_DATE
      ORDER BY a.appointment_time ASC
    `;

    res.json({ success: true, data: appointments });
  } catch (error) {
    console.error('Error fetching today\'s appointments:', error);
    res.status(500).json({ error: 'Failed to fetch today\'s appointments' });
  }
};

// Create new appointment
export const createAppointment = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const { 
      patient_id, 
      appointment_date, 
      appointment_time, 
      appointment_type, 
      notes 
    } = req.body;

    // Validate required fields
    if (!patient_id || !appointment_date || !appointment_time) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check if time slot is available
    const existingAppointment = await sql`
      SELECT id FROM appointments
      WHERE doctor_id = ${doctorId}
      AND appointment_date = ${appointment_date}
      AND appointment_time = ${appointment_time}
      AND status != 'cancelled'
    `;

    if (existingAppointment.length > 0) {
      return res.status(409).json({ error: 'Time slot is already booked' });
    }

    const result = await sql`
      INSERT INTO appointments (
        doctor_id,
        patient_id,
        appointment_date,
        appointment_time,
        appointment_type,
        notes,
        status
      )
      VALUES (
        ${doctorId},
        ${patient_id},
        ${appointment_date},
        ${appointment_time},
        ${appointment_type || 'consultation'},
        ${notes || ''},
        'pending'
      )
      RETURNING *
    `;

    res.status(201).json({ 
      success: true, 
      message: 'Appointment created successfully', 
      data: result[0] 
    });
  } catch (error) {
    console.error('Error creating appointment:', error);
    res.status(500).json({ error: 'Failed to create appointment' });
  }
};

// Update appointment
export const updateAppointment = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const { 
      appointment_date, 
      appointment_time, 
      status, 
      appointment_type, 
      notes 
    } = req.body;

    const result = await sql`
      UPDATE appointments
      SET
        appointment_date = COALESCE(${appointment_date}, appointment_date),
        appointment_time = COALESCE(${appointment_time}, appointment_time),
        status = COALESCE(${status}, status),
        appointment_type = COALESCE(${appointment_type}, appointment_type),
        notes = COALESCE(${notes}, notes),
        updated_at = NOW()
      WHERE id = ${appointmentId}
      RETURNING *
    `;

    if (result.length === 0) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    res.json({ 
      success: true, 
      message: 'Appointment updated successfully', 
      data: result[0] 
    });
  } catch (error) {
    console.error('Error updating appointment:', error);
    res.status(500).json({ error: 'Failed to update appointment' });
  }
};

// Cancel appointment
export const cancelAppointment = async (req, res) => {
  try {
    const { appointmentId } = req.params;

    const result = await sql`
      UPDATE appointments
      SET status = 'cancelled', updated_at = NOW()
      WHERE id = ${appointmentId}
      RETURNING *
    `;

    if (result.length === 0) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    res.json({ 
      success: true, 
      message: 'Appointment cancelled successfully', 
      data: result[0] 
    });
  } catch (error) {
    console.error('Error cancelling appointment:', error);
    res.status(500).json({ error: 'Failed to cancel appointment' });
  }
};

// Get appointment by ID
export const getAppointmentById = async (req, res) => {
  try {
    const { appointmentId } = req.params;

    const result = await sql`
      SELECT 
        a.*,
        p.unique_id as patient_unique_id,
        p.first_name as patient_first_name,
        p.last_name as patient_last_name,
        p.email as patient_email,
        p.phone as patient_phone,
        p.date_of_birth as patient_dob,
        p.medical_history as patient_medical_history
      FROM appointments a
      JOIN patients p ON a.patient_id = p.id
      WHERE a.id = ${appointmentId}
    `;

    if (result.length === 0) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    res.json({ success: true, data: result[0] });
  } catch (error) {
    console.error('Error fetching appointment:', error);
    res.status(500).json({ error: 'Failed to fetch appointment' });
  }
};
