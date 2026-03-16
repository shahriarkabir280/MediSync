import React, { useState, useEffect } from 'react';
import { 
  User, Mail, Phone, MapPin, Calendar, Droplets, 
  ShieldAlert, Save, Edit2, X, CheckCircle, AlertCircle
} from 'lucide-react';
import { patientApi } from '../../../lib/api';
import toast from 'react-hot-toast';

const ProfileTab = ({ patient, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    date_of_birth: '',
    gender: '',
    blood_group: '',
    address: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    medical_history: '',
    allergies: ''
  });

  useEffect(() => {
    if (patient) {
      // Split name back to first and last if needed, or use raw data if available
      const nameParts = patient.name?.split(' ') || ['', ''];
      setFormData({
        first_name: patient.first_name || nameParts[0] || '',
        last_name: patient.last_name || nameParts[1] || '',
        email: patient.email || '',
        phone: patient.phone || '',
        date_of_birth: patient.date_of_birth?.split('T')[0] || '',
        gender: patient.gender || '',
        blood_group: patient.blood_group || '',
        address: patient.address || '',
        emergency_contact_name: patient.emergency_contact_name || '',
        emergency_contact_phone: patient.emergency_contact_phone || '',
        medical_history: patient.medical_history || '',
        allergies: patient.allergies || ''
      });
    }
  }, [patient]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await patientApi.update(patient.id, formData);
      if (response.success) {
        toast.success('Profile updated successfully!');
        setIsEditing(false);
        if (onUpdate) onUpdate();
      } else {
        toast.error(response.error || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('An error occurred while updating your profile');
    } finally {
      setLoading(false);
    }
  };

  const InfoField = ({ icon: Icon, label, value, name, type = "text", options = null }) => (
    <div className="space-y-1.5">
      <label className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
        <Icon size={12} />
        {label}
      </label>
      {isEditing ? (
        options ? (
          <select
            name={name}
            value={formData[name]}
            onChange={handleChange}
            className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-medium text-gray-900"
          >
            <option value="">Select {label}</option>
            {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </select>
        ) : (
          <input
            type={type}
            name={name}
            value={formData[name]}
            onChange={handleChange}
            className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-medium text-gray-900"
          />
        )
      ) : (
        <p className="text-sm font-bold text-gray-900 bg-white border border-transparent px-0 py-1">
          {value || 'Not specified'}
        </p>
      )}
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Profile Header Card */}
      <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8">
          {!isEditing ? (
            <button 
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-2xl text-sm font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 group"
            >
              <Edit2 size={16} className="group-hover:rotate-12 transition-transform" />
              Edit Profile
            </button>
          ) : (
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setIsEditing(false)}
                className="flex items-center gap-2 px-5 py-2.5 bg-gray-100 text-gray-600 rounded-2xl text-sm font-bold hover:bg-gray-200 transition-all"
              >
                <X size={16} />
                Cancel
              </button>
              <button 
                onClick={handleSubmit}
                disabled={loading}
                className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-2xl text-sm font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200 disabled:opacity-50"
              >
                {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save size={16} />}
                Save Changes
              </button>
            </div>
          )}
        </div>

        <div className="flex flex-col md:flex-row items-center gap-8">
          <div className="relative group">
            <div className="w-32 h-32 rounded-3xl overflow-hidden ring-4 ring-indigo-50 shadow-inner">
              <img 
                src={patient?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.first_name)}+${encodeURIComponent(formData.last_name)}&background=4F46E5&color=fff&size=128&bold=true`} 
                alt="Profile" 
                className="w-full h-full object-cover"
              />
            </div>
            {isEditing && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                <p className="text-[10px] font-black text-white uppercase tracking-tighter">Change Photo</p>
              </div>
            )}
          </div>

          <div className="text-center md:text-left">
            <h2 className="text-3xl font-black text-gray-900 tracking-tight">
              {isEditing ? `${formData.first_name} ${formData.last_name}` : patient?.name || 'Loading...'}
            </h2>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mt-3">
              <span className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-[10px] font-black uppercase tracking-widest border border-indigo-100">
                Patient Card: {patient?.displayId}
              </span>
              <span className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-100 flex items-center gap-1.5">
                <div className="w-1 h-1 bg-emerald-500 rounded-full" />
                Verified Account
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Basic Information */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm space-y-8">
            <div className="flex items-center gap-3 border-b border-gray-50 pb-6">
              <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
                <User size={20} />
              </div>
              <h3 className="text-lg font-black text-gray-900 uppercase tracking-wide">Personal Details</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <InfoField icon={User} label="First Name" name="first_name" value={formData.first_name} />
              <InfoField icon={User} label="Last Name" name="last_name" value={formData.last_name} />
              <InfoField icon={Mail} label="Email Address" name="email" value={formData.email} type="email" />
              <InfoField icon={Phone} label="Phone Number" name="phone" value={formData.phone} />
              <InfoField icon={Calendar} label="Date of Birth" name="date_of_birth" value={formData.date_of_birth} type="date" />
              <InfoField icon={User} label="Gender" name="gender" value={formData.gender} options={['Male', 'Female', 'Other']} />
              <InfoField icon={Droplets} label="Blood Group" name="blood_group" value={formData.blood_group} options={['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']} />
              <InfoField icon={MapPin} label="Home Address" name="address" value={formData.address} />
            </div>
          </div>

          <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm space-y-8">
            <div className="flex items-center gap-3 border-b border-gray-50 pb-6">
              <div className="p-2.5 bg-rose-50 text-rose-600 rounded-xl">
                <ShieldAlert size={20} />
              </div>
              <h3 className="text-lg font-black text-gray-900 uppercase tracking-wide">Emergency Contact</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <InfoField icon={User} label="Contact Person" name="emergency_contact_name" value={formData.emergency_contact_name} />
              <InfoField icon={Phone} label="Contact Phone" name="emergency_contact_phone" value={formData.emergency_contact_phone} />
            </div>
          </div>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
          <div className="bg-gray-900 rounded-3xl p-8 text-white space-y-6 shadow-xl shadow-gray-200">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-white/10 text-white rounded-xl">
                <AlertCircle size={20} />
              </div>
              <h3 className="text-lg font-black uppercase tracking-wide">Health Summary</h3>
            </div>
            
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Medical History</label>
                {isEditing ? (
                  <textarea
                    name="medical_history"
                    value={formData.medical_history}
                    onChange={handleChange}
                    rows={4}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-medium"
                    placeholder="Briefly describe your medical history..."
                  />
                ) : (
                  <p className="text-sm font-medium text-gray-300 leading-relaxed whitespace-pre-wrap">
                    {formData.medical_history || 'No medical history recorded yet.'}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Allergies</label>
                {isEditing ? (
                  <textarea
                    name="allergies"
                    value={formData.allergies}
                    onChange={handleChange}
                    rows={3}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-medium"
                    placeholder="List any allergies (comma separated)..."
                  />
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {formData.allergies ? formData.allergies.split(',').map((allergy, i) => (
                      <span key={i} className="px-3 py-1 bg-white/10 border border-white/10 rounded-lg text-xs font-bold">
                        {allergy.trim()}
                      </span>
                    )) : (
                      <p className="text-sm font-medium text-gray-300">No known allergies.</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="bg-indigo-600 rounded-3xl p-8 text-white relative overflow-hidden group shadow-xl shadow-indigo-200">
            <div className="relative z-10">
              <h4 className="text-xl font-black leading-tight">Need Medical Assistance?</h4>
              <p className="text-white/80 text-sm mt-2 font-medium">Contact our 24/7 support line for immediate help.</p>
              <button className="mt-6 w-full py-4 bg-white text-indigo-600 rounded-2xl text-sm font-black uppercase tracking-widest hover:bg-indigo-50 transition-colors shadow-lg shadow-black/10">
                Call Helpline
              </button>
            </div>
            <div className="absolute -bottom-8 -right-8 opacity-10 rotate-12 transition-transform group-hover:scale-110">
              <ShieldAlert size={160} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileTab;
