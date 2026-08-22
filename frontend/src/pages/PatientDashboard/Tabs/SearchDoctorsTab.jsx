import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { doctorApi } from '../../../lib/api';
import { getImageUrl, API_CONFIG } from '../../../config/api';
import toast from 'react-hot-toast';
import {
  MagnifyingGlassIcon,
  MapPinIcon,
  StarIcon,
  AcademicCapIcon,
  CurrencyDollarIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';

const SearchDoctorsTab = () => {
  const navigate = useNavigate();
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredDoctors, setFilteredDoctors] = useState([]);

  useEffect(() => {
    const fetchDoctors = async () => {
      setLoading(true);
      try {
        const response = await doctorApi.getMarketplace();
        if (response && response.success) {
          setDoctors(response.data);
          setFilteredDoctors(response.data);
        }
      } catch (error) {
        console.error("Error fetching marketplace doctors:", error);
        toast.error("Failed to load doctors list.");
      } finally {
        setLoading(false);
      }
    };
    fetchDoctors();
  }, []);

  useEffect(() => {
    const term = searchTerm.toLowerCase();
    const filtered = doctors.filter(doc => 
      (doc.first_name + ' ' + doc.last_name).toLowerCase().includes(term) ||
      doc.specialization?.toLowerCase().includes(term) ||
      doc.city?.toLowerCase().includes(term)
    );
    setFilteredDoctors(filtered);
  }, [searchTerm, doctors]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
        <p className="mt-4 text-gray-500 font-medium">Looking for specialists...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-6">
        <h2 className="text-xl font-bold text-gray-800 mb-2">Find a Specialist</h2>
        <p className="text-gray-600 mb-6">Search for doctors by name, specialty, or location to book your next appointment.</p>
        
        {/* Search Bar */}
        <div className="relative max-w-2xl">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
            <MagnifyingGlassIcon className="h-6 w-6" />
          </div>
          <input
            type="text"
            className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-xl text-md focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all text-gray-900 placeholder-gray-400"
            placeholder="Search doctors, specialties, or city..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-12">
        {filteredDoctors.map(doctor => (
          <div key={doctor.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
            <div className="p-6">
              <div className="flex items-start gap-4">
                <img 
                  src={getImageUrl(doctor.profile_image_url) || `https://ui-avatars.com/api/?name=${doctor.first_name}+${doctor.last_name}&background=random`} 
                  alt={`Dr. ${doctor.last_name}`}
                  className="w-20 h-20 rounded-xl object-cover border border-gray-100 shadow-sm"
                  onError={(e) => { e.target.src = `https://ui-avatars.com/api/?name=${doctor.first_name}+${doctor.last_name}&background=random`; }}
                />
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">Dr. {doctor.first_name} {doctor.last_name}</h3>
                      <p className="text-indigo-600 font-medium text-sm mb-2">{doctor.specialization || 'Specialist'}</p>
                    </div>
                    <div className="flex items-center gap-1 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-100">
                      <StarIconSolid className="w-4 h-4 text-amber-500" />
                      <span className="text-sm font-bold text-amber-700">{doctor.rating || '4.9'}</span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-y-2.5 mt-4 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <AcademicCapIcon className="w-4 h-4 text-gray-400" />
                      {doctor.experience_years || doctor.years_of_experience || '5'}+ Years Exp.
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPinIcon className="w-4 h-4 text-gray-400" />
                      {doctor.city || 'MediSync'}
                    </div>
                    <div className="flex items-center gap-2">
                      <CurrencyDollarIcon className="w-4 h-4 text-gray-400" />
                      ৳{doctor.consultation_fee || '1000'} / visit
                    </div>
                    <div className="flex items-center gap-2">
                      <ShieldCheckIcon className="w-4 h-4 text-emerald-500" />
                      <span className="text-emerald-700 font-medium">Verified</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-gray-50/50 px-6 py-4 border-t border-gray-100 flex justify-between items-center group">
              <span className="text-xs text-gray-500 font-medium uppercase tracking-wider flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                Available Today
              </span>
              <button 
                onClick={() => navigate(`/doctor/${doctor.slug}`)}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-indigo-600/10 active:scale-95 flex items-center gap-2"
              >
                View & Book
              </button>
            </div>
          </div>
        ))}

        {filteredDoctors.length === 0 && (
          <div className="col-span-full py-12 text-center bg-white rounded-2xl border border-dashed border-gray-200">
            <MagnifyingGlassIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No doctors match your search.</p>
            <p className="text-xs text-gray-400 mt-1">Try a different specialization or city.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchDoctorsTab;
