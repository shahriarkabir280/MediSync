import React from "react";

const NotificationTab = () => {
    return(
        <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">Notifications</h1>
              <p className="text-muted-foreground">Configure how you receive notifications.</p>
            </div>
            
            <div className="bg-card border border-border rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Notification Preferences</h3>
              <div className="space-y-4">
                {['Email notifications', 'Push notifications', 'SMS alerts', 'Browser notifications'].map((item) => (
                  <div key={item} className="flex items-center justify-between">
                    <span className="font-medium">{item}</span>
                    <div className="relative inline-block w-10 mr-2 align-middle select-none">
                      <input type="checkbox" className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer"/>
                      <label className="toggle-label block overflow-hidden h-6 rounded-full bg-gray-300 cursor-pointer"></label>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
    );
};
export default NotificationTab;