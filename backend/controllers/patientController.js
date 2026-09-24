import { supabase } from '../config/db.js';
import { getNextPatientId } from '../lib/uniqueIdGenerator.js';
import bcrypt from 'bcryptjs';

// Get all patients for a doctor
export const getPatients = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const { search, limit = 50, offset = 0 } = req.query;

    // Build query to get all patients
    // Note: In a multi-doctor system, you might want to filter by doctor_id or appointments
    // For now, we show all patients and calculate their appointment count with this specific doctor
    let query = supabase
      .from('patients')
      .select('*');

    if (search) {
      // Search by name or email
      query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%`);
    }

    // Pagination
    const from = parseInt(offset);
    const to = from + parseInt(limit) - 1;

    const { data: patients, error } = await query
      .range(from, to)
      .order('first_name', { ascending: true })
      .order('last_name', { ascending: true });

    if (error) throw error;

    // For each patient, count their appointments with this specific doctor
    const patientsWithCounts = await Promise.all(
      patients.map(async (patient) => {
        const { count } = await supabase
          .from('appointments')
          .select('*', { count: 'exact', head: true })
          .eq('patient_id', patient.id)
          .eq('doctor_id', doctorId);

        return {
          ...patient,
          total_appointments: count || 0
        };
      })
    );

    res.json({ success: true, data: patientsWithCounts, count: patientsWithCounts.length });
  } catch (error) {
    console.error('Error fetching patients:', error);
    res.status(500).json({ error: 'Failed to fetch patients' });
  }
};

// Get patient by ID with full details
export const getPatientById = async (req, res) => {
  try {
    const { patientId } = req.params;

    // Fetch patient
    const { data: patient, error: patientError } = await supabase
      .from('patients')
      .select('*')
      .eq('id', patientId)
      .single();

    if (patientError || !patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    // Parallel fetch for details
    const [
      { data: appointments, error: apptError },
      { data: medicalRecords, error: medError }
    ] = await Promise.all([
      // Get patient's appointments with doctor details
      supabase
        .from('appointments')
        .select(`
          id, appointment_date, appointment_time, status, appointment_type, notes,
          doctors ( first_name, last_name )
        `)
        .eq('patient_id', patientId)
        .order('appointment_date', { ascending: false })
        .limit(10),

      // Get patient's medical records
      supabase
        .from('medical_records')
        .select('*')
        .eq('patient_id', patientId)
        .order('record_date', { ascending: false })
        .limit(10)
    ]);

    if (apptError || medError) {
      throw new Error('Error fetching patient details');
    }

    // Flatten doctor details for matching original response structure
    const flattenedAppointments = appointments?.map(appt => ({
      ...appt,
      doctor_first_name: appt.doctors?.first_name,
      doctor_last_name: appt.doctors?.last_name,
      doctors: undefined // Remove nested object
    }));

    res.json({
      success: true,
      data: {
        ...patient,
        appointments: flattenedAppointments,
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
      first_name, last_name, email, phone, date_of_birth, gender, blood_group,
      address, emergency_contact_name, emergency_contact_phone, medical_history, allergies,
      password
    } = req.body;

    // Validate required fields
    if (!first_name || !last_name || !email || !phone || !password) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters long' });
    }

    // Check if patient with email already exists
    const { data: existing, error: checkError } = await supabase
      .from('patients')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    if (existing) {
      return res.status(409).json({ error: 'Patient with this email already exists' });
    }

    // Generate unique ID for new patient
    const uniqueId = await getNextPatientId();
    const passwordHash = await bcrypt.hash(password, 10);

    const newPatient = {
      unique_id: uniqueId,
      first_name, last_name, email, phone,
      password_hash: passwordHash,
      date_of_birth: date_of_birth || null,
      gender: gender || null,
      blood_group: blood_group || null,
      address: address || null,
      emergency_contact_name: emergency_contact_name || null,
      emergency_contact_phone: emergency_contact_phone || null,
      medical_history: medical_history || null,
      allergies: allergies || null
    };

    const { data, error } = await supabase
      .from('patients')
      .insert(newPatient)
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({
      success: true,
      message: 'Patient created successfully',
      data: {
        ...data,
        password_hash: undefined
      }
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
    const body = req.body;

    // Fields allowed to be updated
    const allowedFields = [
      'first_name', 'last_name', 'email', 'phone', 'date_of_birth',
      'gender', 'blood_group', 'address', 'emergency_contact_name',
      'emergency_contact_phone', 'medical_history', 'allergies'
    ];

    const updates = {};
    allowedFields.forEach(field => {
      if (body[field] !== undefined) {
        updates[field] = body[field];
      }
    });
    updates.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('patients')
      .update(updates)
      .eq('id', patientId)
      .select()
      .single();

    if (error) throw error;

    if (!data) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    res.json({
      success: true,
      message: 'Patient updated successfully',
      data
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

    const { data: records, error } = await supabase
      .from('medical_records')
      .select(`
        *,
        doctors ( first_name, last_name )
      `)
      .eq('patient_id', patientId)
      .order('record_date', { ascending: false });

    if (error) throw error;

    // Flatten doctor details
    const flattenedRecords = records.map(record => ({
      ...record,
      doctor_first_name: record.doctors?.first_name,
      doctor_last_name: record.doctors?.last_name,
      doctors: undefined
    }));

    res.json({ success: true, data: flattenedRecords });
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
    const { data: existing, error: checkError } = await supabase
      .from('patients')
      .select('id')
      .eq('id', patientId)
      .maybeSingle();

    if (!existing) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    // Delete patient (CASCADE handles related records in DB if configured, 
    // but Supabase client deletion also respects Foreign Key constraints)
    const { error } = await supabase
      .from('patients')
      .delete()
      .eq('id', patientId);

    if (error) throw error;

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

    const newRecord = {
      patient_id: patientId,
      doctor_id,
      diagnosis,
      prescription: prescription || null,
      notes: notes || null,
      lab_results: lab_results || null,
      record_date: record_date || new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('medical_records')
      .insert(newRecord)
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({
      success: true,
      message: 'Medical record added successfully',
      data
    });
  } catch (error) {
    console.error('Error adding medical record:', error);
    res.status(500).json({ error: 'Failed to add medical record' });
  }
};

// Delete medical record
export const deleteMedicalRecord = async (req, res) => {
  try {
    const { recordId } = req.params;

    const { error } = await supabase
      .from('medical_records')
      .delete()
      .eq('id', recordId);

    if (error) throw error;

    res.json({
      success: true,
      message: 'Medical record deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting medical record:', error);
    res.status(500).json({ error: 'Failed to delete medical record' });
  }
};
