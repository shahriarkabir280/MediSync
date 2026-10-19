import React, { useState, useEffect } from 'react';
import { appointmentApi } from '../../../lib/api';
import { getImageUrl } from '../../../config/api';
import { 
  CalendarIcon, 
  ClipboardIcon, 
  ArrowRightIcon,
  UserIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

const OverviewTab = ({ onTabChange, patient }) => {
  const [appointments, setAppointments] = useState([]);
  const [recentDoctors, setRecentDoctors] = useState([]);
  const [, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecentData = async () => {
      if (!patient?.id) return;
      try {
        setLoading(true);
        const response = await appointmentApi.getByPatient(patient.id);
        if (response.success) {
          const appts = response.data;
          setAppointments(appts);
          
          // Extract unique doctors, prioritizing the most recent visit
          const doctorMap = new Map();
          appts.forEach(appt => {
            if (!doctorMap.has(appt.doctor_id)) {
              doctorMap.set(appt.doctor_id, {
                id: appt.doctor_id,
                name: `${appt.doctor_first_name} ${appt.doctor_last_name}`,
                specialization: appt.doctor_specialization || 'General Practitioner',
                image: appt.doctor_image,
                lastVisit: appt.appointment_date,
                slug: appt.doctor_unique_id // Using unique_id as slug fallback if needed
              });
            }
          });
          
          setRecentDoctors(Array.from(doctorMap.values()).slice(0, 3));
        }
      } catch (error) {
        console.error('Error fetching dashboard overview data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRecentData();
  }, [patient?.id]);

  const upcomingAppointments = appointments.filter(a => a.status === 'confirmed' || a.status === 'pending');

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 p-8 rounded-2xl shadow-lg relative overflow-hidden">
        <div className="relative z-10">
          <h2 className="text-2xl font-bold text-white mb-2">Welcome back, {patient?.name?.split(' ')[0]}!</h2>
          <p className="text-indigo-100 max-w-md">Your health journey is looking great. You have {upcomingAppointments.length} upcoming appointments this week.</p>
          <div className="mt-8 flex flex-wrap gap-4">
            <button 
              onClick={() => onTabChange("appointments")}
              className="px-6 py-2.5 bg-white text-indigo-700 rounded-xl hover:bg-gray-50 font-semibold shadow-sm transition-all active:scale-95"
            >
              Book Appointment
            </button>
            <button 
              onClick={() => onTabChange("reports")}
              className="px-6 py-2.5 bg-indigo-500/30 text-white border border-indigo-400/30 rounded-xl hover:bg-indigo-500/50 font-semibold transition-all"
            >
              View Reports
            </button>
          </div>
        </div>
        {/* Abstract background shape */}
        <div className="absolute top-[-20%] right-[-10%] w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 items-center justify-between flex group hover:shadow-md transition-shadow">
          <div>
            <p className="text-sm font-medium text-gray-500 mb-1">Upcoming Appointments</p>
            <p className="text-3xl font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">
              {upcomingAppointments.length}
            </p>
          </div>
          <div className="w-12 h-12 bg-indigo-50 text-indigo-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
            <CalendarIcon className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 items-center justify-between flex group hover:shadow-md transition-shadow">
          <div>
            <p className="text-sm font-medium text-gray-500 mb-1">Medical Records</p>
            <p className="text-3xl font-bold text-gray-900 group-hover:text-green-600 transition-colors">
              {appointments.length > 0 ? 'Updated' : 'Empty'}
            </p>
          </div>
          <div className="w-12 h-12 bg-green-50 text-green-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
            <ClipboardIcon className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 items-center justify-between flex group hover:shadow-md transition-shadow">
          <div>
            <p className="text-sm font-medium text-gray-500 mb-1">Health Status</p>
            <p className="text-3xl font-bold text-indigo-600 group-hover:text-indigo-700 transition-colors">Active</p>
          </div>
          <div className="w-12 h-12 bg-blue-50 text-blue-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
            <UserIcon className="w-6 h-6" />
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Care Team / Recent Doctors */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-gray-800 text-lg">Your Care Team</h3>
            <button 
              onClick={() => onTabChange("search")}
              className="text-indigo-600 text-sm font-semibold hover:underline flex items-center gap-1"
            >
              See All Doctors <ArrowRightIcon className="w-3 h-3" />
            </button>
          </div>
          
          <div className="space-y-4">
            {recentDoctors.length > 0 ? (
              recentDoctors.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between p-4 rounded-xl border border-gray-50 hover:border-indigo-100 hover:bg-gray-50/50 transition-all group">
                  <div className="flex items-center gap-4">
                    <img 
                      src={doc.image ? getImageUrl(doc.image) : `https://api.dicebear.com/7.x/initials/svg?seed=${doc.name}`} 
                      alt={doc.name} 
                      className="w-12 h-12 rounded-xl object-cover shadow-sm bg-gray-200"
                    />
                    <div>
                      <h4 className="font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">{doc.name}</h4>
                      <p className="text-sm text-gray-500">{doc.specialization}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <p className="text-[10px] uppercase tracking-wider font-bold text-gray-400">Last Visit</p>
                    <p className="text-xs font-semibold text-gray-700">{new Date(doc.lastVisit).toLocaleDateString()}</p>
                    <button 
                      onClick={() => window.open(`/doctor/${doc.slug || doc.id}`, '_blank')}
                      className="mt-1 px-3 py-1 bg-white border border-gray-200 text-indigo-600 text-[10px] font-bold rounded-lg hover:border-indigo-600 hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
                    >
                      FOLLOW UP
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3 text-gray-300">
                  <UserIcon className="w-8 h-8" />
                </div>
                <p className="text-gray-500 text-sm">No recent care activity found.</p>
                <button 
                  onClick={() => onTabChange("search")}
                  className="mt-4 text-indigo-600 text-sm font-bold hover:underline"
                >
                  Find a Doctor
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Recent Activity List */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="font-bold text-gray-800 text-lg mb-6">Recent Activity</h3>
          <div className="space-y-4">
            {appointments.length > 0 ? (
              appointments.slice(0, 4).map((appt) => (
                <div key={appt.id} className="flex gap-4">
                  <div className={`w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center ${
                    appt.status === 'completed' ? 'bg-green-50 text-green-500' : 'bg-indigo-50 text-indigo-500'
                  }`}>
                    {appt.status === 'completed' ? <ClipboardIcon className="w-5 h-5" /> : <ClockIcon className="w-5 h-5" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                       <h4 className="font-semibold text-gray-900 truncate">
                        {appt.status === 'completed' ? 'Visit Completed' : 'Appointment Scheduled'}
                      </h4>
                      <span className="text-[10px] font-bold text-gray-400 whitespace-nowrap">
                        {new Date(appt.appointment_date).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 truncate">
                      {appt.doctor_first_name} {appt.doctor_last_name} • {appt.appointment_type}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500 text-sm">
                No recent activity records.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OverviewTab;
