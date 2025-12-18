import React, { useState, useEffect, useCallback, useMemo, memo } from "react";
import { analyticsApi, doctorApi } from "../../lib/api";
import { useDoctor } from "../../hooks/useDoctor";

const AnalyticsTab = memo(() => {
    const { doctorId } = useDoctor();
    const [appointmentAnalytics, setAppointmentAnalytics] = useState(null);
    const [patientAnalytics, setPatientAnalytics] = useState(null);
    const [revenueAnalytics, setRevenueAnalytics] = useState(null);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Memoize expensive calculations
    const totalRevenue = useMemo(() => {
        return revenueAnalytics?.revenueThisMonth || 0;
    }, [revenueAnalytics]);

    const totalPatients = useMemo(() => {
        return patientAnalytics?.totalPatients || 0;
    }, [patientAnalytics]);

    useEffect(() => {
        if (doctorId) {
            fetchAnalytics();
        }
    }, [doctorId]);

    const fetchAnalytics = useCallback(async () => {
        if (!doctorId) return;
        try {
            setLoading(true);
            const [appointmentData, patientData, revenueData, statsData] = await Promise.all([
                analyticsApi.getAppointmentAnalytics(doctorId),
                analyticsApi.getPatientAnalytics(doctorId),
                analyticsApi.getRevenueAnalytics(doctorId),
                doctorApi.getStats(doctorId)
            ]);
            
            setAppointmentAnalytics(appointmentData.data);
            setPatientAnalytics(patientData.data);
            setRevenueAnalytics(revenueData.data);
            setStats(statsData.data);
            setError(null);
        } catch (err) {
            setError(err.message);
            console.error('Error fetching analytics:', err);
        } finally {
            setLoading(false);
        }
    }, [doctorId]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <p className="text-muted-foreground">Loading analytics...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <p className="text-red-600 mb-2">Error loading analytics</p>
                    <p className="text-sm text-muted-foreground">{error}</p>
                    <button 
                        onClick={fetchAnalytics}
                        className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    return (
     <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">Analytics</h1>
              <p className="text-muted-foreground">View practice insights and performance metrics.</p>
            </div>
            
            <div className="grid gap-6">
              {/* Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-card border border-border rounded-lg p-4">
                  <h4 className="font-medium text-muted-foreground mb-2">Total Patients</h4>
                  <p className="text-2xl font-bold">{patientAnalytics?.totalPatients || 0}</p>
                  <p className="text-sm text-green-600">
                    +{patientAnalytics?.newPatientsThisMonth || 0} this month
                  </p>
                </div>
                <div className="bg-card border border-border rounded-lg p-4">
                  <h4 className="font-medium text-muted-foreground mb-2">Appointments</h4>
                  <p className="text-2xl font-bold">{stats?.monthAppointments || 0}</p>
                  <p className="text-sm text-blue-600">This month</p>
                </div>
                <div className="bg-card border border-border rounded-lg p-4">
                  <h4 className="font-medium text-muted-foreground mb-2">Revenue</h4>
                  <p className="text-2xl font-bold">
                    ${revenueAnalytics?.revenueThisMonth?.toFixed(2) || '0.00'}
                  </p>
                  <p className="text-sm text-purple-600">This month</p>
                </div>
                <div className="bg-card border border-border rounded-lg p-4">
                  <h4 className="font-medium text-muted-foreground mb-2">Pending</h4>
                  <p className="text-2xl font-bold">{stats?.pendingAppointments || 0}</p>
                  <p className="text-sm text-yellow-600">Pending appointments</p>
                </div>
              </div>

              {/* Appointment Statistics */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-card border border-border rounded-lg p-6">
                  <h3 className="text-lg font-semibold mb-4">Appointments by Status</h3>
                  <div className="space-y-3">
                    {appointmentAnalytics?.appointmentsByStatus?.length > 0 ? (
                      appointmentAnalytics.appointmentsByStatus.map((item, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <span className="capitalize">{item.status}</span>
                          <span className="font-semibold">{item.count}</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-muted-foreground text-center py-4">No data available</p>
                    )}
                  </div>
                </div>
                
                <div className="bg-card border border-border rounded-lg p-6">
                  <h3 className="text-lg font-semibold mb-4">Appointments by Type</h3>
                  <div className="space-y-3">
                    {appointmentAnalytics?.appointmentsByType?.length > 0 ? (
                      appointmentAnalytics.appointmentsByType.map((item, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <span className="capitalize">{item.appointment_type}</span>
                          <span className="font-semibold">{item.count}</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-muted-foreground text-center py-4">No data available</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Patient Demographics */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-card border border-border rounded-lg p-6">
                  <h3 className="text-lg font-semibold mb-4">Patients by Age Group</h3>
                  <div className="space-y-3">
                    {patientAnalytics?.patientsByAgeGroup?.length > 0 ? (
                      patientAnalytics.patientsByAgeGroup.map((item, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <span>{item.age_group}</span>
                          <span className="font-semibold">{item.count}</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-muted-foreground text-center py-4">No data available</p>
                    )}
                  </div>
                </div>
                
                <div className="bg-card border border-border rounded-lg p-6">
                  <h3 className="text-lg font-semibold mb-4">Patients by Gender</h3>
                  <div className="space-y-3">
                    {patientAnalytics?.patientsByGender?.length > 0 ? (
                      patientAnalytics.patientsByGender.map((item, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <span className="capitalize">{item.gender}</span>
                          <span className="font-semibold">{item.count}</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-muted-foreground text-center py-4">No data available</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Revenue Summary */}
              {revenueAnalytics && (
                <div className="bg-card border border-border rounded-lg p-6">
                  <h3 className="text-lg font-semibold mb-4">Revenue Summary</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <p className="text-2xl font-bold text-green-600">
                        ${revenueAnalytics.totalRevenue?.toFixed(2) || '0.00'}
                      </p>
                      <p className="text-sm text-green-700">Total Revenue</p>
                    </div>
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <p className="text-2xl font-bold text-blue-600">
                        ${revenueAnalytics.revenueThisMonth?.toFixed(2) || '0.00'}
                      </p>
                      <p className="text-sm text-blue-700">This Month</p>
                    </div>
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                      <p className="text-2xl font-bold text-purple-600">
                        ${revenueAnalytics.pendingPayments?.total?.toFixed(2) || '0.00'}
                      </p>
                      <p className="text-sm text-purple-700">
                        Pending ({revenueAnalytics.pendingPayments?.count || 0})
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Peak Hours */}
              {appointmentAnalytics?.peakHours?.length > 0 && (
                <div className="bg-card border border-border rounded-lg p-6">
                  <h3 className="text-lg font-semibold mb-4">Peak Appointment Hours</h3>
                  <div className="space-y-3">
                    {appointmentAnalytics.peakHours.map((item, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <span>{item.hour}:00</span>
                        <div className="flex items-center gap-3">
                          <div className="w-32 bg-secondary rounded-full h-2">
                            <div 
                              className="bg-primary h-2 rounded-full" 
                              style={{ width: `${(item.count / appointmentAnalytics.peakHours[0].count) * 100}%` }}
                            ></div>
                          </div>
                          <span className="font-semibold w-12 text-right">{item.count}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
    );
});

export default AnalyticsTab;