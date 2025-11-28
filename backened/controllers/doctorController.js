import { sql } from '../config/db.js';

// Get doctor profile
export const getDoctorProfile = async (req, res) => {
  try {
    const { doctorId } = req.params;
    
    const result = await sql`
      SELECT id, unique_id, first_name, last_name, email, phone, specialization, 
             license_number, years_of_experience, bio, profile_image_url, 
             created_at, updated_at
      FROM doctors 
      WHERE id = ${doctorId}
    `;

    if (result.length === 0) {
      return res.status(404).json({ error: 'Doctor not found' });
    }

    res.json({ success: true, data: result[0] });
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

    const result = await sql`
      UPDATE doctors 
      SET 
        first_name = COALESCE(${first_name}, first_name),
        last_name = COALESCE(${last_name}, last_name),
        email = COALESCE(${email}, email),
        phone = COALESCE(${phone}, phone),
        specialization = COALESCE(${specialization}, specialization),
        years_of_experience = COALESCE(${years_of_experience}, years_of_experience),
        bio = COALESCE(${bio}, bio),
        profile_image_url = COALESCE(${profile_image_url}, profile_image_url),
        updated_at = NOW()
      WHERE id = ${doctorId}
      RETURNING *
    `;

    if (result.length === 0) {
      return res.status(404).json({ error: 'Doctor not found' });
    }

    res.json({ success: true, message: 'Profile updated successfully', data: result[0] });
  } catch (error) {
    console.error('Error updating doctor profile:', error);
    res.status(500).json({ error: 'Failed to update doctor profile' });
  }
};

// Get doctor dashboard statistics
export const getDashboardStats = async (req, res) => {
  try {
    const { doctorId } = req.params;

    // Get today's appointments count
    const todayAppointments = await sql`
      SELECT COUNT(*) as count
      FROM appointments
      WHERE doctor_id = ${doctorId}
      AND DATE(appointment_date) = CURRENT_DATE
    `;

    // Get this week's appointments count
    const weekAppointments = await sql`
      SELECT COUNT(*) as count
      FROM appointments
      WHERE doctor_id = ${doctorId}
      AND appointment_date >= DATE_TRUNC('week', CURRENT_DATE)
      AND appointment_date < DATE_TRUNC('week', CURRENT_DATE) + INTERVAL '1 week'
    `;

    // Get this month's appointments count
    const monthAppointments = await sql`
      SELECT COUNT(*) as count
      FROM appointments
      WHERE doctor_id = ${doctorId}
      AND appointment_date >= DATE_TRUNC('month', CURRENT_DATE)
      AND appointment_date < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month'
    `;

    // Get total patients count
    const totalPatients = await sql`
      SELECT COUNT(DISTINCT patient_id) as count
      FROM appointments
      WHERE doctor_id = ${doctorId}
    `;

    // Get pending appointments
    const pendingAppointments = await sql`
      SELECT COUNT(*) as count
      FROM appointments
      WHERE doctor_id = ${doctorId}
      AND status = 'pending'
    `;

    res.json({
      success: true,
      data: {
        todayAppointments: parseInt(todayAppointments[0].count),
        weekAppointments: parseInt(weekAppointments[0].count),
        monthAppointments: parseInt(monthAppointments[0].count),
        totalPatients: parseInt(totalPatients[0].count),
        pendingAppointments: parseInt(pendingAppointments[0].count)
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

    const result = await sql`
      UPDATE doctor_settings 
      SET 
        default_appointment_duration = COALESCE(${default_appointment_duration}, default_appointment_duration),
        working_hours_start = COALESCE(${working_hours_start}, working_hours_start),
        working_hours_end = COALESCE(${working_hours_end}, working_hours_end),
        consultation_fee = COALESCE(${consultation_fee}, consultation_fee),
        accept_new_patients = COALESCE(${accept_new_patients}, accept_new_patients),
        updated_at = NOW()
      WHERE doctor_id = ${doctorId}
      RETURNING *
    `;

    if (result.length === 0) {
      // Create settings if they don't exist
      const newSettings = await sql`
        INSERT INTO doctor_settings (
          doctor_id, 
          default_appointment_duration, 
          working_hours_start, 
          working_hours_end,
          consultation_fee,
          accept_new_patients
        )
        VALUES (
          ${doctorId}, 
          ${default_appointment_duration || 30}, 
          ${working_hours_start || '09:00'}, 
          ${working_hours_end || '17:00'},
          ${consultation_fee || 0},
          ${accept_new_patients !== undefined ? accept_new_patients : true}
        )
        RETURNING *
      `;
      return res.json({ success: true, message: 'Settings created successfully', data: newSettings[0] });
    }

    res.json({ success: true, message: 'Settings updated successfully', data: result[0] });
  } catch (error) {
    console.error('Error updating doctor settings:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
};

// Get doctor settings
export const getDoctorSettings = async (req, res) => {
  try {
    const { doctorId } = req.params;

    const result = await sql`
      SELECT *
      FROM doctor_settings
      WHERE doctor_id = ${doctorId}
    `;

    if (result.length === 0) {
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

    res.json({ success: true, data: result[0] });
  } catch (error) {
    console.error('Error fetching doctor settings:', error);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
};
