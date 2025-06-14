import React from "react";
import { User } from "lucide-react";

const ProfileTab = () => {
    return(
         <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">Profile</h1>
              <p className="text-muted-foreground">Manage your personal information and preferences.</p>
            </div>
            
            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-center space-x-4 mb-6">
                <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center">
                  <User className="w-10 h-10 text-primary-foreground" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold">John Doe</h3>
                  <p className="text-muted-foreground">john.doe@example.com</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">First Name</label>
                  <input type="text" defaultValue="John" className="w-full p-2 border border-input rounded-md bg-background" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Last Name</label>
                  <input type="text" defaultValue="Doe" className="w-full p-2 border border-input rounded-md bg-background" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Email</label>
                  <input type="email" defaultValue="john.doe@example.com" className="w-full p-2 border border-input rounded-md bg-background" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Phone</label>
                  <input type="tel" defaultValue="+1 (555) 123-4567" className="w-full p-2 border border-input rounded-md bg-background" />
                </div>
              </div>
            </div>
          </div> 
    );
};
export default ProfileTab;