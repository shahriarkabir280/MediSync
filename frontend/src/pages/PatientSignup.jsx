import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { patientApi } from '../lib/api';
import toast from 'react-hot-toast';
import { 
  User, Mail, Phone, Calendar, Heart, AlertCircle, Shield, Key,
  MapPin, Activity, CheckCircle2, ArrowRight, Loader2, Info
} from 'lucide-react';

const InputField = ({ label, icon: Icon, type = "text", value, onChange, placeholder, required = false, name }) => (
  <div className="space-y-1.5">
    <label className="flex items-center gap-1 text-sm font-medium text-gray-700">
      {label} {required && <span className="text-rose-500">*</span>}
    </label>
    <div className="relative">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
        <Icon size={18} />
      </div>
      <input
        type={type}
        name={name}
        required={required}
        value={value}
        onChange={onChange}
        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all text-gray-900 placeholder-gray-400"
        placeholder={placeholder}
      />
    </div>
  </div>
);

const TextAreaField = ({ label, icon: Icon, value, onChange, placeholder, name }) => (
  <div className="space-y-1.5">
    <label className="flex items-center gap-1 text-sm font-medium text-gray-700">
      {label}
    </label>
    <div className="relative">
      <div className="absolute top-3 left-3 flex items-center pointer-events-none text-gray-400">
        <Icon size={18} />
      </div>
      <textarea
        name={name}
        value={value}
        onChange={onChange}
        rows={3}
        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all text-gray-900 placeholder-gray-400 resize-none"
        placeholder={placeholder}
      />
    </div>
  </div>
);

const SelectField = ({ label, icon: Icon, value, onChange, options, name, required = false }) => (
  <div className="space-y-1.5">
    <label className="flex items-center gap-1 text-sm font-medium text-gray-700">
      {label} {required && <span className="text-rose-500">*</span>}
    </label>
    <div className="relative">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
        <Icon size={18} />
      </div>
      <select
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        className="w-full pl-10 pr-10 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all text-gray-900 appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%239ca3af%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[position:right_10px_center] bg-[length:16px_16px]"
      >
        <option value="" disabled>Select {label}</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  </div>
);

const PatientSignup = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    password: '',
    confirm_password: '',
    date_of_birth: '',
    gender: '',
    blood_group: '',
    address: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    medical_history: '',
    allergies: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleNextStep = (e) => {
    e.preventDefault();
    if (step === 1) {
      if (!formData.first_name || !formData.last_name || !formData.email || !formData.phone || !formData.password || !formData.confirm_password) {
        toast.error("Please fill in all required personal details.");
        return;
      }
      if (formData.password.length < 8) {
        toast.error("Password must be at least 8 characters long.");
        return;
      }
      if (formData.password !== formData.confirm_password) {
        toast.error("Passwords do not match.");
        return;
      }
      setStep(2);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const patientData = { ...formData };
      delete patientData.confirm_password;
      const result = await patientApi.create(patientData);
      if (result.success && result.data) {
        localStorage.setItem('patientSessionEmail', formData.email);
        localStorage.setItem('patientId', result.data.id);
        localStorage.setItem('patientDisplayId', result.data.unique_id);
        localStorage.setItem('patientName', `${formData.first_name} ${formData.last_name}`);

        // Signup does not return a token; sign in to get one for the dashboard
        try {
          const loginResult = await patientApi.login(formData.email, formData.password);
          if (loginResult?.token) localStorage.setItem('patientToken', loginResult.token);
        } catch (loginError) {
          console.error("Auto sign-in after signup failed:", loginError);
        }
        
        toast.success("Registration successful! Welcome to MediSync.");
        // Redirecting to patient dashboard directly (it falls back to the login page without a token)
        navigate('/patient-dashboard');
      }
    } catch (error) {
      console.error("Signup error:", error);
      toast.error(error.message || "Failed to create account. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center font-sans">
      <div className="max-w-3xl w-full">
        
        {/* Header */}
        <div className="text-center mb-10">
          <div className="flex justify-center items-center gap-2 mb-4">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-600/20 transform -rotate-6">
              <Activity size={24} className="text-white" />
            </div>
            <h1 className="text-2xl font-black tracking-tight text-gray-900">
              Medi<span className="text-indigo-600">Sync</span>
            </h1>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Patient Registration</h2>
          <p className="text-gray-500 max-w-lg mx-auto">
            Create your digital health profile in minutes and take control of your medical journey.
          </p>
        </div>

        {/* Progress Tracker */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center w-full max-w-md">
            <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 font-semibold text-sm transition-colors ${
              step >= 1 ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-gray-300 text-gray-400'
            }`}>
              1
            </div>
            <div className={`flex-1 h-1 mx-2 rounded transition-colors ${
              step >= 2 ? 'bg-indigo-600' : 'bg-gray-200'
            }`}></div>
            <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 font-semibold text-sm transition-colors ${
              step >= 2 ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-gray-300 text-gray-400'
            }`}>
              2
            </div>
          </div>
        </div>

        {/* Registration Card */}
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="p-8 sm:p-10">
            <form onSubmit={step === 1 ? handleNextStep : handleSubmit}>
              
              {/* Step 1: Personal Details */}
              {step === 1 && (
                <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="border-b border-gray-100 pb-4 mb-2">
                    <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                      <User size={20} className="text-indigo-600" />
                      Personal Information
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <InputField 
                      label="First Name" 
                      name="first_name"
                      icon={User} 
                      placeholder="Jane" 
                      required 
                      value={formData.first_name}
                      onChange={handleChange}
                    />
                    <InputField 
                      label="Last Name" 
                      name="last_name"
                      icon={User} 
                      placeholder="Doe" 
                      required 
                      value={formData.last_name}
                      onChange={handleChange}
                    />
                    <InputField 
                      label="Email Address" 
                      name="email"
                      icon={Mail} 
                      type="email" 
                      placeholder="jane.doe@example.com" 
                      required 
                      value={formData.email}
                      onChange={handleChange}
                    />
                    <InputField 
                      label="Phone Number" 
                      name="phone"
                      icon={Phone} 
                      type="tel" 
                      placeholder="+1 (555) 000-0000" 
                      required 
                      value={formData.phone}
                      onChange={handleChange}
                    />
                    <InputField
                      label="Password"
                      name="password"
                      icon={Key}
                      type="password"
                      placeholder="Minimum 8 characters"
                      required
                      value={formData.password}
                      onChange={handleChange}
                    />
                    <InputField
                      label="Confirm Password"
                      name="confirm_password"
                      icon={Key}
                      type="password"
                      placeholder="Re-enter password"
                      required
                      value={formData.confirm_password}
                      onChange={handleChange}
                    />
                    <InputField 
                      label="Date of Birth" 
                      name="date_of_birth"
                      icon={Calendar} 
                      type="date"
                      value={formData.date_of_birth}
                      onChange={handleChange}
                    />
                    <SelectField
                      label="Gender"
                      name="gender"
                      icon={User}
                      value={formData.gender}
                      onChange={handleChange}
                      options={[
                        { value: 'Male', label: 'Male' },
                        { value: 'Female', label: 'Female' },
                        { value: 'Other', label: 'Other' },
                        { value: 'Prefer not to say', label: 'Prefer not to say' }
                      ]}
                    />
                    <div className="md:col-span-2">
                      <InputField 
                        label="Residential Address" 
                        name="address"
                        icon={MapPin} 
                        placeholder="123 Health Ave, Medical District, State, 12345"
                        value={formData.address}
                        onChange={handleChange}
                      />
                    </div>
                  </div>

                  <div className="pt-6">
                    <button 
                      type="submit"
                      className="w-full flex justify-center items-center gap-2 px-6 py-3.5 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-600/20 active:scale-[0.98]"
                    >
                      Continue to Medical Details
                      <ArrowRight size={18} />
                    </button>
                    <p className="text-center text-sm text-gray-500 mt-6">
                      Already have an account? <Link to="/" className="text-indigo-600 font-semibold hover:underline">Sign in as Doctor</Link>
                    </p>
                  </div>
                </div>
              )}

              {/* Step 2: Medical Profile */}
              {step === 2 && (
                <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 flex items-start gap-3 mb-6">
                    <Info size={20} className="text-indigo-600 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-indigo-800">
                      These details help our doctors provide the best care possible. You can always update this information later from your dashboard.
                    </p>
                  </div>

                  <div className="border-b border-gray-100 pb-4 mb-2">
                    <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                      <Heart size={20} className="text-rose-500" />
                      Medical Profile
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <SelectField
                      label="Blood Group"
                      name="blood_group"
                      icon={Heart}
                      value={formData.blood_group}
                      onChange={handleChange}
                      options={[
                        { value: 'A+', label: 'A+' }, { value: 'A-', label: 'A-' },
                        { value: 'B+', label: 'B+' }, { value: 'B-', label: 'B-' },
                        { value: 'AB+', label: 'AB+' }, { value: 'AB-', label: 'AB-' },
                        { value: 'O+', label: 'O+' }, { value: 'O-', label: 'O-' },
                      ]}
                    />
                    <InputField 
                      label="Allergies (comma separated)" 
                      name="allergies"
                      icon={Shield} 
                      placeholder="e.g. Penicillin, Peanuts, Pollen"
                      value={formData.allergies}
                      onChange={handleChange}
                    />
                    <div className="md:col-span-2">
                      <TextAreaField
                        label="Pre-existing Medical History"
                        name="medical_history"
                        icon={Activity}
                        placeholder="Please list any chronic conditions, past surgeries, or ongoing treatments..."
                        value={formData.medical_history}
                        onChange={handleChange}
                      />
                    </div>
                  </div>

                  <div className="border-b border-gray-100 pb-4 mb-2 mt-8">
                    <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                      <AlertCircle size={20} className="text-orange-500" />
                      Emergency Contact
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <InputField 
                      label="Emergency Contact Name" 
                      name="emergency_contact_name"
                      icon={User} 
                      placeholder="John Doe"
                      value={formData.emergency_contact_name}
                      onChange={handleChange}
                    />
                    <InputField 
                      label="Emergency Contact Phone" 
                      name="emergency_contact_phone"
                      icon={Phone} 
                      type="tel" 
                      placeholder="+1 (555) 000-0000"
                      value={formData.emergency_contact_phone}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="flex gap-4 pt-6">
                    <button 
                      type="button"
                      onClick={() => setStep(1)}
                      className="px-6 py-3.5 bg-white border border-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
                    >
                      Back
                    </button>
                    <button 
                      type="submit"
                      disabled={loading}
                      className="flex-1 flex justify-center items-center gap-2 px-6 py-3.5 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-600/20 disabled:bg-indigo-400 active:scale-[0.98]"
                    >
                      {loading ? (
                        <>
                          <Loader2 size={18} className="animate-spin" />
                          Creating Account...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 size={18} />
                          Complete Registration
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

            </form>
          </div>
        </div>
        
        {/* Footer */}
        <p className="text-center text-xs text-gray-400 mt-8">
          By registering, you agree to our Terms of Service and Privacy Policy. All medical data is encrypted and securely stored.
        </p>

      </div>
    </div>
  );
};

export default PatientSignup;
