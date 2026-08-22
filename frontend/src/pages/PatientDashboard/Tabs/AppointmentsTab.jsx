const AppointmentsTab = () => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Your Appointments</h2>
        <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-sm">
          Book New
        </button>
      </div>
      
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
         <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
            <h3 className="font-semibold text-gray-800">Upcoming</h3>
            <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">2</span>
         </div>
         <div className="p-0">
            {/* Appointment Card */}
            <div className="p-6 border-b border-gray-100 hover:bg-gray-50 transition-colors flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
               <div className="flex items-center gap-4">
                  <div className="bg-indigo-50 p-3 rounded-xl text-indigo-600 text-center min-w-[4rem]">
                     <p className="text-xs uppercase font-bold">Mar</p>
                     <p className="text-xl font-black">24</p>
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900">Dr. Sarah Johnson</h4>
                    <p className="text-sm text-gray-500">Dermatologist • 10:00 AM</p>
                    <p className="text-xs text-gray-400 mt-1">Room 302, Main Building</p>
                  </div>
               </div>
               <div className="flex gap-2 w-full md:w-auto">
                 <button className="flex-1 md:flex-none px-4 py-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg text-sm font-medium transition-colors">Cancel</button>
                 <button className="flex-1 md:flex-none px-4 py-2 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg text-sm font-medium transition-colors border border-indigo-100">Reschedule</button>
               </div>
            </div>

            {/* Appointment Card */}
            <div className="p-6 border-b border-gray-100 hover:bg-gray-50 transition-colors flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
               <div className="flex items-center gap-4">
                  <div className="bg-indigo-50 p-3 rounded-xl text-indigo-600 text-center min-w-[4rem]">
                     <p className="text-xs uppercase font-bold">Apr</p>
                     <p className="text-xl font-black">05</p>
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900">Dr. Michael Chen</h4>
                    <p className="text-sm text-gray-500">General Physician • 02:30 PM</p>
                    <p className="text-xs text-gray-400 mt-1">Virtual Consultation</p>
                  </div>
               </div>
               <div className="flex gap-2 w-full md:w-auto">
                 <button className="flex-1 md:flex-none px-4 py-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg text-sm font-medium transition-colors border border-transparent">Cancel</button>
                 <button className="flex-1 md:flex-none px-4 py-2 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg text-sm font-medium transition-colors border border-indigo-100">Reschedule</button>
               </div>
            </div>
         </div>
      </div>
      
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 opacity-75">
         <h3 className="font-semibold text-gray-800 mb-4 opacity-75">Past Appointments</h3>
         <p className="text-sm text-gray-500 italic">No past appointments found in the last 6 months.</p>
      </div>
    </div>
  );
};

export default AppointmentsTab;
