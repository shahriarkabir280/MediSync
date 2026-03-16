
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Heart, Activity, Shield, Calendar, MapPin, Phone, Mail, Menu, X,
  TrendingUp, Zap, Users, Award, Send, Clock, Star, ChevronDown,
  ArrowRight, CheckCircle, Facebook, Twitter, Instagram, Youtube,
  Stethoscope, Thermometer, Pill, Syringe, Brain, Eye, Ear, Bone,
  Baby, UserPlus, Microscope, FileText, Cross, Smile, Droplet,
  UserCheck, Timer, Video, MessageSquare, Clipboard, Globe, Linkedin, UserCircle,
  GraduationCap, Briefcase, Building
} from 'lucide-react';
import { API_URLS, getImageUrl } from '../config/api';
import { appointmentApi } from '../lib/api';
import toast from 'react-hot-toast';

const SUPPORTED_ICONS = {
  'General': { Stethoscope, Activity, Thermometer, Pill, Syringe, Microscope, FileText, Clipboard },
  'Cardiology': { Heart, Activity, Zap, Timer },
  'Neurology': { Brain, Zap, Activity },
  'Orthopedics': { Bone, UserCheck, Activity },
  'Pediatrics': { Baby, Smile, UserPlus },
  'Dental': { Smile, Cross },
  'Ophthalmology': { Eye },
  'ENT': { Ear },
  'Emergency': { Cross, Zap, Timer },
  'Telemedicine': { Video, Phone, MessageSquare, Calendar }
};

const getIconComponent = (iconName) => {
  if (!iconName) return Activity;

  // Flatten icons map for lookup
  for (const category in SUPPORTED_ICONS) {
    const icons = SUPPORTED_ICONS[category];
    if (icons[iconName]) {
      return icons[iconName];
    }
  }
  return Activity;
};

const TRANSLATIONS = {
  en: {
    nav: { home: 'Home', services: 'Services', appointment: 'Appointment', about: 'About', testimonials: 'Stories', contact: 'Contact' },
    buttons: { login: 'Login', signup: 'Sign Up', book: 'Book Appointment', emergency: 'Emergency Call', readMore: 'Read More' },
    labels: { available: 'Available for Consultation', experience: 'Years Experience', patients: 'Patients Treated', success: 'Success Rate', fee: 'Consultation Fee' },
    sections: {
      schedule: 'Consultation Schedule',
      location: 'Chamber Location',
      specialization: 'Our Specializations',
      about: 'Professional Excellence',
      meet: 'Meet',
      testimonials: 'Patient Stories',
      affiliates: 'Our Partners',
      footer: 'All rights reserved.'
    }
  },
  bn: {
    nav: { home: 'হোম', services: 'সেবাসমূহ', appointment: 'অ্যাপয়েন্টমেন্ট', about: 'পরিচিতি', testimonials: 'গল্প', contact: 'যোগাযোগ' },
    buttons: { login: 'লগইন', signup: 'নিবন্ধন', book: 'অ্যাপয়েন্টমেন্ট নিন', emergency: 'জরুরী কল', readMore: 'আরও পড়ুন' },
    labels: { available: 'পরামর্শের জন্য উপলব্ধ', experience: 'বছরের অভিজ্ঞতা', patients: 'রোগী চিকিৎসা', success: 'সাফল্যের হার', fee: 'পরামর্শ ফি' },
    sections: {
      schedule: 'পরামর্শের সময়সূচী',
      location: 'চেম্বার অবস্থান',
      specialization: 'আমাদের বিশেষত্ব',
      about: 'পেশাদার উৎকর্ষ',
      meet: 'পরিচিত হোন',
      testimonials: 'রোগীদের কথা',
      affiliates: 'আমাদের পার্টনার',
      footer: 'সর্বস্বত্ব সংরক্ষিত।'
    }
  }
};

const PublicWebsite = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lang, setLang] = useState('en');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingData, setBookingData] = useState({
    patient_name: '',
    patient_email: '',
    patient_phone: '',
    appointment_date: '',
    appointment_time: '',
    appointment_type: 'In-person',
    notes: ''
  });

  const t = TRANSLATIONS[lang];

  // Check if patient is logged in
  useEffect(() => {
    const sessionEmail = localStorage.getItem('patientSessionEmail');
    if (sessionEmail && !bookingData.patient_email) {
      setBookingData(prev => ({
        ...prev,
        patient_email: sessionEmail,
        patient_name: localStorage.getItem('patientName') || ''
      }));
    }
  }, []);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        // Fallback to 'dr-jobayer-hasan' if slug is missing for dev/testing
        const targetSlug = slug || 'dr-jobayer-hasan';
        const response = await fetch(API_URLS.WEBSITE.PUBLIC(targetSlug));

        if (!response.ok) {
          throw new Error('Profile not found');
        }

        const result = await response.json();
        if (result.success) {
          setData(result.data);
        } else {
          throw new Error('Failed to load profile');
        }
      } catch (err) {
        console.error("Error fetching public profile:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [slug]);

  // Determine Social Icon
  const getSocialIcon = (platform) => {
    const p = platform?.toLowerCase() || '';
    if (p.includes('facebook')) return Facebook;
    if (p.includes('twitter')) return Twitter;
    if (p.includes('instagram')) return Instagram;
    if (p.includes('youtube')) return Youtube;
    if (p.includes('linkedin')) return Linkedin;
    return Globe;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600 font-medium">Loading Profile...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center max-w-md px-4">
          <Shield className="w-16 h-16 text-slate-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Profile Not Found</h2>
          <p className="text-slate-600">The doctor profile you are looking for is currently unavailable.</p>
        </div>
      </div>
    );
  }

  // --- Render Components ---

  const Button = ({ children, onClick = () => { }, className = "", variant = "primary", size = "md", icon: Icon }) => {
    const baseClasses = "font-semibold rounded-xl transition-all duration-300 transform hover:scale-105 active:scale-95 focus:outline-none focus:ring-4 focus:ring-blue-500/20 inline-flex items-center justify-center";
    const variants = {
      primary: `bg-gradient-to-r ${data.theme_color === '#2563eb' ? 'from-blue-600 via-blue-700 to-indigo-700' : 'from-emerald-600 via-emerald-700 to-teal-700'} text-white shadow-xl hover:shadow-2xl`,
      secondary: "bg-white text-slate-800 border border-slate-200 hover:bg-slate-50 shadow-md",
      outline: "border-2 border-current bg-transparent hover:bg-slate-50/10",
      ghost: "text-slate-700 hover:text-blue-600 hover:bg-blue-50"
    };
    const sizes = { sm: "px-4 py-2 text-sm", md: "px-6 py-3 text-base", lg: "px-8 py-4 text-lg" };

    return (
      <button onClick={onClick} className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`}>
        {Icon && <Icon className="w-5 h-5 mr-2" />}
        {children}
      </button>
    );
  };

  const Card = ({ children, className = "", hover = true }) => (
    <div className={`bg-white rounded-2xl shadow-xl ${hover ? 'hover:shadow-2xl transition-all duration-500 hover:-translate-y-2' : ''} backdrop-blur-sm border border-white/20 ${className}`}>
      {children}
    </div>
  );

  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    setBookingLoading(true);
    try {
      if (!bookingData.appointment_date || !bookingData.appointment_time) {
        throw new Error("Please select date and time");
      }

      await appointmentApi.create(data.id, {
        ...bookingData,
        status: 'pending'
      });

      toast.success("Appointment booked successfully!");
      setIsBookingModalOpen(false);

      // Redirect if patient is logged in
      if (localStorage.getItem('patientSessionEmail')) {
        toast("Redirecting to your dashboard...", { icon: '🔄' });
        setTimeout(() => navigate('/patient-dashboard'), 1500);
      }
    } catch (error) {
      console.error("Booking error:", error);
      toast.error(error.message || "Failed to book appointment");
    } finally {
      setBookingLoading(false);
    }
  };

  const BookingModal = () => (
    <div className={`fixed inset-0 z-[100] flex items-center justify-center p-4 transition-all duration-300 ${isBookingModalOpen ? 'visible opacity-100' : 'invisible opacity-0'}`}>
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsBookingModalOpen(false)}></div>
      <div className={`bg-white w-full max-w-lg rounded-3xl shadow-2xl relative z-10 overflow-hidden transform transition-all duration-500 ${isBookingModalOpen ? 'translate-y-0 scale-100' : 'translate-y-12 scale-95'}`}>
        <div className={`p-6 text-white bg-gradient-to-r ${data.theme_color === '#2563eb' ? 'from-blue-600 to-indigo-700' : 'from-emerald-600 to-teal-700'}`}>
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold">Book Appointment</h3>
            <button onClick={() => setIsBookingModalOpen(false)} className="p-2 hover:bg-white/20 rounded-full transition-colors">
              <X size={20} />
            </button>
          </div>
          <p className="text-blue-100/80 text-sm mt-1">Schedule your visit with Dr. {data.last_name}</p>
        </div>

        <form onSubmit={handleBookingSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto custom-scrollbar">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase">Your Name</label>
              <input 
                type="text" 
                required
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                value={bookingData.patient_name}
                onChange={e => setBookingData({...bookingData, patient_name: e.target.value})}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase">Email Address</label>
              <input 
                type="email" 
                required
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                value={bookingData.patient_email}
                onChange={e => setBookingData({...bookingData, patient_email: e.target.value})}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase">Preferred Date</label>
              <input 
                type="date" 
                required
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                value={bookingData.appointment_date}
                onChange={e => setBookingData({...bookingData, appointment_date: e.target.value})}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase">Preferred Time</label>
              <input 
                type="time" 
                required
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                value={bookingData.appointment_time}
                onChange={e => setBookingData({...bookingData, appointment_time: e.target.value})}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase">Reason / Notes</label>
            <textarea 
              rows="3"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all resize-none"
              placeholder="Tell us briefly about your concern..."
              value={bookingData.notes}
              onChange={e => setBookingData({...bookingData, notes: e.target.value})}
            />
          </div>

          <button 
            type="submit" 
            disabled={bookingLoading}
            className={`w-full py-4 text-white font-bold rounded-2xl shadow-lg transition-all transform active:scale-[0.98] flex items-center justify-center gap-2 ${
              data.theme_color === '#2563eb' ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/20' : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20'
            } ${bookingLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {bookingLoading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : <Calendar size={20} />}
            {bookingLoading ? 'Processing...' : 'Confirm Appointment'}
          </button>
        </form>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/30 relative overflow-hidden font-sans text-slate-800">

      {/* Background Blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-emerald-400/10 rounded-full blur-3xl" style={{ animationDelay: '1s' }}></div>
      </div>

      {/* --- Navigation --- */}
      <nav className={`fixed w-full top-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white/95 backdrop-blur-xl shadow-lg py-3' : 'bg-transparent py-5'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            {/* Logo / Doctor Name */}
            <div className="flex items-center space-x-4">
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-emerald-500 rounded-full blur opacity-75 group-hover:opacity-100 transition duration-500"></div>
                <img
                  src={getImageUrl(data.profile_photo_url) || 'https://via.placeholder.com/150'}
                  alt={data.full_name}
                  className="relative w-12 h-12 rounded-full border-2 border-white object-cover"
                  onError={(e) => e.target.src = 'https://via.placeholder.com/150'}
                />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">{data.full_name}</h1>
                <p className="text-xs text-slate-500 font-medium tracking-wide uppercase">{data.website?.tagline || data.specialization || 'Doctor'}</p>
              </div>
            </div>

            {/* Desktop Menu */}
            <div className="hidden lg:flex items-center space-x-8">
              {['home', 'about', 'services', 'appointment', 'contact'].map((item) => (
                <a key={item} href={`#${item}`} className="text-sm font-semibold text-slate-600 hover:text-blue-600 uppercase tracking-wider transition-colors relative group">
                  {t.nav[item]}
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-blue-600 transition-all group-hover:w-full"></span>
                </a>
              ))}

              {/* Language Toggle */}
              <div className="flex bg-slate-100 rounded-full p-1">
                <button
                  onClick={() => setLang('en')}
                  className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${lang === 'en' ? 'bg-white shadow text-blue-700' : 'text-slate-500 hover:text-slate-700'}`}
                >EN</button>
                <button
                  onClick={() => setLang('bn')}
                  className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${lang === 'bn' ? 'bg-white shadow text-emerald-700' : 'text-slate-500 hover:text-slate-700'}`}
                >BN</button>
              </div>

              <div className="flex items-center gap-2">
                <Button size="sm" onClick={() => navigate('/patient-login')}>Login</Button>
                <Button size="sm" variant="secondary" onClick={() => navigate('/patient-signup')}>Register</Button>
              </div>
            </div>

            {/* Mobile Menu Toggle */}
            <button className="lg:hidden p-2 text-slate-600" onClick={() => setIsMenuOpen(!isMenuOpen)}>
              {isMenuOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>
      </nav>

      {/* --- Mobile Menu Overlay --- */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-40 bg-white pt-24 px-6 lg:hidden animate-in slide-in-from-top-10 fade-in">
          <div className="flex flex-col space-y-6 text-center text-lg font-medium text-slate-700">
            {['home', 'about', 'services', 'appointment', 'contact'].map((item) => (
              <a key={item} href={`#${item}`} onClick={() => setIsMenuOpen(false)}>{t.nav[item]}</a>
            ))}
            <div className="pt-6 border-t border-slate-100">
              <div className="flex justify-center space-x-4 mb-4">
                <button onClick={() => setLang('en')} className={`text-sm font-bold ${lang === 'en' ? 'text-blue-600' : 'text-slate-400'}`}>ENG</button>
                <span className="text-slate-200">|</span>
                <button onClick={() => setLang('bn')} className={`text-sm font-bold ${lang === 'bn' ? 'text-emerald-600' : 'text-slate-400'}`}>BAN</button>
              </div>
              <div className="flex flex-col gap-2">
                <Button onClick={() => { setIsMenuOpen(false); navigate('/patient-login'); }} className="w-full">Patient Login</Button>
                <Button variant="secondary" onClick={() => { setIsMenuOpen(false); navigate('/patient-signup'); }} className="w-full">Register</Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- Hero Section --- */}
      <section id="home" className="pt-32 pb-20 lg:pt-48 lg:pb-32 px-4">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8 text-center lg:text-left">
            <div className="inline-block px-4 py-2 bg-blue-50 text-blue-700 rounded-full text-sm font-semibold border border-blue-100 shadow-sm animate-fade-in-up">
              {data.hero?.intro_tag || `👋 Welcome to ${data.website?.title || data.full_name}'s Profile`}
            </div>

            <h1 className="text-5xl lg:text-7xl font-bold leading-tight text-slate-900">
              {data.hero?.title_prefix || "Your Health,"} <br />
              <span className={`bg-gradient-to-r ${data.theme_color === '#2563eb' ? 'from-blue-600 to-indigo-600' : 'from-emerald-600 to-teal-600'} bg-clip-text text-transparent`}>
                {data.hero?.title_highlight || "Our Priority"}
              </span>
            </h1>

            <p className="text-xl text-slate-600 leading-relaxed max-w-2xl mx-auto lg:mx-0">
              {data.hero?.description || data.website?.description || "Providing comprehensive medical care with a patient-first approach."}
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start pt-4">
              <Button size="lg" icon={Calendar} onClick={() => setIsBookingModalOpen(true)}>{t.buttons.book}</Button>
              <Button size="lg" variant="secondary" icon={UserCircle} onClick={() => navigate('/patient-login')}>Patient Portal</Button>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-12 border-t border-slate-200/60 w-full">
              {[
                { label: t.labels.patients, value: data.stats?.patients_count || data.served_total_patients || "2000+", icon: Users, color: "text-blue-600 bg-blue-50" },
                { label: t.labels.experience, value: `${data.years_experience}+` || "5+", icon: Award, color: "text-emerald-600 bg-emerald-50" },
                { label: t.labels.success, value: data.stats?.success_rate || "98%", icon: TrendingUp, color: "text-purple-600 bg-purple-50" },
                { label: t.labels.fee, value: data.stats?.consultation_fee || "৳1000", icon: Activity, color: "text-amber-600 bg-amber-50" },
              ].map((stat, idx) => (
                <div key={idx} className="text-center group cursor-default">
                  <div className={`w-10 h-10 mx-auto rounded-lg flex items-center justify-center mb-3 ${stat.color} transition-transform group-hover:scale-110`}>
                    <stat.icon className="w-5 h-5" />
                  </div>
                  <div className="text-2xl font-bold text-slate-900">{stat.value}</div>
                  <div className="text-xs text-slate-500 font-medium uppercase tracking-wide mt-1">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Hero Image */}
          <div className="relative lg:h-[600px] flex items-center justify-center">
            <div className="absolute inset-0 bg-gradient-to-tr from-blue-200/20 to-emerald-200/20 rounded-full blur-3xl animate-pulse"></div>
            <Card className="relative w-full max-w-md bg-white p-3 rotate-3 hover:rotate-0 transition-transform duration-500 overflow-hidden" hover={false}>
              <div className="relative aspect-[4/5] overflow-hidden rounded-xl bg-slate-100">
                <img
                  src={getImageUrl(data.hero?.image_url)}
                  alt="Doctor"
                  className="w-full h-full object-cover"
                  onError={(e) => e.target.src = 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=800&auto=format&fit=crop'}
                />
                <div className="absolute bottom-4 left-4 right-4 bg-white/95 backdrop-blur rounded-xl p-4 shadow-lg border border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-emerald-500 rounded-full animate-ping"></div>
                    <span className="font-semibold text-slate-700 text-sm">{t.labels.available}</span>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* --- Schedule & Location Section --- */}
      {data.chambers?.length > 0 && (
        <section id="appointment" className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

              {/* Schedule Card */}
              <div className="lg:col-span-2 bg-gradient-to-br from-indigo-600 to-blue-700 rounded-3xl p-8 text-white shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16"></div>

                <div className="flex items-center mb-8 relative z-10">
                  <Clock className="w-8 h-8 mr-4 text-blue-200" />
                  <h2 className="text-2xl font-bold">{t.sections.schedule}</h2>
                </div>

                <div className="grid md:grid-cols-2 gap-4 relative z-10">
                  {data.chambers.map((chamber, idx) => (
                    <div key={idx} className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-5 hover:bg-white/20 transition-colors">
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-bold text-lg">{chamber.day || 'Daily'}</span>
                        <span className="bg-emerald-500/20 text-emerald-100 text-xs px-2 py-1 rounded-full border border-emerald-500/30">Open</span>
                      </div>
                      <div className="text-blue-100 mb-1">{chamber.available_time}</div>
                      <div className="text-xs text-indigo-200 flex items-center mt-2">
                        <MapPin className="w-3 h-3 mr-1" />
                        {chamber.chamber_location}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Location Card */}
              <Card className="bg-slate-50 border-0 flex flex-col justify-center p-8 h-full">
                <div className="w-12 h-12 bg-red-100 text-red-600 rounded-xl flex items-center justify-center mb-6">
                  <MapPin className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-4">{t.sections.location}</h3>
                <div className="prose text-slate-600 mb-6">
                  <p>{data.contact?.address || "Address details currently unavailable."}</p>
                </div>

                <div className="space-y-4">
                  <a href={`tel:${data.contact?.phone}`} className="flex items-center text-slate-700 hover:text-blue-600 transition-colors">
                    <Phone className="w-4 h-4 mr-3 text-slate-400" />
                    {data.contact?.phone}
                  </a>
                  <a href={`mailto:${data.contact?.email}`} className="flex items-center text-slate-700 hover:text-blue-600 transition-colors">
                    <Mail className="w-4 h-4 mr-3 text-slate-400" />
                    {data.contact?.email}
                  </a>
                </div>
              </Card>

            </div>
          </div>
        </section>
      )}

      {/* --- About / Bio Section --- */}
      <section id="about" className="py-24 bg-slate-50 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

            {/* Left Content */}
            <div>
              <span className="text-emerald-600 font-bold tracking-wider uppercase text-sm mb-2 block">{t.sections.meet} {data.full_name}</span>
              <h2 className="text-4xl font-bold text-slate-900 mb-6">{data.about?.subtitle || "Dedicated to medical excellence"}</h2>
              <div className="prose prose-lg text-slate-600 mb-8">
                <p>{data.about?.bio || "Dr. Jobayer Hasan is a highly skilled specialist..."}</p>
              </div>

              {/* Experience Timeline Preview */}
              {data.experience?.length > 0 && (
                <div className="space-y-6 mt-8">
                  {data.experience.slice(0, 2).map((exp, i) => (
                    <div key={i} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className="w-3 h-3 rounded-full bg-blue-600 mt-2"></div>
                        <div className="w-0.5 h-full bg-slate-200 mt-1"></div>
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 text-lg">{exp.designation}</div>
                        <div className="text-blue-600 font-medium">{exp.organization}</div>
                        <div className="text-sm text-slate-500 mt-1">
                          {exp.start_date ? new Date(exp.start_date).getFullYear() : ''} - {exp.end_date ? new Date(exp.end_date).getFullYear() : 'Present'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Right Images */}
            <div className="relative">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-4 pt-12">
                  <img
                    src={getImageUrl(data.about?.image_1) || 'https://images.unsplash.com/photo-1666214280557-f1b5022eb634?w=500&auto=format&fit=crop'}
                    onError={(e) => e.target.src = 'https://images.unsplash.com/photo-1666214280557-f1b5022eb634?w=500&auto=format&fit=crop'}
                    className="rounded-2xl shadow-lg w-full h-64 object-cover hover:scale-[1.02] transition-transform duration-500"
                    alt="About 1"
                  />
                  <div className="bg-blue-600 p-6 rounded-2xl text-white shadow-xl">
                    <div className="text-4xl font-bold mb-1">{data.education?.length || 5}+</div>
                    <div className="text-blue-100 text-sm font-medium">Certifications & Awards</div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="bg-emerald-500 p-6 rounded-2xl text-white shadow-xl">
                    <Award className="w-8 h-8 mb-3" />
                    <div className="font-bold text-lg">Top Rated</div>
                    <div className="text-emerald-100 text-xs">Patient Choice Award 2024</div>
                  </div>
                  <img
                    src={getImageUrl(data.about?.image_2) || 'https://images.unsplash.com/photo-1631217868264-e5b90bb7e133?w=500&auto=format&fit=crop'}
                    onError={(e) => e.target.src = 'https://images.unsplash.com/photo-1631217868264-e5b90bb7e133?w=500&auto=format&fit=crop'}
                    className="rounded-2xl shadow-lg w-full h-80 object-cover hover:scale-[1.02] transition-transform duration-500"
                    alt="About 2"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --- Education Section --- */}
      {data.education?.length > 0 && (
        <section className="py-24 bg-slate-50">
          <div className="max-w-5xl mx-auto px-4">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <span className="text-purple-600 font-bold tracking-wider uppercase text-sm mb-2 block">Academic Excellence</span>
              <h2 className="text-4xl font-bold text-slate-900 mb-4">Education & <span className="text-purple-600">Qualifications</span></h2>
              <p className="text-slate-600 text-lg">Comprehensive medical training from world-renowned institutions</p>
            </div>

            <div className="space-y-6">
              {data.education.map((edu, idx) => (
                <Card key={idx} className="p-8 hover:shadow-2xl transition-all duration-500">
                  <div className="flex gap-6">
                    <div className="flex flex-col items-center">
                      <div className="w-12 h-12 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center font-bold text-lg">
                        {edu.passing_year || '20XX'}
                      </div>
                      {idx < data.education.length - 1 && <div className="w-0.5 flex-grow bg-purple-200 mt-2"></div>}
                    </div>
                    <div className="flex-grow pb-8">
                      <h3 className="text-2xl font-bold text-slate-900 mb-2">{edu.degree}</h3>
                      <div className="text-purple-600 font-semibold mb-3 flex items-center">
                        <GraduationCap className="w-5 h-5 mr-2" />
                        {edu.institution}
                      </div>
                      {edu.short_description && (
                        <p className="text-slate-600 leading-relaxed">{edu.short_description}</p>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* --- Experience Section --- */}
      {data.experience?.length > 0 && (
        <section className="py-24 bg-white">
          <div className="max-w-5xl mx-auto px-4">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <span className="text-emerald-600 font-bold tracking-wider uppercase text-sm mb-2 block">Professional Journey</span>
              <h2 className="text-4xl font-bold text-slate-900 mb-4">Clinical <span className="text-emerald-600">Experience</span></h2>
              <p className="text-slate-600 text-lg">Proven track record of excellence in patient care and medical practice</p>
            </div>

            <div className="space-y-6">
              {data.experience.map((exp, idx) => (
                <Card key={idx} className="p-8 hover:shadow-2xl transition-all duration-500">
                  <div className="flex gap-6">
                    <div className="flex flex-col items-center">
                      <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                        <Briefcase className="w-6 h-6" />
                      </div>
                      {idx < data.experience.length - 1 && <div className="w-0.5 flex-grow bg-emerald-200 mt-2"></div>}
                    </div>
                    <div className="flex-grow pb-8">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="text-2xl font-bold text-slate-900">{exp.designation}</h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${exp.end_date ? 'bg-slate-200 text-slate-600' : 'bg-emerald-100 text-emerald-700'}`}>
                          {exp.end_date ? 'Previous' : 'Current'}
                        </span>
                      </div>
                      <div className="text-emerald-600 font-semibold mb-2 flex items-center">
                        <Building className="w-5 h-5 mr-2" />
                        {exp.organization}
                      </div>
                      <div className="text-sm text-slate-500 mb-3 flex items-center">
                        <Clock className="w-4 h-4 mr-2" />
                        {exp.start_date ? new Date(exp.start_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'Start'} - {exp.end_date ? new Date(exp.end_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'Present'}
                      </div>
                      {exp.short_description && (
                        <p className="text-slate-600 leading-relaxed">{exp.short_description}</p>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* --- Services Section --- */}
      {data.services?.length > 0 && (
        <section id="services" className="py-24 bg-slate-50 relative">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <span className="text-blue-600 font-bold tracking-wider uppercase text-sm mb-2 block">{t.sections.specialization}</span>
              <h2 className="text-4xl font-bold text-slate-900 mb-4">Comprehensive <span className="text-blue-600">Care Services</span></h2>
              <p className="text-slate-600 text-lg">Detailed attention to your health needs with state-of-the-art facilities.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {data.services.map((service, idx) => {
                const Icon = getIconComponent(service.service_icon);
                const theme = service.color_theme || 'from-blue-500 to-cyan-500';
                // Extract default color for icon background from the gradient string (simplified)
                const bgClass = theme.includes('red') ? 'bg-red-50 text-red-600' : theme.includes('emerald') ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600';

                return (
                  <Card key={idx} className="group hover:-translate-y-2 h-full flex flex-col p-8 bg-white border-slate-100">
                    <div className={`w-14 h-14 rounded-2xl ${bgClass} flex items-center justify-center mb-6 transition-all group-hover:scale-110`}>
                      <Icon className="w-7 h-7" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-3 group-hover:text-blue-600 transition-colors">{service.service_name}</h3>
                    <p className="text-slate-600 mb-6 flex-grow leading-relaxed">{service.service_description}</p>
                    {service.features && (
                      <ul className="space-y-2 pt-4 border-t border-slate-100">
                        {service.features.split(',').slice(0, 3).map((feat, i) => (
                          <li key={i} className="flex items-center text-sm text-slate-500">
                            <CheckCircle className="w-4 h-4 text-emerald-500 mr-2 flex-shrink-0" />
                            {feat.trim()}
                          </li>
                        ))}
                      </ul>
                    )}
                  </Card>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* --- Blogs Section --- */}
      {data.blogs?.length > 0 && (
        <section className="py-24 bg-slate-50">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <span className="text-blue-600 font-bold tracking-wider uppercase text-sm mb-2 block">Latest Insights</span>
              <h2 className="text-4xl font-bold text-slate-900 mb-4">
                Recent <span className="text-blue-600">Blog Posts</span>
              </h2>
              <p className="text-slate-600 text-lg">Expert medical insights and health tips from our practice</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {data.blogs.slice(0, 6).map((blog) => (
                <div
                  key={blog.id}
                  className="bg-white rounded-2xl shadow-md overflow-hidden hover:shadow-2xl transition-all duration-500 cursor-pointer group"
                  onClick={() => navigate(`/blog/${blog.slug}`)}
                >
                  {/* Featured Image */}
                  <div className="relative h-48 bg-gradient-to-br from-blue-100 to-slate-100 overflow-hidden">
                    {blog.featured_image ? (
                      <img
                        src={getImageUrl(blog.featured_image)}
                        alt={blog.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        onError={(e) => e.target.src = 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=500&auto=format&fit=crop'}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <FileText className="w-16 h-16 text-blue-300" />
                      </div>
                    )}
                    {blog.category && (
                      <div className="absolute top-4 left-4">
                        <span className="px-3 py-1 bg-blue-600 text-white text-xs font-bold rounded-full">
                          {blog.category}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-slate-900 mb-3 line-clamp-2 group-hover:text-blue-600 transition-colors">
                      {blog.title}
                    </h3>
                    <p className="text-slate-600 text-sm mb-4 line-clamp-3">
                      {blog.excerpt || 'Read more about this topic...'}
                    </p>

                    {/* Meta Info */}
                    <div className="flex items-center justify-between text-xs text-slate-500 pt-4 border-t border-slate-100">
                      <div className="flex items-center gap-4">
                        {blog.published_at && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(blog.published_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                        )}
                        {blog.read_time > 0 && (
                          <span>{blog.read_time} min read</span>
                        )}
                      </div>
                      <ArrowRight className="w-4 h-4 text-blue-600 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* View All Button */}
            {data.blogs.length > 6 && (
              <div className="text-center mt-12">
                <button className="px-8 py-3 bg-blue-600 text-white font-bold rounded-full hover:bg-blue-700 transition-colors shadow-lg hover:shadow-xl">
                  View All Articles
                </button>
              </div>
            )}
          </div>
        </section>
      )}

      {/* --- Testimonials Section --- */}
      {data.testimonials?.length > 0 && (
        <section className="py-24 bg-gradient-to-b from-slate-50 to-white">
          <div className="max-w-5xl mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold text-slate-900 mb-12">{t.sections.testimonials}</h2>

            <div className="relative bg-white rounded-3xl shadow-xl p-8 md:p-12">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-amber-500 text-white p-3 rounded-full shadow-lg">
                <Star className="w-8 h-8 fill-current" />
              </div>

              <div className="mt-6 mb-8">
                <p className="text-xl md:text-2xl text-slate-600 italic leading-relaxed">
                  "{data.testimonials[currentTestimonial].message}"
                </p>
              </div>

              <div className="flex items-center justify-center gap-4">
                <img
                  src={getImageUrl(data.testimonials[currentTestimonial].avatar)}
                  onError={(e) => e.target.src = 'https://ui-avatars.com/api/?name=' + data.testimonials[currentTestimonial].name}
                  alt="Patient"
                  className="w-14 h-14 rounded-full object-cover border-2 border-slate-100"
                />
                <div className="text-left">
                  <div className="font-bold text-slate-900">{data.testimonials[currentTestimonial].name}</div>
                  <div className="text-slate-500 text-sm flex items-center">
                    <MapPin className="w-3 h-3 mr-1" />
                    {data.testimonials[currentTestimonial].location || 'Patient'}
                  </div>
                </div>
              </div>

              {/* Dots */}
              <div className="flex justify-center mt-8 gap-2">
                {data.testimonials.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentTestimonial(idx)}
                    className={`w-2.5 h-2.5 rounded-full transition-all ${idx === currentTestimonial ? 'bg-amber-500 w-6' : 'bg-slate-300'}`}
                  />
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* --- Affiliates Section --- */}
      {data.affiliates?.length > 0 && (
        <section className="py-12 border-t border-slate-100">
          <div className="max-w-7xl mx-auto px-4 text-center">
            <p className="text-slate-400 font-semibold uppercase tracking-widest text-xs mb-8">{t.sections.affiliates}</p>
            <div className="flex flex-wrap justify-center items-center gap-6 md:gap-10">
              {data.affiliates.map((aff, i) => (
                <div key={i} className="flex items-center gap-3 px-6 py-3 bg-white rounded-2xl border border-slate-100 hover:border-blue-200 hover:shadow-lg hover:shadow-blue-500/5 transition-all duration-300 group opacity-70 hover:opacity-100 relative">
                  {aff.logo && (
                    <img
                      src={getImageUrl(aff.logo)}
                      alt={aff.name}
                      className="h-8 md:h-10 w-auto object-contain grayscale group-hover:grayscale-0 transition-all duration-300 logo-img"
                      onError={(e) => {
                        e.target.classList.add('hidden');
                        const fallback = e.target.parentElement.querySelector('.logo-fallback');
                        if (fallback) fallback.classList.replace('hidden', 'flex');
                      }}
                    />
                  )}
                  <div className={`logo-fallback ${aff.logo ? 'hidden group-hover:flex' : 'flex'} items-center gap-2 transition-all duration-300`}>
                    <Shield className="w-5 h-5 text-slate-400 group-hover:text-blue-500 transition-colors" />
                    <span className="font-bold text-slate-400 group-hover:text-slate-700 transition-colors text-sm whitespace-nowrap">{aff.name}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* --- Footer --- */}
      <footer className="bg-slate-900 text-slate-400 py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div className="col-span-1 md:col-span-2">
              <h2 className="text-white text-2xl font-bold mb-4">{data.full_name}</h2>
              <p className="max-w-sm mb-6">{data.website?.description}</p>
              <div className="flex gap-4">
                {data.social_media?.map((social, i) => {
                  const Icon = getSocialIcon(social.platform);
                  return (
                    <a key={i} href={social.profile_url} target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center hover:bg-blue-600 hover:text-white transition-colors">
                      <Icon className="w-5 h-5" />
                    </a>
                  )
                })}
              </div>
            </div>
            <div>
              <h3 className="text-white font-bold mb-4">Quick Links</h3>
              <ul className="space-y-2">
                {['Home', 'Services', 'Appointment', 'About'].map(item => (
                  <li key={item}><a href={`#${item.toLowerCase()}`} className="hover:text-white transition-colors">{item}</a></li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-white font-bold mb-4">Contact</h3>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start"><MapPin className="w-4 h-4 mr-2 mt-1 flex-shrink-0" /> {data.contact?.address}</li>
                <li className="flex items-center"><Phone className="w-4 h-4 mr-2 flex-shrink-0" /> {data.contact?.phone}</li>
                <li className="flex items-center"><Mail className="w-4 h-4 mr-2 flex-shrink-0" /> {data.contact?.email}</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-800 pt-8 text-center text-sm">
            &copy; {new Date().getFullYear()} {data.full_name}. {t.sections.footer} Powered by CareConnect.
          </div>
        </div>
      </footer>

      <BookingModal />

    </div>
  );
};

export default PublicWebsite;
