import React, { useState, useEffect, useRef } from 'react';
import {
  Save, Edit3, Briefcase, Award, Upload, MapPin, User, Globe, Facebook, Twitter, Instagram, Linkedin, Youtube,
  Plus, Trash2, CheckCircle, AlertCircle, Phone, Mail, Link as LinkIcon, Building, GraduationCap, Stethoscope,
  Clock, Shield, Sparkles, Languages, X, Search, ChevronDown, Star, Layout, Users, TrendingUp, Zap, Heart,
  // Medical Icons
  Activity, Thermometer, Pill, Syringe, Brain, Eye, Ear, Bone, Baby, UserPlus, Microscope,
  FileText, Calendar, Cross, Smile, Droplet, UserCheck, Timer, Video, MessageSquare, Clipboard
} from 'lucide-react';
import { useDoctor, authenticatedFetch } from '../../hooks/useDoctor';
import { useAuth } from '../../contexts/AuthContext';
import { API_URLS, getImageUrl } from '../../config/api';

// --- Constants & Data ---

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

const COLOR_THEMES = [
  { label: 'Red / Pink', value: 'from-red-500 to-pink-500', color: 'bg-red-500' },
  { label: 'Blue / Cyan', value: 'from-blue-500 to-cyan-500', color: 'bg-blue-500' },
  { label: 'Green / Emerald', value: 'from-green-500 to-emerald-500', color: 'bg-green-500' },
  { label: 'Purple / Violet', value: 'from-purple-500 to-violet-500', color: 'bg-purple-500' },
  { label: 'Orange / Yellow', value: 'from-orange-500 to-yellow-500', color: 'bg-orange-500' },
  { label: 'Indigo / Blue', value: 'from-indigo-500 to-blue-500', color: 'bg-indigo-500' },
];

const TRANSLATIONS = {
  en: {
    pageTitle: "Public website configuration",
    pageSubtitle: "Manage your professional online presence and patient-facing content",
    saveChanges: "Publish changes",
    saving: "Publishing...",
    basicInfo: "Basic information",
    basicInfoSub: "Primary details visible on your public profile",
    heroSection: "Hero & welcome",
    heroSectionSub: "First impression banner and main headlines",
    statsSection: "Key statistics",
    statsSectionSub: "Impact numbers shown on the website",
    websiteConfig: "Website configuration",
    websiteConfigSub: "SEO, display settings, and branding",
    education: "Education & qualifications",
    educationSub: "Academic background and certifications",
    experience: "Clinical experience",
    experienceSub: "Professional history and hospital affiliations",
    services: "Services & specialties",
    servicesSub: "Treatments and procedures you offer",
    chambers: "Chamber locations",
    chambersSub: "Physical practice locations and visiting hours",
    testimonials: "Patient stories",
    testimonialsSub: "Success stories and reviews",
    affiliates: "Affiliations & partners",
    affiliatesSub: "Organizations you work with",
    social: "Social connections",
    socialSub: "Professional network links",
    addNew: "Add new",
    noEntries: "No entries found",
    uploadImage: "Profile image",
    uploadHint: "Recommended: 400x400px",
    aiAssist: "AI Assist",
    labels: {
      fullName: "Full name",
      experience: "Clinical experience (years)",
      profileUrl: "Profile image URL",
      pageTitle: "Page title",
      tagline: "Professional tagline",
      metaDesc: "Meta description",
      degree: "Degree / certification",
      institution: "Institution",
      year: "Year",
      details: "Details",
      role: "Role",
      organization: "Hospital / organization",
      startDate: "Start date",
      endDate: "End date",
      serviceName: "Service name",
      icon: "Icon",
      description: "Description",
      address: "Location address",
      visitingHours: "Visiting hours",
      platformUrl: "Profile URL",
      heroPrefix: "Title prefix (e.g., 'Your heart,')",
      heroHighlight: "Title highlight (e.g., 'our expertise')",
      heroTag: "Intro tag",
      heroDesc: "Welcome text",
      heroImage: "Hero image URL",
      patientCount: "Patients treated",
      successRate: "Success rate",
      consultFee: "Consultation fee",
      features: "Features (comma separated)",
      color: "Card theme",
      type: "Type / category",
      patientName: "Patient name",
      location: "Location",
      rating: "Rating (1-5)",
      message: "Testimonial message",
      affiliateName: "Organization name",
      affiliateLogo: "Logo / initials"
    }
  },
  bn: {
    pageTitle: "পাবলিক ওয়েবসাইট কনফিগারেশন",
    pageSubtitle: "আপনার পেশাদার অনলাইন উপস্থিতি এবং রোগীর বিষয়বস্তু পরিচালনা করুন",
    saveChanges: "পরিবর্তন প্রকাশ করুন",
    saving: "প্রকাশ করা হচ্ছে...",
    basicInfo: "মৌলিক তথ্য",
    basicInfoSub: "আপনার পাবলিক প্রোফাইলে দৃশ্যমান প্রাথমিক বিবরণ",
    heroSection: "হিরো এবং স্বাগতম",
    heroSectionSub: "প্রথম দর্শনের ব্যানার এবং প্রধান শিরোনাম",
    statsSection: "মূল পরিসংখ্যান",
    statsSectionSub: "ওয়েবসাইটে প্রদর্শিত প্রভাব সংখ্যা",
    websiteConfig: "ওয়েবসাইট কনফিগারেশন",
    websiteConfigSub: "এসইও, প্রদর্শন সেটিংস এবং ব্র্যান্ডিং",
    education: "শিক্ষা এবং যোগ্যতা",
    educationSub: "একাডেমিক পটভূমি এবং সার্টিফিকেশন",
    experience: "ক্লিনিকাল অভিজ্ঞতা",
    experienceSub: "পেশাগত ইতিহাস এবং হাসপাতালের সংযুক্তি",
    services: "সেবা এবং বিশেষত্ব",
    servicesSub: "আপনি যে চিকিৎসা এবং পদ্ধতিগুলি অফার করেন",
    chambers: "চেম্বার অবস্থান",
    chambersSub: "শারীরিক অনুশীলনের অবস্থান এবং দেখার সময়",
    testimonials: "রোগীর গল্প",
    testimonialsSub: "সাফল্যের গল্প এবং পর্যালোচনা",
    affiliates: "অধিভুক্তি এবং অংশীদার",
    affiliatesSub: "আপনি যাদের সাথে কাজ করেন এমন সংস্থা",
    social: "সামাজিক সংযোগ",
    socialSub: "পেশাদার নেটওয়ার্ক লিঙ্ক",
    addNew: "নতুন যোগ করুন",
    noEntries: "কোন এন্ট্রি পাওয়া যায়নি",
    uploadImage: "প্রোফাইল ছবি",
    uploadHint: "প্রস্তাবিত: ৪০০x৪০০ পিক্সেল",
    aiAssist: "এআই সহায়তা",
    labels: {
      fullName: "পুরো নাম",
      experience: "ক্লিনিকাল অভিজ্ঞতা (বছর)",
      profileUrl: "প্রোফাইল ছবির ইউআরএল",
      pageTitle: "পৃষ্ঠার শিরোনাম",
      tagline: "পেশাদার ট্যাগলাইন",
      metaDesc: "মেটা বিবরণ",
      degree: "ডিগ্রি / সার্টিফিকেশন",
      institution: "প্রতিষ্ঠান",
      year: "বছর",
      details: "বিবরণ",
      role: "ভূমিকা",
      organization: "হাসপাতাল / সংস্থা",
      startDate: "শুরুর তারিখ",
      endDate: "শেষ তারিখ",
      serviceName: "সেবার নাম",
      icon: "আইকন",
      description: "বিবরণ",
      address: "অবস্থান ঠিকানা",
      visitingHours: "ভিজিটিং আওয়ারস",
      platformUrl: "প্রোফাইল ইউআরএল",
      heroPrefix: "শিরোনাম প্রিফিক্স",
      heroHighlight: "শিরোনাম হাইলাইট",
      heroTag: "ইন্ট্রো ট্যাগ",
      heroDesc: "স্বাগতম টেক্সট",
      heroImage: "হিরো ছবির ইউআরএল",
      patientCount: "রোগী চিকিৎসা",
      successRate: "সাফল্যের হার",
      consultFee: "পরামর্শ ফি",
      features: "বৈশিষ্ট্য (কমা দ্বারা পৃথক)",
      color: "কার্ড থিম",
      type: "ধরন / বিভাগ",
      patientName: "রোগীর নাম",
      location: "অবস্থান",
      rating: "রেটিং (১-৫)",
      message: "প্রশংসাপত্র বার্তা",
      affiliateName: "সংস্থার নাম",
      affiliateLogo: "লোগো / আদ্যক্ষর"
    }
  }
};

const AI_PROMPTS = {
  bio: [
    "Experienced specialist dedicated to providing comprehensive care with a focus on patient well-being.",
    "Committed to excellence in medical practice, utilizing the latest advancements in technology and treatment protocols.",
    "Passionate about preventive care and educating patients to lead healthier, more fulfilling lives."
  ],
  service: {
    default: "Comprehensive diagnosis and treatment utilizing state-of-the-art medical protocols.",
    cardio: "Advanced cardiac care including diagnostics, monitoring, and interventional procedures.",
    dental: "Complete oral health services from routine cleanings to complex restorative surgeries.",
    neuro: "Specialized care for disorders of the nervous system, brain, and spinal cord."
  }
};

// --- Components ---

const IconPicker = ({ selected, onSelect, onClose }) => {
  const [searchTerm, setSearchTerm] = useState('');

  // Flatten icons for searching
  const allIcons = Object.entries(SUPPORTED_ICONS).flatMap(([category, icons]) =>
    Object.entries(icons).map(([name, Icon]) => ({ category, name, Icon }))
  );

  const filteredIcons = allIcons.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="absolute top-10 left-0 z-50 w-64 bg-white dark:bg-card border border-border rounded-xl shadow-xl p-3 animate-in fade-in zoom-in duration-200">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-[10px] font-semibold text-muted-foreground ml-1">Select icon</h4>
        <button onClick={onClose} className="hover:bg-muted p-1 rounded-full"><X className="h-3.5 w-3.5" /></button>
      </div>
      <div className="relative mb-2">
        <Search className="h-3 w-3 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search icons..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="w-full pl-7 pr-2 py-1.5 text-[11px] bg-muted/30 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/10"
        />
      </div>
      <div className="grid grid-cols-5 gap-2 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
        {filteredIcons.map(({ name, Icon }) => (
          <button
            key={name}
            onClick={() => onSelect(name)}
            className={`p-2 rounded-lg flex items-center justify-center transition-all ${selected === name ? 'bg-indigo-500 text-white' : 'hover:bg-muted text-muted-foreground hover:text-foreground'}`}
            title={name}
          >
            <Icon className="h-5 w-5" />
          </button>
        ))}
      </div>
    </div>
  );
};

const PublicWebsiteTab = () => {
  const { doctorId } = useDoctor();
  const { refreshUser } = useAuth();
  const actualDoctorId = doctorId || 1;

  // State
  const [lang, setLang] = useState('en');
  const t = TRANSLATIONS[lang];
  const [activeIconPicker, setActiveIconPicker] = useState(null);
  const [expandedItems, setExpandedItems] = useState([]);

  const [formData, setFormData] = useState({
    full_name: "Dr. Jobayer Hasan",
    profile_photo_url: "https://media.istockphoto.com/id/906716900/photo/confident-male-surgeon-in-scrubs.jpg?s=612x612&w=0&k=20&c=G03yZ-lkdN0pwMbv4Mv-P_WIPNMWhbL2sn3tlpJleMU=",
    active_status: true,
    years_experience: 15,
    chamber: [],
    services: [],
    education: [],
    experience: [],
    testimonials: [],
    affiliates: [],
    hero: {
      title_prefix: "Your Heart,",
      title_highlight: "Our Expertise",
      intro_tag: "🏥 Expert Cardiac Care Since 2007",
      description: "Experience world-class cardiovascular care with advanced treatments, compassionate expertise, and cutting-edge technology.",
      image_url: "https://media.istockphoto.com/id/2201754823/photo/female-physician-explaining-medical-findings-to-older-woman-with-stomach-discomfort-listening.jpg?s=612x612&w=0&k=20&c=BZxNzQuqWTolKHBoQV0V8oOZpDl5PWKlCVe2DDc-ps0="
    },
    stats: {
      patients_count: "5000+",
      success_rate: "98%",
      consultation_fee: "৳1500"
    },
    sponsors_company: {},
    contact: {
      phone: "+880 1717-123456", whatsapp: "", email: "dr.rahman@careconnect.bd", address: "BTI Landmark, Gulshan-1", office_phone: "",
      website_url: "", emergency_contact_name: "", emergency_contact_phone: "+880 1717-123456", fax: ""
    },
    social_media: [],
    about: {
      subtitle: "A distinguished cardiologist with over 15 years of experience",
      bio: "Leading cardiovascular care excellence with advanced procedures and multidisciplinary team coordination.",
      image_1: "https://images.unsplash.com/photo-1656428964836-78d54bf76231?w=600&auto=format&fit=crop",
      image_2: "https://media.istockphoto.com/id/1185231735/photo/asian-scientist-use-microscope.webp?a=1&b=1&s=612x612&w=0&k=20"
    },
    website: {
      title: "Dr. Jobayer Hasan - Cardiology", tagline: "Consultant Cardiologist", description: "Expert cardiac care...", theme_color: "#2563eb",
      layout_style: "modern", show_phone: true, show_email: true,
      show_address: true, show_appointment: true, show_social: true,
      meta_keywords: "cardiology, heart, health", url_slug: "dr-jobayer-hasan", visibility: true
    }
  });

  const [loading, setLoading] = useState(true);
  const [saveLoading, setSaveLoading] = useState(false);
  const [notification, setNotification] = useState(null);

  // AI Helper
  const generateAIContent = (type, keywords = "") => {
    if (type === 'bio') {
      const randomIndex = Math.floor(Math.random() * AI_PROMPTS.bio.length);
      return AI_PROMPTS.bio[randomIndex];
    } else if (type === 'service') {
      const lowerKey = keywords.toLowerCase();
      if (lowerKey.includes('heart') || lowerKey.includes('cardio')) return AI_PROMPTS.service.cardio;
      if (lowerKey.includes('tooth') || lowerKey.includes('dental')) return AI_PROMPTS.service.dental;
      if (lowerKey.includes('brain') || lowerKey.includes('neuro')) return AI_PROMPTS.service.neuro;
      return AI_PROMPTS.service.default;
    }
    return "Generated professional content aimed at enhancing patient trust and clarity.";
  };

  const handleAIGenerate = (field, context = "", setter) => {
    showNotification("Generating content with AI...", "info");
    setTimeout(() => {
      const content = generateAIContent(field, context);
      setter(content);
      showNotification("Content generated!", "success");
    }, 800);
  };

  useEffect(() => {
    loadDoctorData();
  }, [actualDoctorId]);

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const formatDateForInput = (dateString) => {
    if (!dateString) return '';
    try {
      return new Date(dateString).toISOString().split('T')[0];
    } catch {
      return '';
    }
  };

  const loadDoctorData = async () => {
    if (!actualDoctorId) return;
    setLoading(true);
    try {
      const response = await authenticatedFetch(API_URLS.WEBSITE.PROFILE(actualDoctorId));
      if (response.ok) {
        const responseData = await response.json();
        const apiData = responseData.data || responseData;

        // Merge with default/existing structure to ensure new fields (Hero, Stats) exist if API doesn't return them yet
        setFormData(prev => ({
          ...prev,
          full_name: `${apiData.first_name || ''} ${apiData.last_name || ''}`.trim() || prev.full_name,
          profile_photo_url: getImageUrl(apiData.profile_image_url) || prev.profile_photo_url,
          active_status: apiData.active_status ?? prev.active_status,
          years_experience: parseInt(apiData.years_of_experience) || prev.years_experience,
          chamber: apiData.chambers || [],
          // Ensure arrays have correct structure
          services: (apiData.services || []).map(s => ({ ...s, features: s.features || '', color_theme: s.color_theme || 'from-blue-500 to-cyan-500' })),
          education: (apiData.education || []).map(edu => ({ ...edu, passing_year: edu.passing_year || '', type: edu.type || 'certification' })),
          experience: (apiData.experience || []).map(exp => ({
            ...exp,
            start_date: formatDateForInput(exp.start_date),
            end_date: formatDateForInput(exp.end_date),
            type: exp.type || 'current'
          })),
          // Map backend fields to frontend state shape
          testimonials: (apiData.testimonials || []).map(t => ({
            id: t.id,
            name: t.patient_name || '',
            message: t.patient_feedback || '',
            rating: t.rating || 5,
            location: t.location || '',
            avatar: t.avatar_url || ''
          })),
          affiliates: (apiData.affiliates || []).map(a => ({
            id: a.id,
            name: a.organization_name || '',
            logo: a.organization_logo || ''
          })),
          social_media: (apiData.social_media || []).map(s => ({
            id: s.id,
            platform: s.platform || '',
            profile_url: s.profile_url || ''
          })),
          // Custom objects might not exist on backend yet, so fallback to prev
          hero: apiData.hero || prev.hero,
          about: apiData.about || prev.about,
          stats: apiData.stats || prev.stats,
          contact: { ...prev.contact, ...apiData.contact },
          website: { ...prev.website, ...apiData.website }
        }));
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!actualDoctorId) return;
    setSaveLoading(true);
    try {
      const profileData = {
        full_name: formData.full_name,
        profile_photo_url: formData.profile_photo_url,
        active_status: formData.active_status,
        years_experience: formData.years_experience,
        website: formData.website,
        hero: formData.hero, // Send new fields
        about: formData.about,
        stats: formData.stats,
        testimonials: formData.testimonials, // Send arrays
        affiliates: formData.affiliates
      };

      await authenticatedFetch(API_URLS.WEBSITE.PROFILE(actualDoctorId), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileData)
      });

      // Save sub-collections
      await Promise.all([
        saveSection(formData.education, API_URLS.WEBSITE.EDUCATION),
        saveSection(formData.experience, API_URLS.WEBSITE.EXPERIENCE),
        saveSection(formData.services, API_URLS.WEBSITE.SERVICES),
        saveSection(formData.chamber, API_URLS.WEBSITE.CHAMBERS),
        authenticatedFetch(API_URLS.WEBSITE.SOCIAL_MEDIA.UPDATE(actualDoctorId), {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData.social_media)
        }),
        authenticatedFetch(API_URLS.WEBSITE.CONTACT.UPDATE(actualDoctorId), {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData.contact)
        })
      ]);

      showNotification('Website profile updated successfully!');
      if (refreshUser) await refreshUser();
      // Do not reload to avoid overwriting optimistic updates if backend lags
      // await loadDoctorData(); 
    } catch (error) {
      showNotification('Error saving profile: ' + error.message, 'error');
    } finally {
      setSaveLoading(false);
    }
  };

  const saveSection = async (items, endpoints) => {
    for (const item of items) {
      if (item.id) {
        await authenticatedFetch(endpoints.UPDATE(actualDoctorId, item.id), {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(item)
        });
      } else {
        await authenticatedFetch(endpoints.ADD(actualDoctorId), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(item)
        });
      }
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleNestedChange = (parent, field, value) => {
    setFormData(prev => ({ ...prev, [parent]: { ...prev[parent], [field]: value } }));
  };

  const handleArrayInputChange = (section, index, field, value) => {
    setFormData(prev => ({
      ...prev,
      [section]: prev[section].map((item, i) => i === index ? { ...item, [field]: value } : item)
    }));
  };

  const addArrayItem = (section) => {
    const templates = {
      chamber: { chamber_location: "", day: "Sunday", time_range: "09:00 AM - 05:00 PM" },
      services: { service_icon: "Activity", service_name: "", service_description: "", features: "", color_theme: "from-blue-500 to-cyan-500" },
      education: { degree: "", institution: "", passing_year: "", short_description: "", type: "certification" },
      experience: { designation: "", organization: "", start_date: "", end_date: "", short_description: "", type: "current" },
      testimonials: { name: "", message: "", rating: 5, location: "", avatar: "" },
      affiliates: { name: "", logo: "PA" },
      social_media: { platform: "LinkedIn", profile_url: "" }
    };
    setFormData(prev => ({ ...prev, [section]: [...prev[section], templates[section]] }));
  };

  const removeArrayItem = async (section, index) => {
    const item = formData[section][index];
    if (item.id) {
      try {
        const endpoints = {
          education: API_URLS.WEBSITE.EDUCATION.DELETE,
          experience: API_URLS.WEBSITE.EXPERIENCE.DELETE,
          services: API_URLS.WEBSITE.SERVICES.DELETE,
          chamber: API_URLS.WEBSITE.CHAMBERS.DELETE
        };
        // Only specific sections have endpoints for deletion, others might be saved as blob in profile
        if (endpoints[section]) {
          await authenticatedFetch(endpoints[section](actualDoctorId, item.id), { method: 'DELETE' });
        }
      } catch (error) {
        showNotification(`Error deleting item: ${error.message}`, 'error');
        return;
      }
    }
    setFormData(prev => ({ ...prev, [section]: prev[section].filter((_, i) => i !== index) }));
  };

  const getDynamicIcon = (name) => {
    const allIcons = Object.values(SUPPORTED_ICONS).reduce((acc, curr) => ({ ...acc, ...curr }), {});
    const IconComponent = allIcons[name] || Activity;
    return <IconComponent className="h-5 w-5" />;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-[11px] font-semibold text-muted-foreground animate-pulse">Loading public profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10 pb-10">
      {/* Notification Toast */}
      {notification && (
        <div className={`fixed top-4 right-4 px-4 py-3 rounded-xl shadow-xl z-50 flex items-center gap-2.5 backdrop-blur-xl animate-in slide-in-from-right-10 duration-300 ${notification.type === 'error' ? 'bg-red-500/10 border border-red-500/10 text-red-600' : 'bg-emerald-500/10 border border-emerald-500/10 text-emerald-600'
          }`}>
          {notification.type === 'error' ? <AlertCircle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
          <span className="text-[10px] font-semibold">{notification.message}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 sticky top-0 bg-background/80 backdrop-blur-xl z-40 py-3 -mx-6 px-6 border-b border-border/40 transition-all">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-500/10 rounded-xl">
            <Globe className="h-5 w-5 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-xl lg:text-2xl font-bold text-foreground tracking-tight">{t.pageTitle}</h1>
            <p className="text-muted-foreground text-[10px] font-medium mt-0.5">{t.pageSubtitle}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-muted/30 p-1 rounded-lg border border-border">
            <button onClick={() => setLang('en')} className={`px-2.5 py-1 rounded-md text-[10px] font-semibold transition-all ${lang === 'en' ? 'bg-white shadow-sm text-foreground' : 'text-muted-foreground hover:bg-white/50'}`}>EN</button>
            <button onClick={() => setLang('bn')} className={`px-2.5 py-1 rounded-md text-[10px] font-semibold transition-all ${lang === 'bn' ? 'bg-white shadow-sm text-foreground' : 'text-muted-foreground hover:bg-white/50'}`}>BN</button>
          </div>
          <button onClick={handleSave} disabled={saveLoading} className="bg-indigo-600 text-white px-5 py-2 rounded-xl font-bold text-[11px] hover:bg-indigo-700 shadow-md shadow-indigo-500/20 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2">
            {saveLoading ? <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <Save className="h-3.5 w-3.5" />} {t.saveChanges}
          </button>
        </div>
      </div>

      {/* Hero Section */}
      <section className="bg-card/30 backdrop-blur-3xl border border-border/60 rounded-2xl p-6 md:p-8 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-blue-500/10 rounded-xl"><Layout className="h-5 w-5 text-blue-600" /></div>
          <div>
            <h2 className="text-lg font-bold text-foreground tracking-tight">{t.heroSection}</h2>
            <p className="text-[10px] text-muted-foreground font-medium mt-0.5">{t.heroSectionSub}</p>
          </div>
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-semibold text-muted-foreground ml-0.5">{t.labels.heroTag}</label>
              <input type="text" value={formData.hero.intro_tag} onChange={(e) => handleNestedChange('hero', 'intro_tag', e.target.value)} className="w-full px-4 py-2 bg-muted/20 border border-border rounded-xl focus:ring-1 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-[13px] font-medium transition-all" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-semibold text-muted-foreground ml-0.5">{t.labels.heroPrefix}</label>
                <input type="text" value={formData.hero.title_prefix} onChange={(e) => handleNestedChange('hero', 'title_prefix', e.target.value)} className="w-full px-4 py-2 bg-muted/20 border border-border rounded-xl focus:ring-1 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-[13px] font-medium transition-all" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-semibold text-muted-foreground ml-0.5">{t.labels.heroHighlight}</label>
                <input type="text" value={formData.hero.title_highlight} onChange={(e) => handleNestedChange('hero', 'title_highlight', e.target.value)} className="w-full px-4 py-2 bg-muted/20 border border-border rounded-xl focus:ring-1 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-[13px] font-bold text-blue-600 transition-all" />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between px-0.5">
                <label className="text-[10px] font-semibold text-muted-foreground">{t.labels.heroDesc}</label>
                <button onClick={() => handleAIGenerate('bio', 'welcome', (v) => handleNestedChange('hero', 'description', v))} className="flex items-center gap-1.5 text-[10px] font-bold text-indigo-500 hover:text-indigo-600"><Sparkles className="h-3 w-3" /> {t.aiAssist}</button>
              </div>
              <textarea value={formData.hero.description} onChange={(e) => handleNestedChange('hero', 'description', e.target.value)} rows={3} className="w-full px-4 py-3 bg-muted/20 border border-border rounded-xl focus:ring-1 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-[13px] font-medium transition-all resize-none" />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-semibold text-muted-foreground ml-0.5">{t.labels.heroImage}</label>
            <div className="relative group rounded-xl overflow-hidden border-2 border-muted aspect-[5/3] bg-muted/10">
              <img src={formData.hero.image_url} className="w-full h-full object-cover" alt="Hero" />
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity p-4">
                <input type="text" value={formData.hero.image_url} onChange={(e) => handleNestedChange('hero', 'image_url', e.target.value)} className="w-full px-3 py-1.5 bg-white/95 rounded-lg text-[11px] font-medium shadow-lg" placeholder="Enter image URL" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About Section Configuration */}
      <section className="bg-card/30 backdrop-blur-3xl border border-border/60 rounded-2xl p-6 md:p-8 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-emerald-500/10 rounded-xl"><UserCheck className="h-5 w-5 text-emerald-600" /></div>
          <div>
            <h2 className="text-lg font-bold text-foreground tracking-tight">About me configuration</h2>
            <p className="text-[10px] text-muted-foreground font-medium mt-0.5">Professional bio and feature images</p>
          </div>
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-semibold text-muted-foreground ml-0.5">Profile subtitle</label>
              <input type="text" value={formData.about.subtitle} onChange={(e) => handleNestedChange('about', 'subtitle', e.target.value)} className="w-full px-4 py-2 bg-muted/20 border border-border rounded-xl font-medium text-[13px]" placeholder="E.g., A distinguished cardiologist..." />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between px-0.5">
                <label className="text-[10px] font-semibold text-muted-foreground">Professional bio</label>
                <button onClick={() => handleAIGenerate('bio', 'about', (v) => handleNestedChange('about', 'bio', v))} className="flex items-center gap-1.5 text-[10px] font-bold text-indigo-500 hover:text-indigo-600"><Sparkles className="h-3 w-3" /> {t.aiAssist}</button>
              </div>
              <textarea value={formData.about.bio} onChange={(e) => handleNestedChange('about', 'bio', e.target.value)} rows={4} className="w-full px-4 py-3 bg-muted/20 border border-border rounded-xl focus:ring-1 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none text-[13px] font-medium transition-all resize-none" />
            </div>
          </div>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-semibold text-muted-foreground ml-0.5">Feature image 1 (technology)</label>
              <div className="flex gap-3 items-center">
                <img src={formData.about.image_1} className="w-10 h-10 rounded-lg object-cover bg-muted border border-border" alt="1" />
                <input type="text" value={formData.about.image_1} onChange={(e) => handleNestedChange('about', 'image_1', e.target.value)} className="w-full px-4 py-2 bg-muted/20 border border-border rounded-xl text-[11px] font-medium" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-semibold text-muted-foreground ml-0.5">Feature image 2 (research)</label>
              <div className="flex gap-3 items-center">
                <img src={formData.about.image_2} className="w-10 h-10 rounded-lg object-cover bg-muted border border-border" alt="2" />
                <input type="text" value={formData.about.image_2} onChange={(e) => handleNestedChange('about', 'image_2', e.target.value)} className="w-full px-4 py-2 bg-muted/20 border border-border rounded-xl text-[11px] font-medium" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-card/30 backdrop-blur-3xl border border-border/60 rounded-2xl p-6 md:p-8 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-emerald-500/10 rounded-xl"><TrendingUp className="h-5 w-5 text-emerald-600" /></div>
          <div>
            <h2 className="text-lg font-bold text-foreground tracking-tight">{t.statsSection}</h2>
            <p className="text-[10px] text-muted-foreground font-medium mt-0.5">{t.statsSectionSub}</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="space-y-2">
            <label className="text-[10px] font-semibold text-muted-foreground ml-0.5">{t.labels.experience}</label>
            <input type="number" value={formData.years_experience} onChange={(e) => handleInputChange('years_experience', e.target.value)} className="w-full px-4 py-2 bg-muted/20 border border-border rounded-xl font-bold text-sm" />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-semibold text-muted-foreground ml-0.5">{t.labels.patientCount}</label>
            <input type="text" value={formData.stats.patients_count} onChange={(e) => handleNestedChange('stats', 'patients_count', e.target.value)} className="w-full px-4 py-2 bg-muted/20 border border-border rounded-xl font-bold text-sm" />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-semibold text-muted-foreground ml-0.5">{t.labels.successRate}</label>
            <input type="text" value={formData.stats.success_rate} onChange={(e) => handleNestedChange('stats', 'success_rate', e.target.value)} className="w-full px-4 py-2 bg-muted/20 border border-border rounded-xl font-bold text-sm" />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-semibold text-muted-foreground ml-0.5">{t.labels.consultFee}</label>
            <input type="text" value={formData.stats.consultation_fee} onChange={(e) => handleNestedChange('stats', 'consultation_fee', e.target.value)} className="w-full px-4 py-2 bg-muted/20 border border-border rounded-xl font-bold text-sm" />
          </div>
        </div>
      </section>

      {/* Basic Info & Website Config (Combined) */}
      <div className="grid md:grid-cols-2 gap-6">
        <section className="bg-card/30 backdrop-blur-3xl border border-border/60 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-5">
            <div className="p-2 bg-indigo-500/10 rounded-xl"><User className="h-5 w-5 text-indigo-600" /></div>
            <h2 className="text-lg font-bold text-foreground tracking-tight">{t.basicInfo}</h2>
          </div>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-semibold text-muted-foreground ml-0.5">{t.labels.fullName}</label>
              <input type="text" value={formData.full_name} onChange={(e) => handleInputChange('full_name', e.target.value)} className="w-full px-4 py-2 bg-muted/20 border border-border rounded-xl focus:border-indigo-500 outline-none font-bold text-sm" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-semibold text-muted-foreground ml-0.5">{t.labels.profileUrl}</label>
              <input type="text" value={formData.profile_photo_url} onChange={(e) => handleInputChange('profile_photo_url', e.target.value)} className="w-full px-4 py-2 bg-muted/20 border border-border rounded-xl text-[11px] font-medium" />
            </div>
          </div>
        </section>

        <section className="bg-card/30 backdrop-blur-3xl border border-border/60 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-5">
            <div className="p-2 bg-pink-500/10 rounded-xl"><Globe className="h-5 w-5 text-pink-600" /></div>
            <h2 className="text-lg font-bold text-foreground tracking-tight">{t.websiteConfig}</h2>
          </div>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-semibold text-muted-foreground ml-0.5">{t.labels.pageTitle}</label>
              <input type="text" value={formData.website.title} onChange={(e) => handleNestedChange('website', 'title', e.target.value)} className="w-full px-4 py-2 bg-muted/20 border border-border rounded-xl outline-none font-medium text-sm" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-semibold text-muted-foreground ml-0.5">{t.labels.tagline}</label>
              <input type="text" value={formData.website.tagline} onChange={(e) => handleNestedChange('website', 'tagline', e.target.value)} className="w-full px-4 py-2 bg-muted/20 border border-border rounded-xl outline-none font-medium text-sm" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-semibold text-muted-foreground ml-0.5">URL slug (e.g., dr-john-doe)</label>
              <div className="flex items-center">
                <span className="px-3 py-2 bg-muted/40 border border-r-0 border-border rounded-l-xl text-[11px] font-medium text-muted-foreground">/doctor/</span>
                <input type="text" value={formData.website.url_slug} onChange={(e) => handleNestedChange('website', 'url_slug', e.target.value)} className="w-full px-4 py-2 bg-muted/20 border border-border rounded-r-xl outline-none font-bold text-indigo-600 text-sm" />
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Complex Array Sections */}
      {[
        {
          id: 'chamber', title: t.chambers, subtitle: t.chambersSub, icon: MapPin, color: 'red',
          items: formData.chamber,
          summaryKey: 'day',
          fields: [
            { name: 'day', label: 'Day (e.g. Sunday)', type: 'select', options: [{ label: 'Sunday', value: 'Sunday' }, { label: 'Monday', value: 'Monday' }, { label: 'Tuesday', value: 'Tuesday' }, { label: 'Wednesday', value: 'Wednesday' }, { label: 'Thursday', value: 'Thursday' }, { label: 'Friday', value: 'Friday' }, { label: 'Saturday', value: 'Saturday' }], col: 'span-2' },
            { name: 'time_range', label: 'Time (e.g. 10AM - 5PM)', type: 'text', col: 'span-2' },
            { name: 'chamber_location', label: t.labels.address, type: 'text', col: 'span-4' }
          ]
        },
        {
          id: 'services', title: t.services, subtitle: t.servicesSub, icon: Heart, color: 'blue',
          items: formData.services,
          summaryKey: 'service_name',
          fields: [
            { name: 'service_name', label: t.labels.serviceName, type: 'text', col: 'span-2' },
            { name: 'service_icon', label: t.labels.icon, type: 'icon', col: 'span-1' },
            { name: 'color_theme', label: t.labels.color, type: 'select', options: COLOR_THEMES, col: 'span-1' },
            { name: 'service_description', label: t.labels.description, type: 'ai-text', col: 'span-4' },
            { name: 'features', label: t.labels.features, type: 'text', col: 'span-4' }
          ]
        },
        {
          id: 'experience', title: t.experience, subtitle: t.experienceSub, icon: Briefcase, color: 'emerald',
          items: formData.experience,
          summaryKey: 'organization',
          fields: [
            { name: 'designation', label: t.labels.role, type: 'text', col: 'span-2' },
            { name: 'organization', label: t.labels.organization, type: 'text', col: 'span-2' },
            { name: 'start_date', label: t.labels.startDate, type: 'date', col: 'span-1' },
            { name: 'end_date', label: t.labels.endDate, type: 'date', col: 'span-1' },
            { name: 'type', label: t.labels.type, type: 'select', options: [{ label: 'Current', value: 'current' }, { label: 'Previous', value: 'previous' }, { label: 'Training', value: 'training' }, { label: 'Foundation', value: 'foundation' }], col: 'span-2' }
          ]
        },
        {
          id: 'education', title: t.education, subtitle: t.educationSub, icon: GraduationCap, color: 'purple',
          items: formData.education,
          summaryKey: 'institution',
          fields: [
            { name: 'degree', label: t.labels.degree, type: 'text', col: 'span-2' },
            { name: 'institution', label: t.labels.institution, type: 'text', col: 'span-2' },
            { name: 'passing_year', label: t.labels.year, type: 'text', col: 'span-1' },
            { name: 'type', label: t.labels.type, type: 'select', options: [{ label: 'Certification', value: 'certification' }, { label: 'Fellowship', value: 'fellowship' }, { label: 'Postgraduate', value: 'postgraduate' }, { label: 'Undergraduate', value: 'undergraduate' }], col: 'span-1' },
            { name: 'short_description', label: t.labels.details, type: 'text', col: 'span-4' }
          ]
        },
        {
          id: 'testimonials', title: t.testimonials, subtitle: t.testimonialsSub, icon: Star, color: 'orange',
          items: formData.testimonials,
          summaryKey: 'name',
          fields: [
            { name: 'name', label: t.labels.patientName, type: 'text', col: 'span-2' },
            { name: 'location', label: t.labels.location, type: 'text', col: 'span-2' },
            { name: 'message', label: t.labels.message, type: 'ai-text', col: 'span-3' },
            { name: 'rating', label: t.labels.rating, type: 'number', col: 'span-1' }
          ]
        },
        {
          id: 'affiliates', title: t.affiliates, subtitle: t.affiliatesSub, icon: Users, color: 'cyan',
          items: formData.affiliates,
          summaryKey: 'name',
          fields: [
            { name: 'name', label: t.labels.affiliateName, type: 'text', col: 'span-2' },
            { name: 'logo', label: t.labels.affiliateLogo, type: 'text', col: 'span-2' }
          ]
        },
        {
          id: 'social_media', title: t.social, subtitle: t.socialSub, icon: Globe, color: 'pink',
          items: formData.social_media,
          summaryKey: 'platform',
          fields: [
            { name: 'platform', label: 'Platform', type: 'select', options: [{ label: 'Facebook', value: 'Facebook' }, { label: 'Twitter', value: 'Twitter' }, { label: 'LinkedIn', value: 'LinkedIn' }, { label: 'Instagram', value: 'Instagram' }, { label: 'YouTube', value: 'YouTube' }], col: 'span-2' },
            { name: 'profile_url', label: t.labels.platformUrl, type: 'text', col: 'span-2' }
          ]
        }
      ].map((section) => (
        <section key={section.id} className="bg-card/30 backdrop-blur-3xl border border-border/60 rounded-2xl p-6 md:p-8 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className={`p-2 bg-${section.color}-500/10 rounded-xl`}><section.icon className={`h-5 w-5 text-${section.color}-600`} /></div>
              <div>
                <h2 className="text-lg font-bold text-foreground tracking-tight">{section.title}</h2>
                <p className="text-[10px] text-muted-foreground font-medium mt-0.5">{section.subtitle}</p>
              </div>
            </div>
            <button onClick={() => addArrayItem(section.id)} className={`px-4 py-2 bg-${section.color}-500/10 text-${section.color}-600 rounded-xl font-bold text-[11px] hover:bg-${section.color}-500/20 transition-all flex items-center gap-2`}>
              <Plus className="h-3.5 w-3.5" /> {t.addNew}
            </button>
          </div>

          <div className="space-y-3">
            {section.items.length === 0 ? <div className="text-center py-8 border border-dashed border-border rounded-xl opacity-50"><p className="text-[11px] font-semibold text-muted-foreground">{t.noEntries}</p></div> :
              section.items.map((item, index) => (
                <div key={index} className="bg-background/40 border border-border/60 rounded-xl overflow-hidden transition-all text-foreground">
                  <div
                    className="flex items-center justify-between px-5 py-3.5 cursor-pointer hover:bg-muted/30"
                    onClick={() => {
                      const key = `${section.id}-${index}`;
                      setExpandedItems(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`h-1.5 w-1.5 rounded-full bg-${section.color}-500`}></div>
                      <span className="font-bold text-[13px] tracking-tight">
                        {item[section.summaryKey] || `${t.addNew} ${index + 1}`}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={(e) => { e.stopPropagation(); removeArrayItem(section.id, index); }} className="p-1.5 hover:bg-red-500/10 text-muted-foreground hover:text-red-600 rounded-lg transition-all"><Trash2 className="h-3.5 w-3.5" /></button>
                      <ChevronDown className={`h-3.5 w-3.5 text-muted-foreground transition-transform duration-300 ${expandedItems.includes(`${section.id}-${index}`) ? 'rotate-180' : ''}`} />
                    </div>
                  </div>

                  {expandedItems.includes(`${section.id}-${index}`) && (
                    <div className="px-5 pb-5 pt-1 border-t border-border/40 animate-in slide-in-from-top-1 duration-200">
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        {section.fields.map((field) => (
                          <div key={field.name} className={`${field.col} space-y-1.5 relative`}>
                            <div className="flex justify-between px-0.5">
                              <label className="text-[10px] font-semibold text-muted-foreground">{field.label}</label>
                              {field.type === 'ai-text' && <button onClick={() => handleAIGenerate('service', item.service_name || 'service', (v) => handleArrayInputChange(section.id, index, field.name, v))} className="text-[9px] font-bold text-indigo-500 flex items-center gap-1 hover:text-indigo-600"><Sparkles className="h-3 w-3" /> {t.aiAssist}</button>}
                            </div>

                            {field.type === 'icon' ? (
                              <div className="relative">
                                <button onClick={() => setActiveIconPicker(activeIconPicker === `${section.id}-${index}` ? null : `${section.id}-${index}`)} className={`w-full px-3 py-2 bg-muted/30 border border-border rounded-lg outline-none text-[12px] font-medium transition-all flex items-center gap-2 hover:bg-muted/50`}>
                                  {getDynamicIcon(item[field.name])}
                                  <span className="opacity-70">{(item[field.name] || 'Select').substring(0, 15)}</span>
                                  <ChevronDown className="h-3 w-3 ml-auto opacity-40" />
                                </button>
                                {activeIconPicker === `${section.id}-${index}` && <IconPicker selected={item[field.name]} onSelect={(n) => { handleArrayInputChange(section.id, index, field.name, n); setActiveIconPicker(null); }} onClose={() => setActiveIconPicker(null)} />}
                              </div>
                            ) : field.type === 'select' ? (
                              <select value={item[field.name]} onChange={(e) => handleArrayInputChange(section.id, index, field.name, e.target.value)} className={`w-full px-3 py-2 bg-muted/30 border border-border rounded-lg outline-none text-[12px] font-medium`}>
                                {field.options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                              </select>
                            ) : (
                              <input type={field.type === 'ai-text' ? 'text' : field.type} value={item[field.name]} onChange={(e) => handleArrayInputChange(section.id, index, field.name, e.target.value)} className={`w-full px-3 py-2 bg-muted/30 border border-border rounded-lg focus:ring-1 focus:ring-${section.color}-500/20 focus:border-${section.color}-500 outline-none text-[12px] font-medium transition-all`} />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))
            }
          </div>
        </section>
      ))}
    </div>
  );
};

export default PublicWebsiteTab;
