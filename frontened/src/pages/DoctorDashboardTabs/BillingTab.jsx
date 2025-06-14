import React from "react";

const BillingTab = () => {
    return(
        <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">Billing</h1>
              <p className="text-muted-foreground">Manage your subscription and payment methods.</p>
            </div>
            
            <div className="bg-card border border-border rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Current Plan</h3>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Pro Plan</p>
                  <p className="text-sm text-muted-foreground">$29/month • Next billing: Dec 15, 2024</p>
                </div>
                <button className="px-4 py-2 border border-border rounded-md hover:bg-accent transition-colors">
                  Upgrade
                </button>
              </div>
            </div>
        </div>
    );
};
export default BillingTab;