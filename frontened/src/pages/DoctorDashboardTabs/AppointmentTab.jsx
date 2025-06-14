import React from "react";

const AppointmentTab = () => {

    return (
       <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">Appointments</h1>
              <p className="text-muted-foreground">Manage patient appointments and scheduling.</p>
            </div>
            
            <div className="grid gap-6">
              {/* Today's Appointments */}
              <div className="bg-card border border-border rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Today's Appointments</h3>
                  <button className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors">
                    New Appointment
                  </button>
                </div>
                <div className="space-y-3">
                  {[
                    { time: '09:00 AM', patient: 'John Smith', type: 'Consultation', status: 'Confirmed' },
                    { time: '10:30 AM', patient: 'Mary Johnson', type: 'Follow-up', status: 'Pending' },
                    { time: '02:00 PM', patient: 'David Brown', type: 'Check-up', status: 'Confirmed' },
                  ].map((appointment, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border border-border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="text-sm font-medium text-primary">{appointment.time}</div>
                        <div>
                          <p className="font-medium">{appointment.patient}</p>
                          <p className="text-sm text-muted-foreground">{appointment.type}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          appointment.status === 'Confirmed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {appointment.status}
                        </span>
                        <button className="px-3 py-1 text-sm border border-border rounded hover:bg-accent">
                          Edit
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Appointment Statistics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-card border border-border rounded-lg p-4">
                  <h4 className="font-medium text-muted-foreground mb-2">Today</h4>
                  <p className="text-2xl font-bold">8</p>
                  <p className="text-sm text-green-600">+2 from yesterday</p>
                </div>
                <div className="bg-card border border-border rounded-lg p-4">
                  <h4 className="font-medium text-muted-foreground mb-2">This Week</h4>
                  <p className="text-2xl font-bold">45</p>
                  <p className="text-sm text-blue-600">+5 from last week</p>
                </div>
                <div className="bg-card border border-border rounded-lg p-4">
                  <h4 className="font-medium text-muted-foreground mb-2">This Month</h4>
                  <p className="text-2xl font-bold">187</p>
                  <p className="text-sm text-purple-600">+12 from last month</p>
                </div>
              </div>

              {/* Appointment Settings */}
              <div className="bg-card border border-border rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4">Appointment Settings</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Default Appointment Duration</label>
                    <select className="w-full p-2 border border-input rounded-md bg-background">
                      <option>15 minutes</option>
                      <option>30 minutes</option>
                      <option>45 minutes</option>
                      <option>1 hour</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Working Hours</label>
                    <select className="w-full p-2 border border-input rounded-md bg-background">
                      <option>9:00 AM - 5:00 PM</option>
                      <option>8:00 AM - 6:00 PM</option>
                      <option>10:00 AM - 4:00 PM</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>
    );
};
export default AppointmentTab;