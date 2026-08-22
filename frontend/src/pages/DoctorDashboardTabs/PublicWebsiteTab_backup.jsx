import React, { useState, useEffect } from 'react';
import { Save, Edit3, Briefcase, Award, Upload, MapPin, User, Globe, Facebook, Twitter, Instagram, Linkedin, Youtube } from 'lucide-react';
import { useDoctor } from '../../hooks/useDoctor';

const PublicWebsiteTab = () => {
  // Get authenticated doctor info
  const { doctorId, authenticatedFetch } = useDoctor();

  // State for website/profile data with seeded data
  const [formData, setFormData] = useState({
    full_name: "Dr. John Doe",
    profile_photo_url: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?ixlib=rb-4.0.3&w=400&h=400&fit=crop&crop=face",
    active_status: true,
    served_total_patients: 2500,
    years_experience: 15,
    chamber: [
      { 
        available_time: "Mon-Fri: 9:00 AM - 6:00 PM, Sat: 9:00 AM - 2:00 PM", 
        chamber_location: "Heart Care Medical Center, 123 Medical Plaza, New York, NY 10001" 
      },
      { 
        available_time: "Wed-Thu: 7:00 PM - 9:00 PM", 
        chamber_location: "Downtown Cardiology Clinic, 456 Health Ave, New York, NY 10002" 
      }
    ],
    services: [
      { service_icon: "🫀", service_name: "Cardiac Consultation", service_description: "Comprehensive heart health assessment and consultation for all cardiac conditions" },
      { service_icon: "🩺", service_name: "Preventive Cardiology", service_description: "Heart disease prevention, lifestyle counseling, and risk factor management" },
      { service_icon: "📊", service_name: "Cardiac Imaging", service_description: "Advanced cardiac imaging including echocardiograms and stress tests" },
      { service_icon: "💊", service_name: "Medication Management", service_description: "Specialized cardiac medication therapy and monitoring" },
      { service_icon: "🏥", service_name: "Emergency Cardiac Care", service_description: "24/7 emergency cardiac consultation and immediate intervention" },
      { service_icon: "🔬", service_name: "Cardiac Catheterization", service_description: "Advanced interventional cardiology procedures and treatments" }
    ],
    education: [
      { degree: "Doctor of Medicine (MD)", institution: "Harvard Medical School", passing_year: "2008", short_description: "Graduated Magna Cum Laude with focus on cardiovascular medicine" },
      { degree: "Fellowship in Cardiology", institution: "Mayo Clinic", passing_year: "2012", short_description: "Specialized training in interventional cardiology and cardiac imaging" },
      { degree: "Residency in Internal Medicine", institution: "Johns Hopkins Hospital", passing_year: "2011", short_description: "Comprehensive internal medicine training with cardiac focus" },
      { degree: "Bachelor of Science in Biology", institution: "MIT", passing_year: "2004", short_description: "Pre-medical studies with honors in biological sciences" }
    ],
    experience: [
      { designation: "Senior Cardiologist", organization: "Heart Care Medical Center", start_date: "2015-01-01", end_date: "", short_description: "Leading cardiac care team, performing complex interventional procedures, and managing cardiac emergencies" },
      { designation: "Associate Cardiologist", organization: "Metropolitan Heart Institute", start_date: "2012-08-01", end_date: "2014-12-31", short_description: "Specialized in preventive cardiology and patient education programs" },
      { designation: "Cardiology Fellow", organization: "Mayo Clinic", start_date: "2011-07-01", end_date: "2012-07-31", short_description: "Advanced training in cardiac catheterization and interventional procedures" }
    ],
    testimonials: { patient_name: "Sarah Johnson", patient_feedback: "Dr. John saved my life! His expertise and compassionate care during my heart attack was extraordinary. I'm forever grateful.", feedback_date: "2024-11-15" },
    sponsors_company: { organization_logo: "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=200&h=100&fit=crop", organization_name: "American Heart Association", organization_description: "Partnership in cardiac research and community heart health programs", start_date: "2020-01-01", end_date: "" },
    contact: { phone: "+1-555-0101", whatsapp: "+1-555-0101", email: "john.doe@medisync.com" },
    social_media: [
      { platform: "LinkedIn", profile_url: "https://linkedin.com/in/dr-john-doe-cardiology" },
      { platform: "Twitter", profile_url: "https://twitter.com/DrJohnDoeHeart" },
      { platform: "Facebook", profile_url: "https://facebook.com/DrJohnDoeCardiology" },
      { platform: "Instagram", profile_url: "https://instagram.com/drjohndoe_cardio" },
      { platform: "YouTube", profile_url: "https://youtube.com/c/DrJohnDoeCardiology" }
    ],
    website: {
      title: "Dr. John Doe - Cardiologist",
      tagline: "Expert Heart Care You Can Trust", 
      description: "Leading cardiologist with 15+ years of experience in comprehensive cardiac care. Specializing in preventive cardiology, interventional procedures, and heart disease management. Committed to providing personalized, compassionate care for every patient.",
      theme_color: "#2563eb",
      layout_style: "modern",
      show_phone: true,
      show_email: true,
      show_address: true,
      show_appointment: true,
      show_social: true,
      meta_keywords: "cardiology,heart,doctor,medical",
      url_slug: "dr-john-doe", 
      visibility: true
    }
  });

  // API state management
  const [loading, setLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);

  // Load data on component mount
  useEffect(() => {
    console.log('PublicWebsiteTab loaded with doctorId:', doctorId);
    console.log('Form data populated with seeded information for editing');
  }, [doctorId]);

  // Social media platform options
  const socialPlatforms = [
    'LinkedIn', 'Twitter', 'Facebook', 'Instagram', 'YouTube', 'TikTok'
  ];

  // Handle input changes
  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleWebsiteChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      website: { ...prev.website, [field]: value }
    }));
  };

  const handleArrayInputChange = (section, index, field, value) => {
    setFormData(prev => ({
      ...prev,
      [section]: prev[section].map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    }));
  };

  const addArrayItem = (section) => {
    const newItem = {
      chamber: { available_time: "", chamber_location: "" },
      services: { service_icon: "", service_name: "", service_description: "" },
      education: { degree: "", institution: "", passing_year: "", short_description: "" },
      experience: { designation: "", organization: "", start_date: "", end_date: "", short_description: "" },
      social_media: { platform: "", profile_url: "" }
    };
    
    setFormData(prev => ({
      ...prev,
      [section]: [...prev[section], newItem[section]]
    }));
  };

  const removeArrayItem = (section, index) => {
    setFormData(prev => ({
      ...prev,
      [section]: prev[section].filter((_, i) => i !== index)
    }));
  };

  const handleSave = async () => {
    setSaveLoading(true);
    try {
      console.log('Saving form data:', formData);
      // TODO: Implement actual save to database
      alert('Data saved successfully! (Currently displaying seeded data for editing)');
    } catch (error) {
      console.error('Save error:', error);
      alert('Error saving data');
    } finally {
      setSaveLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p>Loading website data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Public Website</h1>
          <p className="text-gray-600 mt-1">Manage your professional online presence</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saveLoading}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          <Save size={20} />
          {saveLoading ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      {/* Basic Information */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <User size={20} />
          Basic Information
        </h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Full Name
            </label>
            <input
              type="text"
              value={formData.full_name}
              onChange={(e) => handleInputChange('full_name', e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Dr. John Doe"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Years of Experience
            </label>
            <input
              type="number"
              value={formData.years_experience}
              onChange={(e) => handleInputChange('years_experience', parseInt(e.target.value) || 0)}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="15"
            />
          </div>
        </div>

        <div className="mt-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Profile Photo URL
          </label>
          <input
            type="url"
            value={formData.profile_photo_url}
            onChange={(e) => handleInputChange('profile_photo_url', e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="https://example.com/photo.jpg"
          />
        </div>

        <div className="mt-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Total Patients Served
          </label>
          <input
            type="number"
            value={formData.served_total_patients}
            onChange={(e) => handleInputChange('served_total_patients', parseInt(e.target.value) || 0)}
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="2500"
          />
        </div>
      </div>

      {/* Website Settings */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Globe size={20} />
          Website Settings
        </h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Website Title
            </label>
            <input
              type="text"
              value={formData.website.title}
              onChange={(e) => handleWebsiteChange('title', e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Dr. John Doe - Cardiologist"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tagline
            </label>
            <input
              type="text"
              value={formData.website.tagline}
              onChange={(e) => handleWebsiteChange('tagline', e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Expert Heart Care You Can Trust"
            />
          </div>
        </div>

        <div className="mt-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description
          </label>
          <textarea
            value={formData.website.description}
            onChange={(e) => handleWebsiteChange('description', e.target.value)}
            rows={4}
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Brief description about your practice..."
          />
        </div>

        <div className="grid md:grid-cols-2 gap-6 mt-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Theme Color
            </label>
            <input
              type="color"
              value={formData.website.theme_color}
              onChange={(e) => handleWebsiteChange('theme_color', e.target.value)}
              className="w-full h-12 border border-gray-300 rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              URL Slug
            </label>
            <input
              type="text"
              value={formData.website.url_slug}
              onChange={(e) => handleWebsiteChange('url_slug', e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="dr-john-doe"
            />
          </div>
        </div>
      </div>

      {/* Chamber Information */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <MapPin size={20} />
          Chamber Information
        </h2>
        {formData.chamber.map((chamber, index) => (
          <div key={index} className="space-y-4 p-4 border border-gray-200 rounded-lg mb-4">
            <div className="flex justify-between items-center">
              <h3 className="font-medium">Chamber {index + 1}</h3>
              {formData.chamber.length > 1 && (
                <button
                  onClick={() => removeArrayItem('chamber', index)}
                  className="text-red-600 hover:text-red-800"
                >
                  Remove
                </button>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Available Time
              </label>
              <input
                type="text"
                value={chamber.available_time}
                onChange={(e) => handleArrayInputChange('chamber', index, 'available_time', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Mon-Fri: 9:00 AM - 6:00 PM"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Chamber Location
              </label>
              <textarea
                value={chamber.chamber_location}
                onChange={(e) => handleArrayInputChange('chamber', index, 'chamber_location', e.target.value)}
                rows={2}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Full address of the chamber"
              />
            </div>
          </div>
        ))}
        <button
          onClick={() => addArrayItem('chamber')}
          className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
        >
          Add Chamber
        </button>
      </div>

      {/* Services */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Briefcase size={20} />
          Medical Services
        </h2>
        {formData.services.map((service, index) => (
          <div key={index} className="space-y-4 p-4 border border-gray-200 rounded-lg mb-4">
            <div className="flex justify-between items-center">
              <h3 className="font-medium">Service {index + 1}</h3>
              {formData.services.length > 1 && (
                <button
                  onClick={() => removeArrayItem('services', index)}
                  className="text-red-600 hover:text-red-800"
                >
                  Remove
                </button>
              )}
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Icon/Emoji
                </label>
                <input
                  type="text"
                  value={service.service_icon}
                  onChange={(e) => handleArrayInputChange('services', index, 'service_icon', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="🫀"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Service Name
                </label>
                <input
                  type="text"
                  value={service.service_name}
                  onChange={(e) => handleArrayInputChange('services', index, 'service_name', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Cardiac Consultation"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Service Description
              </label>
              <textarea
                value={service.service_description}
                onChange={(e) => handleArrayInputChange('services', index, 'service_description', e.target.value)}
                rows={3}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Detailed description of the service..."
              />
            </div>
          </div>
        ))}
        <button
          onClick={() => addArrayItem('services')}
          className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
        >
          Add Service
        </button>
      </div>

      {/* Education */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Award size={20} />
          Educational Background
        </h2>
        {formData.education.map((edu, index) => (
          <div key={index} className="space-y-4 p-4 border border-gray-200 rounded-lg mb-4">
            <div className="flex justify-between items-center">
              <h3 className="font-medium">Education {index + 1}</h3>
              {formData.education.length > 1 && (
                <button
                  onClick={() => removeArrayItem('education', index)}
                  className="text-red-600 hover:text-red-800"
                >
                  Remove
                </button>
              )}
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Degree
                </label>
                <input
                  type="text"
                  value={edu.degree}
                  onChange={(e) => handleArrayInputChange('education', index, 'degree', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Doctor of Medicine (MD)"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Institution
                </label>
                <input
                  type="text"
                  value={edu.institution}
                  onChange={(e) => handleArrayInputChange('education', index, 'institution', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Harvard Medical School"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Passing Year
              </label>
              <input
                type="text"
                value={edu.passing_year}
                onChange={(e) => handleArrayInputChange('education', index, 'passing_year', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="2008"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={edu.short_description}
                onChange={(e) => handleArrayInputChange('education', index, 'short_description', e.target.value)}
                rows={2}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Brief description of achievements or focus..."
              />
            </div>
          </div>
        ))}
        <button
          onClick={() => addArrayItem('education')}
          className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
        >
          Add Education
        </button>
      </div>

      {/* Professional Experience */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Briefcase size={20} />
          Professional Experience
        </h2>
        {formData.experience.map((exp, index) => (
          <div key={index} className="space-y-4 p-4 border border-gray-200 rounded-lg mb-4">
            <div className="flex justify-between items-center">
              <h3 className="font-medium">Experience {index + 1}</h3>
              {formData.experience.length > 1 && (
                <button
                  onClick={() => removeArrayItem('experience', index)}
                  className="text-red-600 hover:text-red-800"
                >
                  Remove
                </button>
              )}
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Designation
                </label>
                <input
                  type="text"
                  value={exp.designation}
                  onChange={(e) => handleArrayInputChange('experience', index, 'designation', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Senior Cardiologist"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Organization
                </label>
                <input
                  type="text"
                  value={exp.organization}
                  onChange={(e) => handleArrayInputChange('experience', index, 'organization', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Heart Care Medical Center"
                />
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Date
                </label>
                <input
                  type="date"
                  value={exp.start_date}
                  onChange={(e) => handleArrayInputChange('experience', index, 'start_date', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Date (Leave empty for current)
                </label>
                <input
                  type="date"
                  value={exp.end_date}
                  onChange={(e) => handleArrayInputChange('experience', index, 'end_date', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={exp.short_description}
                onChange={(e) => handleArrayInputChange('experience', index, 'short_description', e.target.value)}
                rows={3}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Description of role and responsibilities..."
              />
            </div>
          </div>
        ))}
        <button
          onClick={() => addArrayItem('experience')}
          className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
        >
          Add Experience
        </button>
      </div>

      {/* Contact Information */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-xl font-semibold mb-4">Contact Information</h2>
        <div className="grid md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Phone
            </label>
            <input
              type="tel"
              value={formData.contact.phone}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                contact: { ...prev.contact, phone: e.target.value }
              }))}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="+1-555-0101"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              WhatsApp
            </label>
            <input
              type="tel"
              value={formData.contact.whatsapp}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                contact: { ...prev.contact, whatsapp: e.target.value }
              }))}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="+1-555-0101"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              type="email"
              value={formData.contact.email}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                contact: { ...prev.contact, email: e.target.value }
              }))}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="john.doe@medisync.com"
            />
          </div>
        </div>
      </div>

      {/* Social Media */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-xl font-semibold mb-4">Social Media</h2>
        {formData.social_media.map((social, index) => (
          <div key={index} className="flex gap-4 mb-4">
            <select
              value={social.platform}
              onChange={(e) => handleArrayInputChange('social_media', index, 'platform', e.target.value)}
              className="w-40 p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select Platform</option>
              {socialPlatforms.map(platform => (
                <option key={platform} value={platform}>{platform}</option>
              ))}
            </select>
            <input
              type="url"
              value={social.profile_url}
              onChange={(e) => handleArrayInputChange('social_media', index, 'profile_url', e.target.value)}
              className="flex-1 p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="https://linkedin.com/in/dr-john-doe"
            />
            {formData.social_media.length > 1 && (
              <button
                onClick={() => removeArrayItem('social_media', index)}
                className="px-4 py-2 text-red-600 border border-red-300 rounded-md hover:bg-red-50"
              >
                Remove
              </button>
            )}
          </div>
        ))}
        <button
          onClick={() => addArrayItem('social_media')}
          className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
        >
          Add Social Media
        </button>
      </div>

      {/* Testimonials */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-xl font-semibold mb-4">Patient Testimonial</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Patient Name
            </label>
            <input
              type="text"
              value={formData.testimonials.patient_name}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                testimonials: { ...prev.testimonials, patient_name: e.target.value }
              }))}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Sarah Johnson"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Feedback
            </label>
            <textarea
              value={formData.testimonials.patient_feedback}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                testimonials: { ...prev.testimonials, patient_feedback: e.target.value }
              }))}
              rows={4}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Patient testimonial text..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date
            </label>
            <input
              type="date"
              value={formData.testimonials.feedback_date}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                testimonials: { ...prev.testimonials, feedback_date: e.target.value }
              }))}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saveLoading}
          className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          <Save size={20} />
          {saveLoading ? 'Saving...' : 'Save All Changes'}
        </button>
      </div>
    </div>
  );
};

export default PublicWebsiteTab;