
import React, { useState } from 'react';
import { BookOpen, Settings, User, Bell, Shield, CreditCard, HelpCircle, LogOut, Globe, Calendar, Users, Mail, MessageCircle, BarChart3, FlaskConical} from 'lucide-react';

// Import tab components
import BlogsTab from '../pages/DoctorDashboardTabs/BlogsTab';
import PublicWebsiteTab from './DoctorDashboardTabs/PublicWebsiteTab';
import SettingsTab from './DoctorDashboardTabs/SettingsTab';
import AppointmentTab from './DoctorDashboardTabs/AppointmentTab';
import ProfileTab from './DoctorDashboardTabs/ProfileTab';
import LabratoryTab from './DoctorDashboardTabs/LabratoryTab';
import PatientTab from './DoctorDashboardTabs/PatientTab';
import Chattab from './DoctorDashboardTabs/ChatTab';
import EmailTab from './DoctorDashboardTabs/EmailTab';
import CalendarTab from './DoctorDashboardTabs/CalendarTab';
import NotificationTab from './DoctorDashboardTabs/NotificationTab';
import SecurityTab from './DoctorDashboardTabs/SecurityTab';
import BillingTab from './DoctorDashboardTabs/BillingTab';
import HelpTab from './DoctorDashboardTabs/HelpTab';
import LogoutTab from './DoctorDashboardTabs/LogoutTab';
import AnalyticsTab from './DoctorDashboardTabs/AnalyticsTab';


const DoctorDashboard = () => {
  const [activeTab, setActiveTab] = useState('appointments');

  const tabs = [
    
    { id: 'appointments', label: 'Appointments', icon: Calendar },
    { id: 'patients', label: 'Patients', icon: Users },
    { id: 'laboratory', label: 'Laboratory', icon: FlaskConical },
    { id: 'chat', label: 'Chat', icon: MessageCircle },
    { id: 'email', label: 'Email', icon: Mail },
    { id: 'calendar', label: 'Calendar', icon: Calendar },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'blogs', label: 'Manage Blogs', icon: BookOpen },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'billing', label: 'Billing', icon: CreditCard },
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'website', label: 'Edit Public Website', icon: Globe },
    { id: 'settings', label: 'Settings', icon: Settings },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'help', label: 'Help & Support', icon: HelpCircle },
    { id: 'logout', label: 'Logout', icon: LogOut },
  ];

  const renderContent = () => {
    switch (activeTab) {
      // ... keep existing code (settings case) the same ...
      case 'settings':
        return <SettingsTab />;      
      case 'profile':
        return <ProfileTab/>;
      case 'website':
        return <PublicWebsiteTab/>;
      case 'appointments':
        return <AppointmentTab/>;
      case 'patients':
        return <PatientTab/>; 
      case 'laboratory':
        return <LabratoryTab/>; 
      case 'chat':
        return <Chattab/>;
      case 'blogs':
        return <BlogsTab />;
      case 'email':
        return <EmailTab/>;
      case 'calendar':
        return <CalendarTab/>;
      case 'analytics':
        return <AnalyticsTab/>;
      case 'notifications':
        return <NotificationTab/>;
      case 'security':
        return <SecurityTab/>;     
      case 'billing':
        return <BillingTab/>;    
      case 'help':
        return <HelpTab/>;
      case 'logout':
        return <LogoutTab/>;    
      default:
        return (
          <div className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">Select a tab to view content</p>
          </div>
        );
    }
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Left Sidebar - Tabs */}
      <div className="w-64 bg-card border-r border-border flex flex-col">
        <div className="p-6 border-b border-border">
          <h2 className="text-xl font-semibold text-foreground">Dashboard</h2>
        </div>
        
        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <li key={tab.id}>
                  <button
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                      activeTab === tab.id
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                    }`}
                  >
                    <Icon size={20} />
                    <span className="font-medium">{tab.label}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>

      {/* Right Content Area */}
      <div className="flex-1 overflow-auto">
        <div className="p-8">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default DoctorDashboard;
