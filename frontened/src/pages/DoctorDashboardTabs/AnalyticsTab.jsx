import React from "react";
const AnalyticsTab = () => {
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
                  <p className="text-2xl font-bold">1,247</p>
                  <p className="text-sm text-green-600">+12% from last month</p>
                </div>
                <div className="bg-card border border-border rounded-lg p-4">
                  <h4 className="font-medium text-muted-foreground mb-2">Appointments</h4>
                  <p className="text-2xl font-bold">187</p>
                  <p className="text-sm text-blue-600">+8% from last month</p>
                </div>
                <div className="bg-card border border-border rounded-lg p-4">
                  <h4 className="font-medium text-muted-foreground mb-2">Revenue</h4>
                  <p className="text-2xl font-bold">$24,650</p>
                  <p className="text-sm text-purple-600">+15% from last month</p>
                </div>
                <div className="bg-card border border-border rounded-lg p-4">
                  <h4 className="font-medium text-muted-foreground mb-2">Satisfaction</h4>
                  <p className="text-2xl font-bold">4.8/5</p>
                  <p className="text-sm text-yellow-600">+0.2 from last month</p>
                </div>
              </div>

              {/* Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-card border border-border rounded-lg p-6">
                  <h3 className="text-lg font-semibold mb-4">Patient Growth</h3>
                  <div className="h-64 flex items-center justify-center text-muted-foreground">
                    [Chart Placeholder - Patient Growth Over Time]
                  </div>
                </div>
                <div className="bg-card border border-border rounded-lg p-6">
                  <h3 className="text-lg font-semibold mb-4">Appointment Types</h3>
                  <div className="h-64 flex items-center justify-center text-muted-foreground">
                    [Chart Placeholder - Appointment Distribution]
                  </div>
                </div>
              </div>

              {/* Popular Services */}
              <div className="bg-card border border-border rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4">Most Popular Services</h3>
                <div className="space-y-3">
                  {[
                    { service: 'General Consultation', count: 145, percentage: 78 },
                    { service: 'Follow-up Visits', count: 89, percentage: 48 },
                    { service: 'Health Check-ups', count: 67, percentage: 36 },
                    { service: 'Vaccination', count: 34, percentage: 18 },
                  ].map((item, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <p className="font-medium">{item.service}</p>
                          <span className="text-sm text-muted-foreground">{item.count} visits</span>
                        </div>
                        <div className="w-full bg-secondary rounded-full h-2">
                          <div className="bg-primary h-2 rounded-full" style={{ width: `${item.percentage}%` }}></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Performance Summary */}
              <div className="bg-card border border-border rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4">Monthly Performance Summary</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <p className="text-2xl font-bold text-green-600">96%</p>
                    <p className="text-sm text-green-700">On-time Appointments</p>
                  </div>
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <p className="text-2xl font-bold text-blue-600">4.2 min</p>
                    <p className="text-sm text-blue-700">Avg Wait Time</p>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <p className="text-2xl font-bold text-purple-600">23 min</p>
                    <p className="text-sm text-purple-700">Avg Consultation</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

    );

};

export default AnalyticsTab;