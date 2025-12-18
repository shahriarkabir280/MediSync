
import React, { useState, lazy, Suspense } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNotificationCount } from '../hooks/useNotificationCount';
import { BookOpen, Settings, User, Bell, CreditCard, HelpCircle, LogOut, Globe, Calendar, Users, Mail, MessageCircle, BarChart3, FlaskConical, ChevronLeft, ChevronRight, Menu } from 'lucide-react';

// Lazy load tab components for better performance
const BlogsTab = lazy(() => import('./DoctorDashboardTabs/BlogsTab'));
const PublicWebsiteTab = lazy(() => import('./DoctorDashboardTabs/PublicWebsiteTab'));
const SettingsTab = lazy(() => import('./DoctorDashboardTabs/SettingsTab'));
const AppointmentTab = lazy(() => import('./DoctorDashboardTabs/AppointmentTab'));
const ProfileTab = lazy(() => import('./DoctorDashboardTabs/ProfileTab'));
const LabratoryTab = lazy(() => import('./DoctorDashboardTabs/LabratoryTab'));
const PatientTab = lazy(() => import('./DoctorDashboardTabs/PatientTab'));
const ChatTab = lazy(() => import('./DoctorDashboardTabs/ChatTab'));
const EmailTab = lazy(() => import('./DoctorDashboardTabs/EmailTab'));
const CalendarTab = lazy(() => import('./DoctorDashboardTabs/CalendarTab'));
const NotificationTab = lazy(() => import('./DoctorDashboardTabs/NotificationTab'));
const BillingTab = lazy(() => import('./DoctorDashboardTabs/BillingTab'));
const HelpTab = lazy(() => import('./DoctorDashboardTabs/HelpTab'));
const LogoutTab = lazy(() => import('./DoctorDashboardTabs/LogoutTab'));
const AnalyticsTab = lazy(() => import('./DoctorDashboardTabs/AnalyticsTab'));

// Loading component for lazy-loaded tabs
const TabLoader = () => (
  <div className="flex items-center justify-center h-64">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
  </div>
);


const DoctorDashboard = () => {
  const [activeTab, setActiveTab] = useState('appointments');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { user, logout } = useAuth();
  const { unreadCount, refreshCount } = useNotificationCount();

  const handleLogout = async () => {
    if (window.confirm('Are you sure you want to logout?')) {
      await logout();
    }
  };

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
    { id: 'help', label: 'Help & Support', icon: HelpCircle },
    { id: 'logout', label: 'Logout', icon: LogOut },
  ];

  const renderContent = () => {
    const content = (() => {
      switch (activeTab) {
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
          return <ChatTab/>;
        case 'blogs':
          return <BlogsTab />;
        case 'email':
          return <EmailTab/>;
        case 'calendar':
          return <CalendarTab/>;
        case 'analytics':
          return <AnalyticsTab/>;
        case 'notifications':
          return <NotificationTab onCountChange={refreshCount} />;   
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
    })();

    return <Suspense fallback={<TabLoader />}>{content}</Suspense>;
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Left Sidebar - Tabs */}
      <div className={`${isCollapsed ? 'w-16' : 'w-64'} bg-card border-r border-border flex flex-col transition-all duration-300 ease-in-out`}>
        <div className={`${isCollapsed ? 'p-2' : 'p-6'} border-b border-border flex items-center justify-between`}>
          {!isCollapsed && (
            <h2 className="text-xl font-semibold text-foreground">Dashboard</h2>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={`p-2 rounded-lg hover:bg-accent text-muted-foreground hover:text-accent-foreground transition-colors ${
              isCollapsed ? 'w-full justify-center' : ''
            }`}
          >
            {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
          </button>
        </div>
        
        <nav className={`flex-1 ${isCollapsed ? 'p-2' : 'p-4'}`}>
          <ul className="space-y-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <li key={tab.id}>
                  <button
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center ${
                      isCollapsed ? 'justify-center p-2' : 'space-x-3 px-3 py-1.5'
                    } rounded-lg text-left transition-colors relative ${
                      activeTab === tab.id
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                    }`}
                    title={isCollapsed ? tab.label : undefined}
                  >
                    <div className="relative">
                      <Icon size={20} />
                      {tab.id === 'notifications' && unreadCount > 0 && (
                        <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium min-w-[1.25rem]">
                          {unreadCount > 99 ? '99+' : unreadCount}
                        </span>
                      )}
                    </div>
                    {!isCollapsed && (
                      <span className="font-medium">{tab.label}</span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>

      {/* Right Content Area */}
      <div className="flex-1 overflow-auto">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Welcome, Dr. {user?.name || 'Doctor'}
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                {user?.specialization || 'Medical Professional'} • {user?.email}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              {/* Debug: Log user data */}
              {console.log('DoctorDashboard user data:', user)}
              
              <div className="relative">
                {user?.profileImage ? (
                  <img
                    src={user.profileImage}
                    alt="Profile"
                    className="h-10 w-10 rounded-full object-cover"
                    onError={(e) => {
                      console.error('Profile image failed to load:', user.profileImage);
                      e.target.style.display = 'none';
                      e.target.nextElementSibling.style.display = 'flex';
                    }}
                  />
                ) : null}
                
                {/* Fallback avatar */}
                <div 
                  className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-medium"
                  style={{ display: user?.profileImage ? 'none' : 'flex' }}
                >
                  {user?.name?.charAt(0) || 'D'}
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <LogOut size={16} />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
        
        <div className="p-8">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default DoctorDashboard;
