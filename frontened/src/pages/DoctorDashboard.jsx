import React, { useState, lazy, useEffect, Suspense } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useNotificationCount } from '../hooks/useNotificationCount';
import {
  BookOpen, Settings, User, Bell, CreditCard, HelpCircle, LogOut,
  Globe, Calendar, Users, Mail, MessageCircle, BarChart3, FlaskConical,
  ChevronLeft, ChevronRight, Menu, Search, Clock, ShieldCheck,
  Sun, Moon
} from 'lucide-react';


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
  <div className="flex flex-col items-center justify-center h-full space-y-4">
    <div className="relative w-12 h-12">
      <div className="absolute top-0 left-0 w-full h-full border-4 border-indigo-100 rounded-full"></div>
      <div className="absolute top-0 left-0 w-full h-full border-4 border-indigo-600 rounded-full border-t-transparent animate-spin"></div>
    </div>
    <p className="text-xs font-black text-indigo-600/40 uppercase tracking-widest">Hydrating Dashboard...</p>
  </div>
);

const DoctorDashboard = () => {
  const [activeTab, setActiveTab] = useState('appointments');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { theme, toggleTheme } = useTheme();
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
        case 'settings': return <SettingsTab />;
        case 'profile': return <ProfileTab />;
        case 'website': return <PublicWebsiteTab />;
        case 'appointments': return <AppointmentTab />;
        case 'patients': return <PatientTab />;
        case 'laboratory': return <LabratoryTab />;
        case 'chat': return <ChatTab />;
        case 'blogs': return <BlogsTab />;
        case 'email': return <EmailTab />;
        case 'calendar': return <CalendarTab />;
        case 'analytics': return <AnalyticsTab />;
        case 'notifications': return <NotificationTab onCountChange={refreshCount} />;
        case 'billing': return <BillingTab />;
        case 'help': return <HelpTab />;
        case 'logout': return <LogoutTab />;
        default:
          return (
            <div className="flex flex-col items-center justify-center h-64 space-y-2 opacity-50">
              <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center">
                <BarChart3 className="text-gray-400 w-6 h-6" />
              </div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Select a module to begin</p>
            </div>
          );
      }
    })();

    return <Suspense fallback={<TabLoader />}>{content}</Suspense>;
  };

  return (
    <div className="flex h-screen bg-background text-foreground selection:bg-indigo-100 selection:text-indigo-900 transition-colors duration-300">
      {/* Left Sidebar */}
      <aside
        className={`${isCollapsed ? 'w-20' : 'w-72'} bg-[#0F172A] flex flex-col transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] relative z-50`}
      >
        {/* Sidebar Header */}
        <div className={`h-24 flex items-center justify-between ${isCollapsed ? 'px-0 justify-center' : 'px-8'} border-b border-gray-800/50`}>
          {!isCollapsed && (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20 ring-4 ring-indigo-500/10">
                <ShieldCheck className="text-white w-6 h-6" />
              </div>
              <div className="flex flex-col">
                <h2 className="text-lg font-black text-white tracking-tight leading-none">CareConnect</h2>
                <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mt-1">Practitioner</span>
              </div>
            </div>
          )}

          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={`p-2 rounded-lg hover:bg-white/5 text-gray-500 hover:text-white transition-all ${isCollapsed ? 'w-10 h-10 flex items-center justify-center' : ''}`}
          >
            {isCollapsed ? <ChevronRight size={22} className="text-indigo-400" /> : <ChevronLeft size={20} />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-8 overflow-y-auto no-scrollbar space-y-8">
          <div className="space-y-1">
            {!isCollapsed && <p className="px-4 text-[9px] font-black text-gray-500 uppercase tracking-[0.2em] mb-4">Core Workspace</p>}
            <ul className="space-y-1.5">
              {tabs.slice(0, 7).map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <li key={tab.id}>
                    <button
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full group relative flex items-center ${isCollapsed ? 'justify-center py-3' : 'px-4 py-2.5'} rounded-xl transition-all duration-300 ${isActive
                        ? 'bg-indigo-500 text-white shadow-xl shadow-indigo-500/30'
                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                        }`}
                      title={isCollapsed ? tab.label : undefined}
                    >
                      <Icon size={isActive ? 22 : 19} className={`transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} />
                      {!isCollapsed && (
                        <span className={`ml-3 text-sm font-semibold tracking-wide transition-colors ${isActive ? 'text-white' : 'group-hover:text-white'}`}>
                          {tab.label}
                        </span>
                      )}
                      {isActive && !isCollapsed && (
                        <div className="absolute right-2 w-1.5 h-1.5 bg-white rounded-full shadow-[0_0_8px_white]" />
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="space-y-1">
            {!isCollapsed && <p className="px-4 text-[9px] font-black text-gray-500 uppercase tracking-[0.2em] mb-4">System & Config</p>}
            <ul className="space-y-1.5">
              {tabs.slice(7).map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                const isLogout = tab.id === 'logout';
                return (
                  <li key={tab.id}>
                    <button
                      onClick={isLogout ? handleLogout : () => setActiveTab(tab.id)}
                      className={`w-full group relative flex items-center ${isCollapsed ? 'justify-center py-3' : 'px-4 py-2.5'} rounded-xl transition-all duration-300 ${isActive
                        ? 'bg-indigo-500 text-white shadow-xl shadow-indigo-500/20'
                        : isLogout
                          ? 'text-rose-400 hover:text-rose-300 hover:bg-rose-500/10'
                          : 'text-gray-400 hover:text-white hover:bg-white/5'
                        }`}
                      title={isCollapsed ? tab.label : undefined}
                    >
                      <div className="relative">
                        <Icon size={isActive ? 22 : 19} className={`transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} />
                        {tab.id === 'notifications' && unreadCount > 0 && (
                          <span className="absolute -top-3 -right-3 bg-rose-500 text-white text-[9px] font-black rounded-full h-5 w-5 flex items-center justify-center ring-4 ring-[#0F172A] group-hover:ring-gray-800 transition-all">
                            {unreadCount > 99 ? '99+' : unreadCount}
                          </span>
                        )}
                      </div>
                      {!isCollapsed && (
                        <span className={`ml-3 text-sm font-semibold tracking-wide ${isActive ? 'text-white' : ''}`}>
                          {tab.label}
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </nav>

        {/* Sidebar Footer */}
        <div className="p-6 border-t border-gray-800/50 bg-[#0F172A]/50 backdrop-blur-sm">
          {!isCollapsed && (
            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest text-center">
              CareConnect © 2024
            </p>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden dark:bg-gray-900 transition-colors duration-300">
        {/* Top Navbar */}
        <header className="h-24 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 flex items-center px-8 justify-between relative z-40 shadow-[0_1px_3px_rgba(0,0,0,0.02)] transition-colors duration-300">
          <div className="flex items-center gap-6">
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <h1 className="text-xl font-black text-gray-900 dark:text-gray-100 tracking-tight">
                  Welcome, Dr. {user?.name || 'Doctor'}
                </h1>
              </div>
              <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mt-1 ml-4">
                {user?.specialization || 'Clinical Lead'} • {user?.email}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-8">
            <div className="hidden lg:flex items-center gap-6 pr-8 border-r border-gray-100 dark:border-gray-800">
              <button
                onClick={toggleTheme}
                className="p-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-400 hover:text-indigo-500 dark:hover:text-indigo-400 transition-all border border-gray-100 dark:border-gray-700 active:scale-95"
                title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
              >
                {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
              </button>

              <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <Clock className="w-4 h-4 text-indigo-500" />
                <span className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-tight">Active Shift</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <span className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-tight">System Secured</span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex flex-col items-end mr-2">
                <span className="text-xs font-black text-gray-900 dark:text-gray-100 leading-none">{user?.name}</span>
                <span className="text-[9px] font-black text-indigo-500 uppercase tracking-widest mt-1">Admin Access</span>
              </div>
              <div className="relative group p-1 bg-gradient-to-tr from-indigo-500 to-indigo-400 dark:from-indigo-600 dark:to-indigo-500 rounded-2xl shadow-lg ring-4 ring-indigo-50 dark:ring-indigo-900/20">
                <div className="h-11 w-11 rounded-xl overflow-hidden bg-white dark:bg-gray-800 border-2 border-white dark:border-gray-800">
                  {user?.profileImage ? (
                    <img
                      src={user.profileImage}
                      alt="Profile"
                      className="h-full w-full object-cover transition-transform group-hover:scale-110"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextElementSibling.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <div
                    className="h-full w-full flex items-center justify-center text-indigo-600 dark:text-indigo-400 text-lg font-black"
                    style={{ display: user?.profileImage ? 'none' : 'flex' }}
                  >
                    {user?.name?.charAt(0) || 'D'}
                  </div>
                </div>
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-4 border-white dark:border-gray-800 rounded-full" />
              </div>
            </div>
          </div>
        </header>

        {/* Dynamic Canvas */}
        <div className="flex-1 overflow-y-auto bg-gradient-to-b from-white to-[#F8FAFC] dark:from-gray-900 dark:to-gray-950 custom-scrollbar transition-colors duration-300">
          <div className="p-8 pb-20">
            {renderContent()}
          </div>
        </div>
      </main>

      {/* Design Utility Styles */}
      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { 
          background: #E2E8F0; 
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #CBD5E1; }
      `}</style>
    </div>
  );
};

export default DoctorDashboard;
