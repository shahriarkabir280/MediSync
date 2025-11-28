import { sql } from '../config/db.js';

// Get appointment analytics
export const getAppointmentAnalytics = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const { startDate, endDate } = req.query;

    // Appointments by status
    const appointmentsByStatus = await sql`
      SELECT 
        status,
        COUNT(*) as count
      FROM appointments
      WHERE doctor_id = ${doctorId}
      ${startDate ? sql`AND appointment_date >= ${startDate}` : sql``}
      ${endDate ? sql`AND appointment_date <= ${endDate}` : sql``}
      GROUP BY status
    `;

    // Appointments by type
    const appointmentsByType = await sql`
      SELECT 
        appointment_type,
        COUNT(*) as count
      FROM appointments
      WHERE doctor_id = ${doctorId}
      ${startDate ? sql`AND appointment_date >= ${startDate}` : sql``}
      ${endDate ? sql`AND appointment_date <= ${endDate}` : sql``}
      GROUP BY appointment_type
    `;

    // Appointments trend (last 7 days)
    const appointmentsTrend = await sql`
      SELECT 
        DATE(appointment_date) as date,
        COUNT(*) as count
      FROM appointments
      WHERE doctor_id = ${doctorId}
      AND appointment_date >= CURRENT_DATE - INTERVAL '7 days'
      GROUP BY DATE(appointment_date)
      ORDER BY date ASC
    `;

    // Peak hours
    const peakHours = await sql`
      SELECT 
        EXTRACT(HOUR FROM appointment_time) as hour,
        COUNT(*) as count
      FROM appointments
      WHERE doctor_id = ${doctorId}
      ${startDate ? sql`AND appointment_date >= ${startDate}` : sql``}
      ${endDate ? sql`AND appointment_date <= ${endDate}` : sql``}
      GROUP BY EXTRACT(HOUR FROM appointment_time)
      ORDER BY count DESC
      LIMIT 5
    `;

    res.json({
      success: true,
      data: {
        appointmentsByStatus,
        appointmentsByType,
        appointmentsTrend,
        peakHours
      }
    });
  } catch (error) {
    console.error('Error fetching appointment analytics:', error);
    res.status(500).json({ error: 'Failed to fetch appointment analytics' });
  }
};

// Get patient analytics
export const getPatientAnalytics = async (req, res) => {
  try {
    const { doctorId } = req.params;

    // Total patients
    const totalPatients = await sql`
      SELECT COUNT(DISTINCT patient_id) as count
      FROM appointments
      WHERE doctor_id = ${doctorId}
    `;

    // New patients this month
    const newPatientsThisMonth = await sql`
      SELECT COUNT(DISTINCT patient_id) as count
      FROM appointments
      WHERE doctor_id = ${doctorId}
      AND appointment_date >= DATE_TRUNC('month', CURRENT_DATE)
    `;

    // Patients by age group
    const patientsByAgeGroup = await sql`
      SELECT 
        CASE
          WHEN EXTRACT(YEAR FROM AGE(date_of_birth)) < 18 THEN 'Under 18'
          WHEN EXTRACT(YEAR FROM AGE(date_of_birth)) BETWEEN 18 AND 30 THEN '18-30'
          WHEN EXTRACT(YEAR FROM AGE(date_of_birth)) BETWEEN 31 AND 50 THEN '31-50'
          WHEN EXTRACT(YEAR FROM AGE(date_of_birth)) BETWEEN 51 AND 70 THEN '51-70'
          ELSE 'Over 70'
        END as age_group,
        COUNT(DISTINCT p.id) as count
      FROM patients p
      JOIN appointments a ON p.id = a.patient_id
      WHERE a.doctor_id = ${doctorId}
      AND p.date_of_birth IS NOT NULL
      GROUP BY age_group
      ORDER BY age_group
    `;

    // Patients by gender
    const patientsByGender = await sql`
      SELECT 
        gender,
        COUNT(DISTINCT p.id) as count
      FROM patients p
      JOIN appointments a ON p.id = a.patient_id
      WHERE a.doctor_id = ${doctorId}
      AND p.gender IS NOT NULL
      GROUP BY gender
    `;

    res.json({
      success: true,
      data: {
        totalPatients: parseInt(totalPatients[0].count),
        newPatientsThisMonth: parseInt(newPatientsThisMonth[0].count),
        patientsByAgeGroup,
        patientsByGender
      }
    });
  } catch (error) {
    console.error('Error fetching patient analytics:', error);
    res.status(500).json({ error: 'Failed to fetch patient analytics' });
  }
};

// Get revenue analytics
export const getRevenueAnalytics = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const { startDate, endDate } = req.query;

    // Total revenue
    const totalRevenue = await sql`
      SELECT 
        COALESCE(SUM(amount), 0) as total
      FROM billing
      WHERE doctor_id = ${doctorId}
      AND status = 'paid'
      ${startDate ? sql`AND created_at >= ${startDate}` : sql``}
      ${endDate ? sql`AND created_at <= ${endDate}` : sql``}
    `;

    // Revenue this month
    const revenueThisMonth = await sql`
      SELECT 
        COALESCE(SUM(amount), 0) as total
      FROM billing
      WHERE doctor_id = ${doctorId}
      AND status = 'paid'
      AND created_at >= DATE_TRUNC('month', CURRENT_DATE)
    `;

    // Revenue by month (last 6 months)
    const revenueByMonth = await sql`
      SELECT 
        TO_CHAR(created_at, 'Mon YYYY') as month,
        SUM(amount) as total
      FROM billing
      WHERE doctor_id = ${doctorId}
      AND status = 'paid'
      AND created_at >= CURRENT_DATE - INTERVAL '6 months'
      GROUP BY TO_CHAR(created_at, 'Mon YYYY'), DATE_TRUNC('month', created_at)
      ORDER BY DATE_TRUNC('month', created_at) ASC
    `;

    // Pending payments
    const pendingPayments = await sql`
      SELECT 
        COALESCE(SUM(amount), 0) as total,
        COUNT(*) as count
      FROM billing
      WHERE doctor_id = ${doctorId}
      AND status = 'pending'
    `;

    res.json({
      success: true,
      data: {
        totalRevenue: parseFloat(totalRevenue[0].total),
        revenueThisMonth: parseFloat(revenueThisMonth[0].total),
        revenueByMonth,
        pendingPayments: {
          total: parseFloat(pendingPayments[0].total),
          count: parseInt(pendingPayments[0].count)
        }
      }
    });
  } catch (error) {
    console.error('Error fetching revenue analytics:', error);
    res.status(500).json({ error: 'Failed to fetch revenue analytics' });
  }
};
