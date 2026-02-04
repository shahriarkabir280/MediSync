import { supabase } from '../config/db.js';

// Get all appointments for a doctor
export const getAppointments = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const { status, date, limit = 50, offset = 0 } = req.query;

    let query = supabase
      .from('appointments')
      .select(`
        *,
        patients (
          id, unique_id, first_name, last_name, email, phone, date_of_birth
        )
      `, { count: 'exact' })
      .eq('doctor_id', doctorId);

    // Add filters
    if (status) {
      query = query.eq('status', status);
    }

    if (date) {
      // Date comparison might need strict format matching or range check if timestamp?
      // Appointment date in schema is DATE, so string match YYYY-MM-DD works.
      query = query.eq('appointment_date', date);
    }

    const from = parseInt(offset);
    const to = from + parseInt(limit) - 1;

    const { data: appointments, error, count } = await query
      .order('appointment_date', { ascending: false })
      .order('appointment_time', { ascending: false })
      .range(from, to);

    if (error) throw error;

    // Flatten patient details
    const flattenedAppointments = appointments.map(appt => ({
      ...appt,
      patient_id: appt.patients?.id,
      patient_unique_id: appt.patients?.unique_id,
      patient_first_name: appt.patients?.first_name,
      patient_last_name: appt.patients?.last_name,
      patient_email: appt.patients?.email,
      patient_phone: appt.patients?.phone,
      patient_dob: appt.patients?.date_of_birth,
      patients: undefined
    }));

    res.json({ success: true, data: flattenedAppointments, count });
  } catch (error) {
    console.error('Error fetching appointments:', error);
    res.status(500).json({ error: 'Failed to fetch appointments' });
  }
};

// Get today's appointments
export const getTodayAppointments = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const today = new Date().toISOString().split('T')[0];

    const { data: appointments, error } = await supabase
      .from('appointments')
      .select(`
        *,
        patients (
          id, unique_id, first_name, last_name, email, phone
        )
      `)
      .eq('doctor_id', doctorId)
      .eq('appointment_date', today)
      .order('appointment_time', { ascending: true });

    if (error) throw error;

    const flattenedAppointments = appointments.map(appt => ({
      ...appt,
      patient_id: appt.patients?.id,
      patient_unique_id: appt.patients?.unique_id,
      patient_first_name: appt.patients?.first_name,
      patient_last_name: appt.patients?.last_name,
      patient_email: appt.patients?.email,
      patient_phone: appt.patients?.phone,
      patients: undefined
    }));

    res.json({ success: true, data: flattenedAppointments });
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
    const { data: existing, error: checkError } = await supabase
      .from('appointments')
      .select('id')
      .eq('doctor_id', doctorId)
      .eq('appointment_date', appointment_date)
      .eq('appointment_time', appointment_time)
      .neq('status', 'cancelled')
      .maybeSingle();

    if (existing) {
      return res.status(409).json({ error: 'Time slot is already booked' });
    }

    const { data, error } = await supabase
      .from('appointments')
      .insert({
        doctor_id: doctorId,
        patient_id,
        appointment_date,
        appointment_time,
        appointment_type: appointment_type || 'consultation',
        notes: notes || '',
        status: 'pending',
        created_at: new Date().toISOString(), // Optional if default exists
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({
      success: true,
      message: 'Appointment created successfully',
      data
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
    const body = req.body;

    // Explicitly pick allowed fields
    const updates = {};
    const allowed = ['appointment_date', 'appointment_time', 'status', 'appointment_type', 'notes'];

    allowed.forEach(field => {
      if (body[field] !== undefined) updates[field] = body[field];
    });

    updates.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('appointments')
      .update(updates)
      .eq('id', appointmentId)
      .select()
      .single();

    if (error) throw error;

    if (!data) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    res.json({
      success: true,
      message: 'Appointment updated successfully',
      data
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

    const { data, error } = await supabase
      .from('appointments')
      .update({ status: 'cancelled', updated_at: new Date().toISOString() })
      .eq('id', appointmentId)
      .select()
      .single();

    if (error) throw error;

    if (!data) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    res.json({
      success: true,
      message: 'Appointment cancelled successfully',
      data
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

    const { data: appointment, error } = await supabase
      .from('appointments')
      .select(`
        *,
        patients (
            unique_id, first_name, last_name, email, phone, date_of_birth, medical_history
        )
      `)
      .eq('id', appointmentId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Appointment not found' });
      }
      throw error;
    }

    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    const flattened = {
      ...appointment,
      patient_unique_id: appointment.patients?.unique_id,
      patient_first_name: appointment.patients?.first_name,
      patient_last_name: appointment.patients?.last_name,
      patient_email: appointment.patients?.email,
      patient_phone: appointment.patients?.phone,
      patient_dob: appointment.patients?.date_of_birth,
      patient_medical_history: appointment.patients?.medical_history,
      patients: undefined
    };

    res.json({ success: true, data: flattened });
  } catch (error) {
    console.error('Error fetching appointment:', error);
    res.status(500).json({ error: 'Failed to fetch appointment' });
  }
};

// Get appointments by patient
export const getAppointmentsByPatient = async (req, res) => {
  try {
    const { patientId } = req.params;

    const { data: appointments, error } = await supabase
      .from('appointments')
      .select(`
        *,
        doctors (
            unique_id, first_name, last_name
        )
      `)
      .eq('patient_id', patientId)
      .order('appointment_date', { ascending: false })
      .order('appointment_time', { ascending: false });

    if (error) throw error;

    const flattened = appointments.map(appt => ({
      ...appt,
      doctor_first_name: appt.doctors?.first_name,
      doctor_last_name: appt.doctors?.last_name,
      doctor_unique_id: appt.doctors?.unique_id,
      doctors: undefined
    }));

    res.json({ success: true, data: flattened });
  } catch (error) {
    console.error('Error fetching patient appointments:', error);
    res.status(500).json({ error: 'Failed to fetch patient appointments' });
  }
};
