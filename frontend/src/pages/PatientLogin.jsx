import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { patientApi } from '../lib/api';
import { 
  User, Mail, ArrowRight, Activity, Loader2, Key
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

const PatientLogin = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please enter your email and password.");
      return;
    }

    setLoading(true);
    
    try {
      const response = await patientApi.login(email, password);
      
      if (response && response.success) {
        localStorage.setItem('patientSessionEmail', email);
        localStorage.setItem('patientId', response.data.id);
        localStorage.setItem('patientDisplayId', response.data.unique_id);
        localStorage.setItem('patientName', `${response.data.first_name} ${response.data.last_name}`);
        localStorage.setItem('patientToken', response.token);
        
        toast.success("Welcome back to MediSync!");
        navigate('/patient-dashboard');
      } else {
        toast.error(response.message || "Invalid credentials");
      }
      
    } catch (error) {
      console.error("Login error:", error);
      toast.error(error.message || "Failed to login. Please ensure your email is registered.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center font-sans">
      <div className="max-w-md w-full">
        
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
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Patient Gateway</h2>
          <p className="text-gray-500">
            Access your medical history, reports, and upcoming appointments.
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="p-8 sm:p-10">
            <form onSubmit={handleSubmit} className="space-y-6">
              
              <InputField 
                label="Email Address" 
                name="email"
                icon={Mail} 
                type="email" 
                placeholder="jane.doe@example.com" 
                required 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />

              <div className="space-y-1.5">
                <label className="flex items-center gap-1 text-sm font-medium text-gray-700">
                  Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <Key size={18} />
                  </div>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all text-gray-900 placeholder-gray-400"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div className="pt-4">
                <button 
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center items-center gap-2 px-6 py-3.5 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-600/20 active:scale-[0.98] disabled:bg-indigo-400"
                >
                  {loading ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <>
                      Sign In
                      <ArrowRight size={18} />
                    </>
                  )}
                </button>
              </div>

            </form>

            <div className="mt-8 pt-6 border-t border-gray-100 text-center text-sm font-medium text-gray-600 flex flex-col gap-2">
                <p>
                  Don't have an account? <Link to="/patient-signup" className="text-indigo-600 hover:text-indigo-800 transition-colors">Register Here</Link>
                </p>
                <p>
                  Are you a doctor? <Link to="/" className="text-emerald-600 hover:text-emerald-800 transition-colors">Doctor Portal</Link>
                </p>
            </div>
          </div>
        </div>
        
      </div>
    </div>
  );
};

export default PatientLogin;
