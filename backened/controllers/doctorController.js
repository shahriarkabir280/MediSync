import { supabase } from '../config/db.js';

// Get doctor profile
export const getDoctorProfile = async (req, res) => {
  try {
    const { doctorId } = req.params;

    const { data, error } = await supabase
      .from('doctors')
      .select(`
        id, unique_id, first_name, last_name, email, phone, specialization, 
        license_number, years_of_experience, bio, profile_image_url, 
        smtp_host, smtp_port, smtp_user, smtp_pass, smtp_secure, smtp_enabled,
        created_at, updated_at
      `)
      .eq('id', doctorId)
      .single();

    if (error) {
      // Check if error is 'no rows found' effectively
      if (error.code === 'PGRST116') { // code for no rows returns
        return res.status(404).json({ error: 'Doctor not found' });
      }
      throw error;
    }

    if (!data) {
      return res.status(404).json({ error: 'Doctor not found' });
    }

    res.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching doctor profile:', error);
    res.status(500).json({ error: 'Failed to fetch doctor profile' });
  }
};

// Update doctor profile
export const updateDoctorProfile = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const {
      first_name,
      last_name,
      email,
      phone,
      specialization,
      years_of_experience,
      bio,
      profile_image_url
    } = req.body;

    // Construct update data, filtering out undefined values to allow partial updates
    // Supabase update ignores keys that are not present, but simple JS object creation is cleaner
    // However, if we pass undefined, it might be an issue?
    // Let's rely on the frontend sending what needs to be updated, or partial object.
    // The previous SQL used COALESCE(new, old), implying partial updates.
    // We can fetch first, or just passed defined values.

    const updates = {};
    if (first_name !== undefined) updates.first_name = first_name;
    if (last_name !== undefined) updates.last_name = last_name;
    if (email !== undefined) updates.email = email;
    if (phone !== undefined) updates.phone = phone;
    if (specialization !== undefined) updates.specialization = specialization;
    if (years_of_experience !== undefined) updates.years_of_experience = years_of_experience;
    if (bio !== undefined) updates.bio = bio;
    if (profile_image_url !== undefined) updates.profile_image_url = profile_image_url;

    // SMTP Settings
    if (req.body.smtp_host !== undefined) updates.smtp_host = req.body.smtp_host;
    if (req.body.smtp_port !== undefined) updates.smtp_port = req.body.smtp_port;
    if (req.body.smtp_user !== undefined) updates.smtp_user = req.body.smtp_user;
    if (req.body.smtp_pass !== undefined) updates.smtp_pass = req.body.smtp_pass;
    if (req.body.smtp_secure !== undefined) updates.smtp_secure = req.body.smtp_secure;
    if (req.body.smtp_enabled !== undefined) updates.smtp_enabled = req.body.smtp_enabled;

    updates.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('doctors')
      .update(updates)
      .eq('id', doctorId)
      .select()
      .single();

    if (error) throw error;

    if (!data) {
      return res.status(404).json({ error: 'Doctor not found' });
    }

    res.json({ success: true, message: 'Profile updated successfully', data });
  } catch (error) {
    console.error('Error updating doctor profile:', error);
    res.status(500).json({ error: 'Failed to update doctor profile' });
  }
};

// Get doctor dashboard statistics
export const getDashboardStats = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const now = new Date();

    // Today's date string YYYY-MM-DD
    const today = now.toISOString().split('T')[0];

    // Start of week (assuming Sunday start, or just basic 7 days ago? SQL used DATE_TRUNC('week'))
    // Postgres DATE_TRUNC('week') usually starts Monday.
    const startOfWeek = new Date(now);
    const day = startOfWeek.getDay() || 7; // Get current day number, converting Sun(0) to 7
    if (day !== 1) startOfWeek.setHours(-24 * (day - 1)); // Set to Monday
    else startOfWeek.setHours(0, 0, 0, 0);
    const startOfWeekStr = startOfWeek.toISOString();

    // Start of month
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    // Parallelize queries
    const [
      { count: todayCount, error: todayError },
      { count: weekCount, error: weekError },
      { count: monthCount, error: monthError },
      { data: allAppointments, error: patientsError }, // Fetch all to count unique patients (inefficient for large data, but ok for now)
      { count: pendingCount, error: pendingError }
    ] = await Promise.all([
      // Today
      supabase.from('appointments')
        .select('*', { count: 'exact', head: true })
        .eq('doctor_id', doctorId)
        .eq('appointment_date', today),

      // Week
      supabase.from('appointments')
        .select('*', { count: 'exact', head: true })
        .eq('doctor_id', doctorId)
        .gte('appointment_date', startOfWeekStr), // Approximate week check (from start of current week)

      // Month
      supabase.from('appointments')
        .select('*', { count: 'exact', head: true })
        .eq('doctor_id', doctorId)
        .gte('appointment_date', startOfMonth),

      // Total Patients (Unique) - fetch patient_id only
      supabase.from('appointments')
        .select('patient_id')
        .eq('doctor_id', doctorId),

      // Pending
      supabase.from('appointments')
        .select('*', { count: 'exact', head: true })
        .eq('doctor_id', doctorId)
        .eq('status', 'pending')
    ]);

    if (todayError || weekError || monthError || patientsError || pendingError) {
      throw new Error('Database error fetching stats');
    }

    // Calculate unique patients in JS
    const uniquePatients = new Set(allAppointments?.map(a => a.patient_id)).size;

    res.json({
      success: true,
      data: {
        todayAppointments: todayCount || 0,
        weekAppointments: weekCount || 0,
        monthAppointments: monthCount || 0,
        totalPatients: uniquePatients,
        pendingAppointments: pendingCount || 0
      }
    });

  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard statistics' });
  }
};

// Update doctor settings
export const updateDoctorSettings = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const {
      default_appointment_duration,
      working_hours_start,
      working_hours_end,
      consultation_fee,
      accept_new_patients
    } = req.body;

    const updates = {
      doctor_id: doctorId,
      updated_at: new Date().toISOString()
    };

    if (default_appointment_duration !== undefined) updates.default_appointment_duration = default_appointment_duration;
    if (working_hours_start !== undefined) updates.working_hours_start = working_hours_start;
    if (working_hours_end !== undefined) updates.working_hours_end = working_hours_end;
    if (consultation_fee !== undefined) updates.consultation_fee = consultation_fee;
    if (accept_new_patients !== undefined) updates.accept_new_patients = accept_new_patients;

    // Upsert (Insert or Update) based on UNIQUE doctor_id
    const { data, error } = await supabase
      .from('doctor_settings')
      .upsert(updates, { onConflict: 'doctor_id' })
      .select()
      .single();

    if (error) throw error;

    res.json({ success: true, message: 'Settings updated successfully', data });
  } catch (error) {
    console.error('Error updating doctor settings:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
};

// Get doctor settings
export const getDoctorSettings = async (req, res) => {
  try {
    const { doctorId } = req.params;

    const { data, error } = await supabase
      .from('doctor_settings')
      .select('*')
      .eq('doctor_id', doctorId)
      .maybeSingle(); // maybeSingle returns null instead of error if not found

    if (error) throw error;

    if (!data) {
      // Return default settings if none exist
      return res.json({
        success: true,
        data: {
          doctor_id: doctorId,
          default_appointment_duration: 30,
          working_hours_start: '09:00',
          working_hours_end: '17:00',
          consultation_fee: 0,
          accept_new_patients: true
        }
      });
    }

    res.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching doctor settings:', error);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
};
