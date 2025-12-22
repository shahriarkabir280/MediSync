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

    // Peak Demand by Day of Week
    const appointmentsByDay = await sql`
      SELECT 
        TO_CHAR(appointment_date, 'Day') as day,
        COUNT(*) as count
      FROM appointments
      WHERE doctor_id = ${doctorId}
      ${startDate ? sql`AND appointment_date >= ${startDate}` : sql``}
      ${endDate ? sql`AND appointment_date <= ${endDate}` : sql``}
      GROUP BY TO_CHAR(appointment_date, 'Day'), EXTRACT(DOW FROM appointment_date)
      ORDER BY EXTRACT(DOW FROM appointment_date)
    `;

    // No-show / Cancellation analysis
    const cancellationStats = await sql`
      SELECT 
        status,
        COUNT(*) as count
      FROM appointments
      WHERE doctor_id = ${doctorId}
      AND status IN ('completed', 'cancelled')
      GROUP BY status
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
      LIMIT 10
    `;

    // Recurring patients (loyalty)
    const recurringPatients = await sql`
      SELECT COUNT(*) as count FROM (
        SELECT patient_id 
        FROM appointments 
        WHERE doctor_id = ${doctorId} 
        GROUP BY patient_id 
        HAVING COUNT(*) > 1
      ) as recurring
    `;

    // Operational Efficiency Metrics
    const efficiencyStats = await sql`
      SELECT 
        AVG(EXTRACT(EPOCH FROM (actual_end_time - actual_start_time))/60)::numeric(10,1) as avg_consultation,
        AVG(EXTRACT(EPOCH FROM (actual_start_time - (appointment_date + appointment_time)))/60)::numeric(10,1) as avg_wait_time
      FROM appointments
      WHERE doctor_id = ${doctorId}
      AND status = 'completed'
      AND actual_start_time IS NOT NULL
      AND actual_end_time IS NOT NULL
    `;

    // Patient Feedback Analytics
    const feedbackStats = await sql`
      SELECT 
        AVG(rating)::numeric(10,1) as avg_rating,
        COUNT(*) as total_reviews
      FROM patient_feedback
      WHERE doctor_id = ${doctorId}
    `;

    const recentFeedback = await sql`
      SELECT 
        f.comment,
        f.rating,
        p.first_name || ' ' || p.last_name as patient_name
      FROM patient_feedback f
      JOIN patients p ON f.patient_id = p.id
      WHERE f.doctor_id = ${doctorId}
      ORDER BY f.created_at DESC
      LIMIT 3
    `;

    // Active visits current period (for trend)
    const currentVisits = await sql`
      SELECT COUNT(*) as count 
      FROM appointments 
      WHERE doctor_id = ${doctorId}
      ${startDate ? sql`AND appointment_date >= ${startDate}` : sql``}
      ${endDate ? sql`AND appointment_date <= ${endDate}` : sql``}
    `;

    // Active visits previous period (for trend)
    const prevVisits = await sql`
      SELECT COUNT(*) as count 
      FROM appointments 
      WHERE doctor_id = ${doctorId}
      AND appointment_date < ${startDate || sql`DATE_TRUNC('month', CURRENT_DATE)`}
      AND appointment_date >= ${startDate ? sql`${startDate}::date - INTERVAL '1 month'` : sql`DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '1 month'`}
    `;

    const visitCount = parseInt(currentVisits[0].count);
    const lastVisitCount = parseInt(prevVisits[0].count);
    const visitTrend = lastVisitCount > 0 ? ((visitCount - lastVisitCount) / lastVisitCount * 100).toFixed(1) : 0;

    res.json({
      success: true,
      data: {
        appointmentsByStatus,
        appointmentsByType,
        appointmentsByDay,
        cancellationStats,
        appointmentsTrend,
        visitTrend: parseFloat(visitTrend),
        peakHours: peakHours.sort((a, b) => a.hour - b.hour),
        recurringPatients: parseInt(recurringPatients[0].count),
        feedback: {
          averageRating: parseFloat(feedbackStats[0].avg_rating || 0),
          totalReviews: parseInt(feedbackStats[0].total_reviews || 0),
          recent: recentFeedback
        },
        efficiency: {
          avgConsultation: parseFloat(efficiencyStats[0].avg_consultation || 0),
          avgWaitTime: parseFloat(efficiencyStats[0].avg_wait_time || 0)
        }
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

    // Previous month total for trend
    const prevMonthPatients = await sql`
      SELECT COUNT(DISTINCT patient_id) as count
      FROM appointments
      WHERE doctor_id = ${doctorId}
      AND appointment_date < DATE_TRUNC('month', CURRENT_DATE)
    `;

    const currentTotal = parseInt(totalPatients[0].count);
    const prevTotal = parseInt(prevMonthPatients[0].count);
    const patientTrend = prevTotal > 0 ? ((currentTotal - prevTotal) / prevTotal * 100).toFixed(1) : 0;

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
        totalPatients: currentTotal,
        trend: parseFloat(patientTrend),
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

    // Previous period revenue for trend
    const prevRevenue = await sql`
      SELECT 
        COALESCE(SUM(amount), 0) as total
      FROM billing
      WHERE doctor_id = ${doctorId}
      AND status = 'paid'
      AND created_at < ${startDate || sql`DATE_TRUNC('month', CURRENT_DATE)`}
      AND created_at >= ${startDate ? sql`${startDate}::date - INTERVAL '1 month'` : sql`DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '1 month'`}
    `;

    const currentRev = parseFloat(totalRevenue[0].total);
    const lastRev = parseFloat(prevRevenue[0].total);
    const revenueTrend = lastRev > 0 ? ((currentRev - lastRev) / lastRev * 100).toFixed(1) : 0;

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
        totalRevenue: currentRev,
        trend: parseFloat(revenueTrend),
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
