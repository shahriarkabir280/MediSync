import React from "react";

const SecurityTab = () => {
    return(
       <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">Security</h1>
              <p className="text-muted-foreground">Manage your account security settings.</p>
            </div>
            
            <div className="bg-card border border-border rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Password & Authentication</h3>
              <div className="space-y-4">
                <button className="w-full md:w-auto px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors">
                  Change Password
                </button>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Two-Factor Authentication</p>
                    <p className="text-sm text-muted-foreground">Add an extra layer of security</p>
                  </div>
                  <button className="px-4 py-2 border border-border rounded-md hover:bg-accent transition-colors">
                    Enable
                  </button>
                </div>
              </div>
            </div>
          </div> 
    );
};
export default SecurityTab;