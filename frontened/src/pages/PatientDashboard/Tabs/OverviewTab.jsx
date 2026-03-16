const OverviewTab = ({ onTabChange }) => {
  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Welcome back, John!</h2>
        <p className="text-gray-600">Here is a quick overview of your medical journey.</p>
        <div className="mt-6 flex flex-wrap gap-4">
           <button 
             onClick={() => onTabChange("appointments")}
             className="px-4 py-2 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 font-medium transition-colors"
           >
             Book Appointment
           </button>
           <button 
             onClick={() => onTabChange("reports")}
             className="px-4 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 font-medium transition-colors"
           >
             View Latest Report
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Quick Stats Cards */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 items-center justify-between flex">
           <div>
               <p className="text-sm font-medium text-gray-500 mb-1">Upcoming Appointments</p>
               <p className="text-3xl font-bold text-gray-900">2</p>
           </div>
           <div className="w-12 h-12 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
              </svg>
           </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 items-center justify-between flex">
           <div>
               <p className="text-sm font-medium text-gray-500 mb-1">Unread Reports</p>
               <p className="text-3xl font-bold text-gray-900">1</p>
           </div>
           <div className="w-12 h-12 bg-green-50 text-green-500 rounded-full flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
           </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 items-center justify-between flex">
           <div>
               <p className="text-sm font-medium text-gray-500 mb-1">Pending Bills</p>
               <p className="text-3xl font-bold text-red-600">$45.00</p>
           </div>
           <div className="w-12 h-12 bg-red-50 text-red-500 rounded-full flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
           </div>
        </div>
      </div>
      
      {/* Recent Activity List - placeholder */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <h3 className="font-semibold text-gray-800 mb-4">Recent Care Activity</h3>
        <div className="space-y-4">
           {/* Activity Item */}
           <div className="flex items-start gap-4 pb-4 border-b border-gray-50">
             <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-500 mt-1">
               <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                 <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
               </svg>
             </div>
             <div>
               <p className="font-medium text-gray-800">Visit with Dr. Smith</p>
               <p className="text-sm text-gray-500">Cardiology Checkup • Dec 12, 2025</p>
             </div>
           </div>
           {/* Activity Item */}
           <div className="flex items-start gap-4">
             <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center text-green-500 mt-1">
               <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                 <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
               </svg>
             </div>
             <div>
               <p className="font-medium text-gray-800">Blood Test Results Uploaded</p>
               <p className="text-sm text-gray-500">Diagnostic Center • Dec 10, 2025</p>
             </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default OverviewTab;
