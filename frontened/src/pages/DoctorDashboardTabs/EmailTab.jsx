import React from "react";
const EmailTab = () => {
    return(
        <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">Email</h1>
              <p className="text-muted-foreground">Manage your email communications.</p>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Email Sidebar */}
              <div className="bg-card border border-border rounded-lg p-4">
                <button className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors mb-4">
                  Compose
                </button>
                <nav className="space-y-2">
                  {[
                    { name: 'Inbox', count: 12 },
                    { name: 'Sent', count: 0 },
                    { name: 'Drafts', count: 3 },
                    { name: 'Spam', count: 0 },
                    { name: 'Trash', count: 0 },
                  ].map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-2 rounded hover:bg-accent cursor-pointer">
                      <span className="font-medium">{item.name}</span>
                      {item.count > 0 && (
                        <span className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded-full">
                          {item.count}
                        </span>
                      )}
                    </div>
                  ))}
                </nav>
              </div>

              {/* Email List */}
              <div className="lg:col-span-3 bg-card border border-border rounded-lg">
                <div className="p-4 border-b border-border">
                  <h3 className="text-lg font-semibold">Inbox</h3>
                </div>
                <div className="divide-y divide-border">
                  {[
                    { from: 'john.smith@email.com', subject: 'Thank you for the consultation', time: '2:30 PM', unread: true },
                    { from: 'mary.johnson@email.com', subject: 'Prescription refill request', time: '11:45 AM', unread: true },
                    { from: 'admin@hospital.com', subject: 'Monthly schedule update', time: 'Yesterday', unread: false },
                    { from: 'david.brown@email.com', subject: 'Appointment rescheduling', time: 'Dec 10', unread: false },
                  ].map((email, index) => (
                    <div key={index} className={`p-4 hover:bg-accent cursor-pointer ${email.unread ? 'bg-blue-50' : ''}`}>
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <p className={`font-medium ${email.unread ? 'text-foreground' : 'text-muted-foreground'}`}>
                              {email.from}
                            </p>
                            {email.unread && <div className="w-2 h-2 bg-blue-500 rounded-full"></div>}
                          </div>
                          <p className={`${email.unread ? 'font-medium' : 'text-muted-foreground'}`}>
                            {email.subject}
                          </p>
                        </div>
                        <p className="text-sm text-muted-foreground">{email.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
    );
};
export default EmailTab;