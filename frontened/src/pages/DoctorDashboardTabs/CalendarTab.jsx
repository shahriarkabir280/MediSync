import React from "react";

const CalendarTab = () => {
    return(
        <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">Calendar</h1>
              <p className="text-muted-foreground">View and manage your schedule like Google Calendar.</p>
            </div>
            
            <div className="grid gap-6">
              {/* Calendar Header */}
              <div className="bg-card border border-border rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <h3 className="text-xl font-semibold">December 2024</h3>
                    <div className="flex items-center space-x-2">
                      <button className="px-3 py-1 border border-border rounded hover:bg-accent">‹</button>
                      <button className="px-3 py-1 border border-border rounded hover:bg-accent">Today</button>
                      <button className="px-3 py-1 border border-border rounded hover:bg-accent">›</button>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <select className="p-2 border border-input rounded-md bg-background">
                      <option>Month</option>
                      <option>Week</option>
                      <option>Day</option>
                    </select>
                    <button className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors">
                      New Event
                    </button>
                  </div>
                </div>
              </div>

              {/* Calendar Grid */}
              <div className="bg-card border border-border rounded-lg p-4">
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                    <div key={day} className="p-2 text-center font-medium text-muted-foreground">
                      {day}
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {Array.from({ length: 35 }, (_, i) => {
                    const date = i - 6 + 1;
                    const isCurrentMonth = date > 0 && date <= 31;
                    const isToday = date === 11;
                    const hasEvent = [5, 11, 15, 20, 25].includes(date);
                    
                    return (
                      <div key={i} className={`p-2 h-24 border border-border ${isCurrentMonth ? 'bg-background' : 'bg-muted'} ${isToday ? 'bg-blue-50 border-blue-200' : ''}`}>
                        {isCurrentMonth && (
                          <>
                            <div className={`text-sm ${isToday ? 'font-bold text-blue-600' : 'text-foreground'}`}>
                              {date}
                            </div>
                            {hasEvent && (
                              <div className="mt-1">
                                <div className="bg-blue-500 text-white text-xs px-1 py-0.5 rounded truncate">
                                  Appointment
                                </div>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Upcoming Events */}
              <div className="bg-card border border-border rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4">Upcoming Events</h3>
                <div className="space-y-3">
                  {[
                    { title: 'Patient Consultation - John Smith', time: 'Today, 2:00 PM', type: 'appointment' },
                    { title: 'Medical Conference', time: 'Tomorrow, 9:00 AM', type: 'event' },
                    { title: 'Staff Meeting', time: 'Dec 15, 10:00 AM', type: 'meeting' },
                  ].map((event, index) => (
                    <div key={index} className="flex items-center space-x-3 p-3 border border-border rounded-lg">
                      <div className={`w-3 h-3 rounded-full ${
                        event.type === 'appointment' ? 'bg-blue-500' : 
                        event.type === 'event' ? 'bg-green-500' : 'bg-purple-500'
                      }`}></div>
                      <div className="flex-1">
                        <p className="font-medium">{event.title}</p>
                        <p className="text-sm text-muted-foreground">{event.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
    );
};
export default CalendarTab;