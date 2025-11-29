import { sql } from '../config/db.js';
import { getNextPatientId } from '../lib/uniqueIdGenerator.js';

// Get all patients for a doctor
export const getPatients = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const { search, limit = 50, offset = 0 } = req.query;

    let query;

    if (search) {
      // Search by name or email
      query = sql`
        SELECT DISTINCT 
          p.id,
          p.unique_id,
          p.first_name,
          p.last_name,
          p.email,
          p.phone,
          p.date_of_birth,
          p.gender,
          p.blood_group,
          p.address,
          p.created_at,
          COUNT(a.id) as total_appointments
        FROM patients p
        JOIN appointments a ON p.id = a.patient_id
        WHERE a.doctor_id = ${doctorId}
        AND (
          p.first_name ILIKE ${'%' + search + '%'} OR
          p.last_name ILIKE ${'%' + search + '%'} OR
          p.email ILIKE ${'%' + search + '%'}
        )
        GROUP BY p.id
        ORDER BY p.first_name, p.last_name
        LIMIT ${limit}
        OFFSET ${offset}
      `;
    } else {
      query = sql`
        SELECT DISTINCT 
          p.id,
          p.unique_id,
          p.first_name,
          p.last_name,
          p.email,
          p.phone,
          p.date_of_birth,
          p.gender,
          p.blood_group,
          p.address,
          p.created_at,
          COUNT(a.id) as total_appointments
        FROM patients p
        JOIN appointments a ON p.id = a.patient_id
        WHERE a.doctor_id = ${doctorId}
        GROUP BY p.id
        ORDER BY p.first_name, p.last_name
        LIMIT ${limit}
        OFFSET ${offset}
      `;
    }

    const patients = await query;

    res.json({ success: true, data: patients, count: patients.length });
  } catch (error) {
    console.error('Error fetching patients:', error);
    res.status(500).json({ error: 'Failed to fetch patients' });
  }
};

// Get patient by ID with full details
export const getPatientById = async (req, res) => {
  try {
    const { patientId } = req.params;

    const patient = await sql`
      SELECT *
      FROM patients
      WHERE id = ${patientId}
    `;

    if (patient.length === 0) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    // Get patient's appointments
    const appointments = await sql`
      SELECT 
        a.id,
        a.appointment_date,
        a.appointment_time,
        a.status,
        a.appointment_type,
        a.notes,
        d.first_name as doctor_first_name,
        d.last_name as doctor_last_name
      FROM appointments a
      JOIN doctors d ON a.doctor_id = d.id
      WHERE a.patient_id = ${patientId}
      ORDER BY a.appointment_date DESC
      LIMIT 10
    `;

    // Get patient's medical records
    const medicalRecords = await sql`
      SELECT *
      FROM medical_records
      WHERE patient_id = ${patientId}
      ORDER BY record_date DESC
      LIMIT 10
    `;

    res.json({
      success: true,
      data: {
        ...patient[0],
        appointments,
        medicalRecords
      }
    });
  } catch (error) {
    console.error('Error fetching patient:', error);
    res.status(500).json({ error: 'Failed to fetch patient details' });
  }
};

// Create new patient
export const createPatient = async (req, res) => {
  try {
    const {
      first_name,
      last_name,
      email,
      phone,
      date_of_birth,
      gender,
      blood_group,
      address,
      emergency_contact_name,
      emergency_contact_phone,
      medical_history,
      allergies
    } = req.body;

    // Validate required fields
    if (!first_name || !last_name || !email || !phone) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check if patient with email already exists
    const existingPatient = await sql`
      SELECT id FROM patients WHERE email = ${email}
    `;

    if (existingPatient.length > 0) {
      return res.status(409).json({ error: 'Patient with this email already exists' });
    }

    // Generate unique ID for new patient
    const uniqueId = await getNextPatientId();

    const result = await sql`
      INSERT INTO patients (
        unique_id,
        first_name,
        last_name,
        email,
        phone,
        date_of_birth,
        gender,
        blood_group,
        address,
        emergency_contact_name,
        emergency_contact_phone,
        medical_history,
        allergies
      )
      VALUES (
        ${uniqueId},
        ${first_name},
        ${last_name},
        ${email},
        ${phone},
        ${date_of_birth || null},
        ${gender || null},
        ${blood_group || null},
        ${address || null},
        ${emergency_contact_name || null},
        ${emergency_contact_phone || null},
        ${medical_history || null},
        ${allergies || null}
      )
      RETURNING *
    `;

    res.status(201).json({
      success: true,
      message: 'Patient created successfully',
      data: result[0]
    });
  } catch (error) {
    console.error('Error creating patient:', error);
    res.status(500).json({ error: 'Failed to create patient' });
  }
};

// Update patient
export const updatePatient = async (req, res) => {
  try {
    const { patientId } = req.params;
    const {
      first_name,
      last_name,
      email,
      phone,
      date_of_birth,
      gender,
      blood_group,
      address,
      emergency_contact_name,
      emergency_contact_phone,
      medical_history,
      allergies
    } = req.body;

    const result = await sql`
      UPDATE patients
      SET
        first_name = COALESCE(${first_name}, first_name),
        last_name = COALESCE(${last_name}, last_name),
        email = COALESCE(${email}, email),
        phone = COALESCE(${phone}, phone),
        date_of_birth = COALESCE(${date_of_birth}, date_of_birth),
        gender = COALESCE(${gender}, gender),
        blood_group = COALESCE(${blood_group}, blood_group),
        address = COALESCE(${address}, address),
        emergency_contact_name = COALESCE(${emergency_contact_name}, emergency_contact_name),
        emergency_contact_phone = COALESCE(${emergency_contact_phone}, emergency_contact_phone),
        medical_history = COALESCE(${medical_history}, medical_history),
        allergies = COALESCE(${allergies}, allergies),
        updated_at = NOW()
      WHERE id = ${patientId}
      RETURNING *
    `;

    if (result.length === 0) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    res.json({
      success: true,
      message: 'Patient updated successfully',
      data: result[0]
    });
  } catch (error) {
    console.error('Error updating patient:', error);
    res.status(500).json({ error: 'Failed to update patient' });
  }
};

// Get patient's medical history
export const getPatientMedicalHistory = async (req, res) => {
  try {
    const { patientId } = req.params;

    const records = await sql`
      SELECT 
        mr.*,
        d.first_name as doctor_first_name,
        d.last_name as doctor_last_name
      FROM medical_records mr
      JOIN doctors d ON mr.doctor_id = d.id
      WHERE mr.patient_id = ${patientId}
      ORDER BY mr.record_date DESC
    `;

    res.json({ success: true, data: records });
  } catch (error) {
    console.error('Error fetching medical history:', error);
    res.status(500).json({ error: 'Failed to fetch medical history' });
  }
};

// Delete patient
export const deletePatient = async (req, res) => {
  try {
    const { patientId } = req.params;

    // Check if patient exists
    const patient = await sql`
      SELECT id FROM patients WHERE id = ${patientId}
    `;

    if (patient.length === 0) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    // Delete patient (CASCADE will handle related records)
    await sql`
      DELETE FROM patients WHERE id = ${patientId}
    `;

    res.json({
      success: true,
      message: 'Patient deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting patient:', error);
    res.status(500).json({ error: 'Failed to delete patient' });
  }
};

// Add medical record for patient
export const addMedicalRecord = async (req, res) => {
  try {
    const { patientId } = req.params;
    const {
      doctor_id,
      diagnosis,
      prescription,
      notes,
      lab_results,
      record_date
    } = req.body;

    if (!doctor_id || !diagnosis) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const result = await sql`
      INSERT INTO medical_records (
        patient_id,
        doctor_id,
        diagnosis,
        prescription,
        notes,
        lab_results,
        record_date
      )
      VALUES (
        ${patientId},
        ${doctor_id},
        ${diagnosis},
        ${prescription || null},
        ${notes || null},
        ${lab_results || null},
        ${record_date || 'NOW()'}
      )
      RETURNING *
    `;

    res.status(201).json({
      success: true,
      message: 'Medical record added successfully',
      data: result[0]
    });
  } catch (error) {
    console.error('Error adding medical record:', error);
    res.status(500).json({ error: 'Failed to add medical record' });
  }
};
