import React from "react";

const HelpTab = () => {
    return(
       <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">Help & Support</h1>
              <p className="text-muted-foreground">Get help and find answers to common questions.</p>
            </div>
            
            <div className="grid gap-4">
              <div className="bg-card border border-border rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-2">Documentation</h3>
                <p className="text-muted-foreground mb-4">Browse our comprehensive guides and tutorials.</p>
                <button className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors">
                  View Docs
                </button>
              </div>
              <div className="bg-card border border-border rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-2">Contact Support</h3>
                <p className="text-muted-foreground mb-4">Need help? Our support team is here for you.</p>
                <button className="px-4 py-2 border border-border rounded-md hover:bg-accent transition-colors">
                  Contact Us
                </button>
              </div>
            </div>
          </div> 
    );
};
export default HelpTab;