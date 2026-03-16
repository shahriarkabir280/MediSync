import { useState, useEffect, lazy, Suspense } from "react";
import { useNavigate } from "react-router-dom";
import { 
  BuildingOfficeIcon, 
  CalendarDaysIcon, 
  ChatBubbleLeftRightIcon, 
  ClipboardDocumentListIcon, 
  CreditCardIcon, 
  HomeIcon, 
  UserCircleIcon,
  Bars3Icon,
  XMarkIcon,
  MagnifyingGlassIcon,
  HeartIcon
} from "@heroicons/react/24/outline";
import { patientApi } from "../../lib/api";

// Lazy load tabs
const OverviewTab = lazy(() => import("./Tabs/OverviewTab"));
const AppointmentsTab = lazy(() => import("./Tabs/AppointmentsTab"));
const ReportsTab = lazy(() => import("./Tabs/ReportsTab"));
const BillingTab = lazy(() => import("./Tabs/BillingTab"));
const ChatTab = lazy(() => import("./Tabs/ChatTab"));
const SearchDoctorsTab = lazy(() => import("./Tabs/SearchDoctorsTab"));
const ProfileTab = lazy(() => import("./Tabs/ProfileTab"));

const PatientDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [patient, setPatient] = useState({
    name: "Guest Patient",
    id: "0",
    displayId: "PAT-000",
    email: "",
    avatar: "https://ui-avatars.com/api/?name=Guest+Patient&background=0D8ABC&color=fff",
    bloodGroup: "Unknown",
  });

  const fetchPatientDetails = async () => {
    const sessionEmail = localStorage.getItem('patientSessionEmail');
    const patientId = localStorage.getItem('patientId');

    if (!sessionEmail || !patientId) return;

    try {
      const response = await patientApi.getById(patientId);
      if (response && response.success) {
        const data = response.data;
        setPatient({
          ...data,
          name: `${data.first_name} ${data.last_name}`,
          id: data.id,
          displayId: data.unique_id || 'PAT-000',
          avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(data.first_name)}+${encodeURIComponent(data.last_name)}&background=0D8ABC&color=fff`,
          bloodGroup: data.blood_group || "O+",
        });
        
        // Sync localStorage
        localStorage.setItem('patientDisplayId', data.unique_id);
        localStorage.setItem('patientName', `${data.first_name} ${data.last_name}`);
      }
    } catch (error) {
      console.error("Failed to fetch patient details:", error);
      // Fallback to localStorage if API fails
      const patientName = localStorage.getItem('patientName') || 'Guest Patient';
      const patientDisplayId = localStorage.getItem('patientDisplayId') || 'PAT-000';
      
      setPatient(prev => ({
        ...prev,
        name: patientName,
        id: patientId,
        displayId: patientDisplayId,
        email: sessionEmail,
      }));
    }
  };

  useEffect(() => {
    const sessionEmail = localStorage.getItem('patientSessionEmail');
    const patientId = localStorage.getItem('patientId');

    if (!sessionEmail || !patientId) {
      navigate('/patient-login');
      return;
    }

    fetchPatientDetails();
  }, [navigate]);

  const handleSignOut = () => {
    localStorage.removeItem('patientSessionEmail');
    navigate('/patient-login');
  };

  const tabs = [
    { id: "overview", name: "Overview", icon: HomeIcon },
    { id: "search", name: "Search Doctors", icon: MagnifyingGlassIcon },
    { id: "profile", name: "Profile", icon: UserCircleIcon },
    { id: "appointments", name: "Appointments", icon: CalendarDaysIcon },
    { id: "reports", name: "Medical Reports", icon: ClipboardDocumentListIcon },
    { id: "billing", name: "Billing History", icon: CreditCardIcon },
    { id: "chat", name: "Messages", icon: ChatBubbleLeftRightIcon },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case "overview":
        return <OverviewTab onTabChange={setActiveTab} patient={patient} />;
      case "search":
        return <SearchDoctorsTab patient={patient} />;
      case "profile":
        return <ProfileTab patient={patient} onUpdate={fetchPatientDetails} />;
      case "appointments":
        return <AppointmentsTab patient={patient} />;
      case "reports":
        return <ReportsTab patient={patient} />;
      case "billing":
        return <BillingTab patient={patient} />;
      case "chat":
        return <ChatTab patient={patient} />;
      default:
        return <OverviewTab onTabChange={setActiveTab} patient={patient} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row font-sans">
      
      {/* Mobile Header */}
      <div className="md:hidden bg-white shadow-sm flex items-center justify-between p-4 sticky top-0 z-20">
        <div className="flex items-center gap-2">
          <BuildingOfficeIcon className="w-8 h-8 text-indigo-600" />
          <span className="font-bold text-xl text-gray-800 tracking-tight">CareConnect</span>
        </div>
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="text-gray-500 hover:text-indigo-600 focus:outline-none"
        >
          {isMobileMenuOpen ? (
            <XMarkIcon className="w-7 h-7" />
          ) : (
            <Bars3Icon className="w-7 h-7" />
          )}
        </button>
      </div>

      {/* Sidebar Navigation */}
      <div className={`
        fixed inset-y-0 left-0 z-10 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out md:translate-x-0 md:static md:flex md:flex-col
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Logo Area (Desktop) */}
        <div className="hidden md:flex items-center gap-3 p-6 border-b border-gray-100">
          <div className="bg-indigo-50 p-2 rounded-xl">
             <BuildingOfficeIcon className="w-8 h-8 text-indigo-600" />
          </div>
          <span className="font-bold text-2xl text-gray-900 tracking-tight">CareConnect</span>
        </div>

        {/* Patient Info Summary */}
        <div className="p-6 flex items-center gap-4 border-b border-gray-100 bg-gray-50/50">
          <img src={patient.avatar} alt="Patient" className="w-12 h-12 rounded-full border-2 border-indigo-100 shadow-sm" />
          <div>
            <h3 className="font-semibold text-gray-900 leading-tight">{patient.name}</h3>
            <p className="text-xs text-indigo-600 font-medium">{patient.displayId || patient.id}</p>
          </div>
        </div>

        {/* Navigation Links */}
        <div className="flex-1 overflow-y-auto py-6 px-4">
          <nav className="space-y-1.5">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setIsMobileMenuOpen(false);
                }}
                className={`
                  w-full flex items-center gap-3 px-4 py-3 text-left rounded-xl transition-all duration-200 group
                  ${activeTab === tab.id 
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200' 
                    : 'text-gray-600 hover:bg-gray-50 hover:text-indigo-600'
                  }
                `}
              >
                <tab.icon className={`w-5 h-5 ${activeTab === tab.id ? 'text-white' : 'text-gray-400 group-hover:text-indigo-500'}`} />
                <span className="font-medium text-sm">{tab.name}</span>
              </button>
            ))}
          </nav>
        </div>
        
        {/* Logout / Settings Placeholder */}
        <div className="p-4 border-t border-gray-100">
           <button onClick={handleSignOut} className="flex items-center gap-3 px-4 py-2 text-sm font-medium text-gray-600 hover:text-red-600 transition-colors w-full rounded-lg hover:bg-red-50">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
              </svg>
              Sign Out
           </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden bg-gray-50/50">
        
        {/* Desktop Top Bar */}
        <header className="hidden md:flex bg-white/80 backdrop-blur-md shadow-sm h-16 items-center px-8 border-b border-gray-100 z-10 sticky top-0 justify-between">
            <h1 className="text-xl font-bold text-gray-800 tracking-tight">
               {tabs.find(t => t.id === activeTab)?.name}
            </h1>
            <div className="flex items-center gap-4">
              <button className="p-2 text-gray-400 hover:text-indigo-600 transition-colors relative rounded-full hover:bg-gray-100">
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
                </svg>
              </button>
            </div>
        </header>

        {/* Tab Content Rendering */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 p-4 md:p-8">
          <Suspense fallback={
            <div className="h-full flex items-center justify-center">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
            </div>
          }>
            <div className="max-w-7xl mx-auto animation-fade-in">
                {renderContent()}
            </div>
          </Suspense>
        </main>
      </div>

      {/* Mobile overlay */}
      {isMobileMenuOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-0" 
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </div>
  );
};

export default PatientDashboard;
