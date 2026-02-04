import { supabase } from '../config/db.js';

// Helper to get start of day
const getStartOfDay = (dateStr) => {
  const d = new Date(dateStr);
  d.setHours(0, 0, 0, 0);
  return d;
};

// Helper to get end of day
const getEndOfDay = (dateStr) => {
  const d = new Date(dateStr);
  d.setHours(23, 59, 59, 999);
  return d;
};

// Get appointment analytics
export const getAppointmentAnalytics = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const { startDate, endDate } = req.query;

    if (!doctorId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // 1. Fetch appointments for main stats (status, type, day, peak hours, efficiency)
    let query = supabase
      .from('appointments')
      .select(`
        id, status, appointment_type, appointment_date, appointment_time, 
        patient_id, actual_start_time, actual_end_time
      `)
      .eq('doctor_id', doctorId);

    if (startDate) query = query.gte('appointment_date', startDate);
    if (endDate) query = query.lte('appointment_date', endDate);

    const { data: appointments, error: appError } = await query;
    if (appError) throw appError;

    // Process appointments in JS
    const statusCounts = {};
    const typeCounts = {};
    const dayCounts = { Sunday: 0, Monday: 0, Tuesday: 0, Wednesday: 0, Thursday: 0, Friday: 0, Saturday: 0 };
    const dayOfWeekMap = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const hourCounts = {};

    // Efficiency
    let totalConsultationTime = 0;
    let totalWaitTime = 0;
    let efficiencyCount = 0;

    appointments.forEach(app => {
      // Status
      statusCounts[app.status] = (statusCounts[app.status] || 0) + 1;

      // Type
      if (app.appointment_type) {
        typeCounts[app.appointment_type] = (typeCounts[app.appointment_type] || 0) + 1;
      }

      // Day of Week
      if (app.appointment_date) {
        const date = new Date(app.appointment_date);
        const dayName = dayOfWeekMap[date.getDay()];
        dayCounts[dayName] = (dayCounts[dayName] || 0) + 1; // Note: Date parsing might depend on timezone, assuming standard YYYY-MM-DD
      }

      // Peak Hours
      if (app.appointment_time) {
        const hour = parseInt(app.appointment_time.split(':')[0]);
        hourCounts[hour] = (hourCounts[hour] || 0) + 1;
      }

      // Efficiency
      if (app.status === 'completed' && app.actual_start_time && app.actual_end_time) {
        const start = new Date(`${app.appointment_date}T${app.actual_start_time}`);
        const end = new Date(`${app.appointment_date}T${app.actual_end_time}`);
        const scheduled = new Date(`${app.appointment_date}T${app.appointment_time}`);

        // Check for valid dates
        if (!isNaN(start) && !isNaN(end)) {
          totalConsultationTime += (end - start) / (1000 * 60); // minutes
          if (!isNaN(scheduled)) {
            totalWaitTime += (start - scheduled) / (1000 * 60);
          }
          efficiencyCount++;
        }
      }
    });

    // Formatting results
    const appointmentsByStatus = Object.entries(statusCounts).map(([status, count]) => ({ status, count }));
    const appointmentsByType = Object.entries(typeCounts).map(([type, count]) => ({ appointment_type: type, count }));

    // Day sort order
    const appointmentsByDay = Object.entries(dayCounts)
      .sort((a, b) => dayOfWeekMap.indexOf(a[0]) - dayOfWeekMap.indexOf(b[0]))
      .map(([day, count]) => ({ day: day.trim(), count })); // Trim to match PostgreSQL 'Day' output often has padding

    const peakHours = Object.entries(hourCounts)
      .map(([hour, count]) => ({ hour: parseInt(hour), count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const cancellationStats = appointmentsByStatus.filter(s => ['completed', 'cancelled'].includes(s.status));

    const efficiency = {
      avgConsultation: efficiencyCount ? parseFloat((totalConsultationTime / efficiencyCount).toFixed(1)) : 0,
      avgWaitTime: efficiencyCount ? parseFloat((totalWaitTime / efficiencyCount).toFixed(1)) : 0
    };

    // 2. Trend (Last 7 days) - Separate query as it has fixed range
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const trendDateStr = sevenDaysAgo.toISOString().split('T')[0];

    const { data: trendApps, error: trendError } = await supabase
      .from('appointments')
      .select('appointment_date')
      .eq('doctor_id', doctorId)
      .gte('appointment_date', trendDateStr);

    if (trendError) throw trendError;

    const trendMap = {};
    trendApps.forEach(app => {
      trendMap[app.appointment_date] = (trendMap[app.appointment_date] || 0) + 1;
    });

    const appointmentsTrend = Object.entries(trendMap)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => new Date(a.date) - new Date(b.date));


    // 3. Recurring patients (Loyalty)
    // Fetch all appointments for doctor (unfiltered by date for loyalty usually, or filtered? SQL used date filters? 
    // The SQL had doctor_id filter but NO date filter for `recurringPatients` subquery.
    const { data: allPatientApps, error: recurringError } = await supabase
      .from('appointments')
      .select('patient_id')
      .eq('doctor_id', doctorId);

    if (recurringError) throw recurringError;

    const patientFrequency = {};
    allPatientApps.forEach(app => {
      patientFrequency[app.patient_id] = (patientFrequency[app.patient_id] || 0) + 1;
    });

    const recurringCount = Object.values(patientFrequency).filter(count => count > 1).length;


    // 4. Patient Feedback
    const { data: feedbacks, error: feedbackError } = await supabase
      .from('patient_feedback')
      .select(`
            rating, comment, created_at,
            patient:patients (first_name, last_name)
        `)
      .eq('doctor_id', doctorId);

    if (feedbackError) throw feedbackError;

    const totalReviews = feedbacks.length;
    const avgRating = totalReviews ? feedbacks.reduce((sum, f) => sum + f.rating, 0) / totalReviews : 0;

    const recentFeedback = feedbacks
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 3)
      .map(f => ({
        comment: f.comment,
        rating: f.rating,
        patient_name: f.patient ? `${f.patient.first_name} ${f.patient.last_name}` : 'Anonymous'
      }));


    // 5. Visits Trend (Current period VS Previous period)
    const currentCount = appointments.length;

    // Previous period logic
    let prevStartDate, prevEndDate;
    if (startDate) {
      // Assume same duration backwards
      const start = new Date(startDate);
      const end = endDate ? new Date(endDate) : new Date();
      const duration = end - start;
      const prevStart = new Date(start.getTime() - duration);
      const prevEnd = new Date(start.getTime()); // Up to start date
      prevStartDate = prevStart.toISOString().split('T')[0];
      prevEndDate = prevEnd.toISOString().split('T')[0];
    } else {
      // Default to last month comparison if no date provided (matching SQL default)
      // SQL: appointment_date < DATE_TRUNC('month', CURRENT_DATE) AND >= ... - 1 month
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const startOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      prevStartDate = startOfPrevMonth.toISOString().split('T')[0];
      prevEndDate = startOfMonth.toISOString().split('T')[0];
    }

    // However, the SQL actually implemented logic:
    // currentVisits: filtered by input start/end OR all time? 
    // SQL: ${startDate ? ... : ...}
    // If no startDate provided, currentVisits gets ALL appointments. 
    // prevVisits gets last month. This comparison is a bit weird in original code if no dates provided (All vs Last Month).
    // Let's replicate original SQL logic roughly:
    // If startDate/endDate provided, we compare to previous period of same length.
    // If not, we compare "This Month" (implied context usually) or just return 0 trend for "All Time".
    // Wait, the SQL for `currentVisits` used inputs. If inputs empty, it fetched ALL.
    // SQL for `prevVisits` used specific logic: < startDate OR < StartOfMonth.

    // Simplification: Fetch previous period details.
    const { count: lastVisitCount, error: prevError } = await supabase
      .from('appointments')
      .select('*', { count: 'exact', head: true })
      .eq('doctor_id', doctorId)
      .gte('appointment_date', prevStartDate)
      .lt('appointment_date', prevEndDate || startDate); // strictly less than current start

    if (prevError) throw prevError;

    const visitTrend = lastVisitCount > 0 ? ((currentCount - lastVisitCount) / lastVisitCount * 100).toFixed(1) : 0;

    res.json({
      success: true,
      data: {
        appointmentsByStatus,
        appointmentsByType,
        appointmentsByDay,
        cancellationStats,
        appointmentsTrend,
        visitTrend: parseFloat(visitTrend),
        peakHours,
        recurringPatients: recurringCount,
        feedback: {
          averageRating: parseFloat(avgRating.toFixed(1)),
          totalReviews,
          recent: recentFeedback
        },
        efficiency
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

    if (!doctorId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Fetch all patients for this doctor via appointments
    // We need DOB and Gender for stats
    const { data: patientsData, error } = await supabase
      .from('appointments')
      .select(`
            patient_id,
            patient:patients (id, date_of_birth, gender)
        `)
      .eq('doctor_id', doctorId);

    if (error) throw error;

    // Use a Set to ensure distinct patients
    const uniquePatients = new Map();
    patientsData.forEach(app => {
      if (app.patient) {
        uniquePatients.set(app.patient.id, app.patient);
      }
    });

    const patients = Array.from(uniquePatients.values());
    const totalPatients = patients.length;

    // Previous month logic for trend
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];

    // Count distinct patients visited before start of this month
    const { data: prevPatientsData, error: prevError } = await supabase
      .from('appointments')
      .select('patient_id')
      .eq('doctor_id', doctorId)
      .lt('appointment_date', startOfMonth);

    if (prevError) throw prevError;

    const prevUniquePatients = new Set(prevPatientsData.map(p => p.patient_id));
    const prevTotal = prevUniquePatients.size;

    const patientTrend = prevTotal > 0 ? ((totalPatients - prevTotal) / prevTotal * 100).toFixed(1) : 0;

    // Age Groups
    const ageGroups = { 'Under 18': 0, '18-30': 0, '31-50': 0, '51-70': 0, 'Over 70': 0 };

    patients.forEach(p => {
      if (p.date_of_birth) {
        const ageComp = new Date(Date.now() - new Date(p.date_of_birth).getTime());
        const age = Math.abs(ageComp.getUTCFullYear() - 1970);

        if (age < 18) ageGroups['Under 18']++;
        else if (age <= 30) ageGroups['18-30']++;
        else if (age <= 50) ageGroups['31-50']++;
        else if (age <= 70) ageGroups['51-70']++;
        else ageGroups['Over 70']++;
      }
    });

    const patientsByAgeGroup = Object.entries(ageGroups).map(([group, count]) => ({ age_group: group, count }));

    // Gender
    const genderCounts = {};
    patients.forEach(p => {
      if (p.gender) {
        genderCounts[p.gender] = (genderCounts[p.gender] || 0) + 1;
      }
    });
    const patientsByGender = Object.entries(genderCounts).map(([gender, count]) => ({ gender, count }));

    res.json({
      success: true,
      data: {
        totalPatients,
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

    if (!doctorId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // 1. Fetch filtered revenue
    let query = supabase
      .from('billing')
      .select('amount, created_at, status')
      .eq('doctor_id', doctorId);

    // We fetch ALL relevant billing to calculate stats, 
    // but specific totals might need date filters
    // The original code calculated Total based on filters, but Trend based on month shift.

    // Let's fetch all relevant billing for the doctor and filter in memory to save requests, 
    // unless dataset is huge. Assuming manageable.
    // Actually, let's respect the filters for the "Total Revenue" part.

    const { data: allBilling, error } = await supabase
      .from('billing')
      .select('amount, created_at, status')
      .eq('doctor_id', doctorId);

    if (error) throw error;

    // Filter for "Total Revenue" (User selection)
    const filteredBilling = allBilling.filter(b => {
      if (b.status !== 'paid') return false;
      if (startDate && new Date(b.created_at) < new Date(startDate)) return false;
      if (endDate && new Date(b.created_at) > new Date(endDate)) return false;
      return true;
    });

    const totalRevenue = filteredBilling.reduce((sum, b) => sum + parseFloat(b.amount || 0), 0);

    // Trend (Previous Month vs This Month Context usually, or Previous Period)
    // Original SQL used manual range logic.
    let trendPrevStart, trendPrevEnd;
    if (startDate) {
      const start = new Date(startDate);
      const end = endDate ? new Date(endDate) : new Date();
      const duration = end - start;
      trendPrevStart = new Date(start.getTime() - duration);
      trendPrevEnd = new Date(start.getTime());
    } else {
      const now = new Date();
      trendPrevStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      trendPrevEnd = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    const prevBilling = allBilling.filter(b => {
      if (b.status !== 'paid') return false;
      const d = new Date(b.created_at);
      return d >= trendPrevStart && d < trendPrevEnd;
    });

    const prevRevenue = prevBilling.reduce((sum, b) => sum + parseFloat(b.amount || 0), 0);
    const revenueTrend = prevRevenue > 0 ? ((totalRevenue - prevRevenue) / prevRevenue * 100).toFixed(1) : 0;

    // Revenue This Month
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const revenueThisMonth = allBilling
      .filter(b => b.status === 'paid' && new Date(b.created_at) >= startOfMonth)
      .reduce((sum, b) => sum + parseFloat(b.amount || 0), 0);

    // Revenue by Month (Last 6 Months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthStats = {};
    allBilling.forEach(b => {
      if (b.status === 'paid' && new Date(b.created_at) >= sixMonthsAgo) {
        const date = new Date(b.created_at);
        const key = date.toLocaleString('default', { month: 'short', year: 'numeric' }); // "Jan 2024"
        const sortKey = date.toISOString().slice(0, 7); // "2024-01"

        if (!monthStats[key]) monthStats[key] = { amount: 0, sort: sortKey };
        monthStats[key].amount += parseFloat(b.amount || 0);
      }
    });

    const revenueByMonth = Object.entries(monthStats)
      .map(([month, data]) => ({ month, total: data.amount, sort: data.sort }))
      .sort((a, b) => a.sort.localeCompare(b.sort))
      .map(item => ({ month: item.month, total: item.total }));

    // Pending Payments
    const pendingItems = allBilling.filter(b => b.status === 'pending');
    const pendingTotal = pendingItems.reduce((sum, b) => sum + parseFloat(b.amount || 0), 0);
    const pendingCount = pendingItems.length;

    res.json({
      success: true,
      data: {
        totalRevenue,
        trend: parseFloat(revenueTrend),
        revenueThisMonth,
        revenueByMonth,
        pendingPayments: {
          total: pendingTotal,
          count: pendingCount
        }
      }
    });

  } catch (error) {
    console.error('Error fetching revenue analytics:', error);
    res.status(500).json({ error: 'Failed to fetch revenue analytics' });
  }
};
