import React, { useState, useEffect } from 'react';
import { Save, Edit3, Briefcase, Award, Upload, MapPin, User, Globe, Facebook, Twitter, Instagram, Linkedin, Youtube } from 'lucide-react';
import { useDoctor, authenticatedFetch } from '../../hooks/useDoctor';
import { useAuth } from '../../contexts/AuthContext';
import { API_URLS, API_CONFIG, getImageUrl } from '../../config/api';

const PublicWebsiteTab = () => {
  // Get authenticated doctor info and refresh function
  const { doctorId } = useDoctor();
  const { refreshUser } = useAuth();
  
  // For testing purposes, use doctorId=1 if not authenticated
  const actualDoctorId = doctorId || 1;
  
  console.log('Doctor ID from useDoctor:', doctorId);
  console.log('Using Doctor ID:', actualDoctorId);

  // State for website/profile data with seeded data
  const [formData, setFormData] = useState({
    full_name: "Dr. John Doe",
    profile_photo_url: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?ixlib=rb-4.0.3&w=400&h=400&fit=crop&crop=face",
    active_status: true,
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
    contact: { 
      phone: "+1-555-0101", 
      whatsapp: "+1-555-0101", 
      email: "john.doe@careconnect.com",
      address: "",
      office_phone: "",
      website_url: "",
      emergency_contact_name: "",
      emergency_contact_phone: "",
      fax: ""
    },
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
  const [loading, setLoading] = useState(true);
  const [saveLoading, setSaveLoading] = useState(false);
  const [notification, setNotification] = useState(null);

  // Helper function to format date for HTML date input
  const formatDateForInput = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toISOString().split('T')[0]; // Returns YYYY-MM-DD
    } catch {
      return '';
    }
  };

  // Show notification
  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  // Function to load doctor data from API
  const loadDoctorData = async () => {
    if (!actualDoctorId) {
      console.log('❌ No doctorId available');
      return;
    }
    
    setLoading(true);
    try {
      console.log('🔄 Loading doctor data for ID:', actualDoctorId);
      
      // Fetch doctor profile data from API
      const response = await authenticatedFetch(API_URLS.WEBSITE.PROFILE(actualDoctorId));
      
      if (response.ok) {
        const responseData = await response.json();
        console.log('Loaded doctor data:', responseData);
        
        // Extract the actual data from the API response structure
        const apiData = responseData.data || responseData;
        
        console.log('Raw API Data:', {
          first_name: apiData.first_name,
          last_name: apiData.last_name,
          title: apiData.title,
          phone: apiData.phone,
          years_of_experience: apiData.years_of_experience,
          education_count: apiData.education?.length || 0
        });
        
        // Transform API data to match form structure
        const profileImageUrl = getImageUrl(apiData.profile_image_url);
        console.log('🖼️  Profile image URL transformation:', {
          original: apiData.profile_image_url,
          transformed: profileImageUrl
        });
        
        const transformedData = {
          full_name: `${apiData.first_name || ''} ${apiData.last_name || ''}`.trim(),
          profile_photo_url: profileImageUrl,
          active_status: apiData.active_status !== undefined ? apiData.active_status : true,
          years_experience: parseInt(apiData.years_of_experience) || 0,
          
          // Transform chamber data (API: chambers -> Frontend: chamber)
          chamber: apiData.chambers || [],
          
          // Keep arrays as is but format dates
          services: apiData.services || [],
          education: (apiData.education || []).map(edu => ({
            ...edu,
            passing_year: edu.passing_year || ''
          })),
          experience: (apiData.experience || []).map(exp => {
            const formatted = {
              ...exp,
              start_date: formatDateForInput(exp.start_date),
              end_date: formatDateForInput(exp.end_date)
            };
            console.log('Experience date formatting:', {
              original: { start: exp.start_date, end: exp.end_date },
              formatted: { start: formatted.start_date, end: formatted.end_date }
            });
            return formatted;
          }),
          social_media: apiData.social_media || [],
          
          // Handle contact info - use dedicated contact object from API
          contact: {
            phone: apiData.contact?.phone || apiData.phone || "",
            whatsapp: apiData.contact?.whatsapp || "",
            email: apiData.contact?.email || apiData.email || "",
            address: apiData.contact?.address || "",
            office_phone: apiData.contact?.office_phone || "",
            website_url: apiData.contact?.website_url || "",
            emergency_contact_name: apiData.contact?.emergency_contact_name || "",
            emergency_contact_phone: apiData.contact?.emergency_contact_phone || "",
            fax: apiData.contact?.fax || ""
          },
          
          // Transform testimonials and sponsors - take first item if array
          testimonials: (() => {
            const testimonialData = Array.isArray(apiData.testimonials) ? apiData.testimonials[0] || {} : {};
            if (testimonialData.feedback_date) {
              testimonialData.feedback_date = formatDateForInput(testimonialData.feedback_date);
              console.log('Testimonial date formatting:', {
                original: apiData.testimonials?.[0]?.feedback_date,
                formatted: testimonialData.feedback_date
              });
            }
            return testimonialData;
          })(),
          sponsors_company: Array.isArray(apiData.sponsors_company) ? apiData.sponsors_company[0] || {} : {},
          
          // Website settings - extract from root level fields
          website: {
            title: apiData.title || "",
            tagline: apiData.tagline || "",
            description: apiData.description || "",
            theme_color: apiData.theme_color || "#2563eb",
            layout_style: apiData.layout_style || "modern",
            show_phone: apiData.show_phone !== undefined ? apiData.show_phone : true,
            show_email: apiData.show_email !== undefined ? apiData.show_email : true,
            show_address: apiData.show_address !== undefined ? apiData.show_address : true,
            show_appointment: apiData.show_appointment !== undefined ? apiData.show_appointment : true,
            show_social: apiData.show_social !== undefined ? apiData.show_social : true,
            meta_keywords: apiData.meta_keywords || "",
            url_slug: apiData.url_slug || "",
            visibility: apiData.visibility !== undefined ? apiData.visibility : true
          }
        };
        
        console.log('Transformed data for form:', {
          full_name: transformedData.full_name,
          years_experience: transformedData.years_experience,
          education_count: transformedData.education?.length || 0,
          website_title: transformedData.website?.title
        });
        
        // Set the form data with the transformed data
        setFormData(transformedData);
        console.log('✅ Form data set successfully');
      } else {
        console.error('Failed to load doctor data:', response.status);
        // Keep the default seeded data if fetch fails
      }
    } catch (error) {
      console.error('Error loading doctor data:', error);
      // Keep the default seeded data if fetch fails
    } finally {
      setLoading(false);
    }
  };

  // Load data on component mount
  useEffect(() => {
    console.log('🚀 Component mounted, loading data...');
    loadDoctorData();
  }, [actualDoctorId]);

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

  // State for individual section loading
  const [sectionLoading, setSectionLoading] = useState({});

  // Individual section save functions with notifications
  const saveEducationSection = async () => {
    setSectionLoading(prev => ({ ...prev, education: true }));
    try {
      await saveEducation();
      showNotification('Education section saved successfully!');
      await loadDoctorData();
    } catch (error) {
      showNotification('Error saving education section: ' + error.message, 'error');
    } finally {
      setSectionLoading(prev => ({ ...prev, education: false }));
    }
  };

  const saveExperienceSection = async () => {
    setSectionLoading(prev => ({ ...prev, experience: true }));
    try {
      await saveExperience();
      showNotification('Experience section saved successfully!');
      await loadDoctorData();
    } catch (error) {
      showNotification('Error saving experience section: ' + error.message, 'error');
    } finally {
      setSectionLoading(prev => ({ ...prev, experience: false }));
    }
  };

  const saveServicesSection = async () => {
    setSectionLoading(prev => ({ ...prev, services: true }));
    try {
      await saveServices();
      showNotification('Services section saved successfully!');
      await loadDoctorData();
    } catch (error) {
      showNotification('Error saving services section: ' + error.message, 'error');
    } finally {
      setSectionLoading(prev => ({ ...prev, services: false }));
    }
  };

  const saveChambersSection = async () => {
    setSectionLoading(prev => ({ ...prev, chambers: true }));
    try {
      await saveChambers();
      showNotification('Chambers section saved successfully!');
      await loadDoctorData();
    } catch (error) {
      showNotification('Error saving chambers section: ' + error.message, 'error');
    } finally {
      setSectionLoading(prev => ({ ...prev, chambers: false }));
    }
  };

  const saveSocialMediaSection = async () => {
    setSectionLoading(prev => ({ ...prev, socialMedia: true }));
    try {
      await saveSocialMedia();
      showNotification('Social media section saved successfully!');
      await loadDoctorData();
    } catch (error) {
      showNotification('Error saving social media section: ' + error.message, 'error');
    } finally {
      setSectionLoading(prev => ({ ...prev, socialMedia: false }));
    }
  };

  const saveEducation = async () => {
    try {
      for (const edu of formData.education) {
        if (edu.id) {
          // Update existing
          await authenticatedFetch(API_URLS.WEBSITE.EDUCATION.UPDATE(actualDoctorId, edu.id), {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(edu)
          });
        } else {
          // Add new
          await authenticatedFetch(API_URLS.WEBSITE.EDUCATION.ADD(actualDoctorId), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(edu)
          });
        }
      }
    } catch (error) {
      console.error('Error saving education:', error);
      throw error;
    }
  };

  const saveExperience = async () => {
    try {
      for (const exp of formData.experience) {
        if (exp.id) {
          await authenticatedFetch(API_URLS.WEBSITE.EXPERIENCE.UPDATE(actualDoctorId, exp.id), {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(exp)
          });
        } else {
          await authenticatedFetch(API_URLS.WEBSITE.EXPERIENCE.ADD(actualDoctorId), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(exp)
          });
        }
      }
    } catch (error) {
      console.error('Error saving experience:', error);
      throw error;
    }
  };

  const saveServices = async () => {
    try {
      for (const service of formData.services) {
        if (service.id) {
          await authenticatedFetch(API_URLS.WEBSITE.SERVICES.UPDATE(actualDoctorId, service.id), {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(service)
          });
        } else {
          await authenticatedFetch(API_URLS.WEBSITE.SERVICES.ADD(actualDoctorId), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(service)
          });
        }
      }
    } catch (error) {
      console.error('Error saving services:', error);
      throw error;
    }
  };

  const saveChambers = async () => {
    try {
      for (const chamber of formData.chamber) {
        if (chamber.id) {
          await authenticatedFetch(API_URLS.WEBSITE.CHAMBERS.UPDATE(actualDoctorId, chamber.id), {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(chamber)
          });
        } else {
          await authenticatedFetch(API_URLS.WEBSITE.CHAMBERS.ADD(actualDoctorId), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(chamber)
          });
        }
      }
    } catch (error) {
      console.error('Error saving chambers:', error);
      throw error;
    }
  };

  const saveSocialMedia = async () => {
    try {
      await authenticatedFetch(API_URLS.WEBSITE.SOCIAL_MEDIA.UPDATE(actualDoctorId), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData.social_media)
      });
    } catch (error) {
      console.error('Error saving social media:', error);
      throw error;
    }
  };

  const saveContact = async () => {
    try {
      await authenticatedFetch(API_URLS.WEBSITE.CONTACT.UPDATE(actualDoctorId), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData.contact)
      });
    } catch (error) {
      console.error('Error saving contact:', error);
      throw error;
    }
  };

  const removeArrayItem = async (section, index) => {
    const item = formData[section][index];
    
    // If item has an ID, delete it from the database
    if (item.id) {
      try {
        let deleteUrl;
        switch (section) {
          case 'education':
            deleteUrl = API_URLS.WEBSITE.EDUCATION.DELETE(actualDoctorId, item.id);
            break;
          case 'experience':
            deleteUrl = API_URLS.WEBSITE.EXPERIENCE.DELETE(actualDoctorId, item.id);
            break;
          case 'services':
            deleteUrl = API_URLS.WEBSITE.SERVICES.DELETE(actualDoctorId, item.id);
            break;
          case 'chamber':
            deleteUrl = API_URLS.WEBSITE.CHAMBERS.DELETE(actualDoctorId, item.id);
            break;
          case 'testimonials':
            deleteUrl = API_URLS.WEBSITE.TESTIMONIALS.DELETE(actualDoctorId, item.id);
            break;
          default:
            break;
        }
        
        if (deleteUrl) {
          const response = await authenticatedFetch(deleteUrl, {
            method: 'DELETE'
          });
          
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Delete failed');
          }
        }
      } catch (error) {
        console.error(`Error deleting ${section} item:`, error);
        showNotification(`Error deleting ${section} item: ${error.message}`, 'error');
        return; // Don't remove from UI if delete failed
      }
    }
    
    // Remove from local state
    setFormData(prev => ({
      ...prev,
      [section]: prev[section].filter((_, i) => i !== index)
    }));
  };

  const handleSave = async () => {
    if (!actualDoctorId) {
      showNotification('Doctor ID not found. Please refresh and try again.', 'error');
      return;
    }

    setSaveLoading(true);
    try {
      console.log('Saving form data to database:', formData);
      
      // Save basic profile data
      const profileData = {
        full_name: formData.full_name,
        profile_photo_url: formData.profile_photo_url,
        active_status: formData.active_status,
        years_experience: formData.years_experience,
        website: formData.website
      };

      const response = await authenticatedFetch(API_URLS.WEBSITE.PROFILE(actualDoctorId), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Profile save failed: ${response.status}`);
      }

      // Save individual sections
      await Promise.all([
        saveEducation(),
        saveExperience(), 
        saveServices(),
        saveChambers(),
        saveSocialMedia()
      ]);
      
      alert('All website data saved successfully to database!');
      console.log('✅ All data saved successfully to database');
      
      // Refresh user context to update profile image in header
      if (refreshUser) {
        await refreshUser();
        console.log('🔄 User context refreshed with updated profile image');
      }
      
      // Refresh data to show updated values
      await loadDoctorData();

    } catch (error) {
      console.error('Save error:', error);
      showNotification('Error saving data to database: ' + error.message, 'error');
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
      {/* Notification */}
      {notification && (
        <div className={`fixed top-4 right-4 p-4 rounded-md shadow-lg z-50 ${
          notification.type === 'error' 
            ? 'bg-red-100 text-red-800 border border-red-300' 
            : 'bg-green-100 text-green-800 border border-green-300'
        }`}>
          {notification.message}
        </div>
      )}

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

        {/* Profile Picture Section */}
        <div className="mt-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Profile Picture
          </label>
          
          {/* Current Profile Preview */}
          {formData.profile_photo_url && (
            <div className="mb-4 flex items-center gap-4">
              <div className="relative">
                <img
                  src={formData.profile_photo_url}
                  alt="Profile Preview"
                  className="w-16 h-16 rounded-full object-cover border-2 border-gray-300"
                  onError={(e) => {
                    console.error('🖼️ Image failed to load:', formData.profile_photo_url);
                    e.target.style.display = 'none';
                    e.target.nextElementSibling.style.display = 'flex';
                  }}
                  onLoad={() => {
                    console.log('✅ Image loaded successfully:', formData.profile_photo_url);
                  }}
                />
                <div className="w-16 h-16 rounded-full bg-blue-500 flex items-center justify-center text-white font-medium" style={{ display: 'none' }}>
                  {formData.full_name?.charAt(0) || 'D'}
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleInputChange('profile_photo_url', '')}
                className="px-3 py-1 text-sm text-red-600 hover:text-red-800 border border-red-300 rounded hover:bg-red-50"
              >
                Remove
              </button>
            </div>
          )}

          {/* Upload Options */}
          <div className="space-y-4">
            {/* File Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">
                Upload Image (Max: 2MB, 400x400px recommended)
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/jpg"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      console.log('📁 File selected:', {
                        name: file.name,
                        size: file.size,
                        type: file.type,
                        sizeMB: (file.size / (1024 * 1024)).toFixed(2)
                      });

                      // Check file size (2MB limit)
                      if (file.size > 2 * 1024 * 1024) {
                        showNotification(`Image size is ${(file.size / (1024 * 1024)).toFixed(2)}MB. Must be less than 2MB`, 'error');
                        e.target.value = '';
                        return;
                      }
                      
                      // Check file type
                      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
                      if (!allowedTypes.includes(file.type)) {
                        showNotification(`File type ${file.type} not supported. Please use JPEG or PNG`, 'error');
                        e.target.value = '';
                        return;
                      }
                      
                      // Convert to base64
                      const reader = new FileReader();
                      reader.onload = (event) => {
                        const result = event.target.result;
                        console.log('📷 Image converted to base64, length:', result.length);
                        console.log('📷 Base64 preview:', result.substring(0, 100) + '...');
                        handleInputChange('profile_photo_url', result);
                        showNotification('Image uploaded successfully!', 'success');
                      };
                      reader.onerror = (error) => {
                        console.error('❌ FileReader error:', error);
                        showNotification('Failed to read image file', 'error');
                        e.target.value = '';
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                  className="flex-1 text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Supported formats: JPEG, PNG. Recommended size: 400x400px
              </p>
            </div>

            {/* URL Input */}
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">
                Or Enter Image URL
              </label>
              <input
                type="url"
                value={formData.profile_photo_url?.startsWith('data:') ? '' : formData.profile_photo_url || ''}
                onChange={(e) => handleInputChange('profile_photo_url', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="https://example.com/photo.jpg"
              />
            </div>
          </div>
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
        <div className="flex gap-3 mt-4">
          <button
            onClick={() => addArrayItem('chamber')}
            className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
          >
            Add Chamber
          </button>
          <button
            onClick={saveChambersSection}
            disabled={sectionLoading.chambers}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {sectionLoading.chambers ? 'Saving...' : 'Save Chambers'}
          </button>
        </div>
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
        <div className="flex gap-3 mt-4">
          <button
            onClick={() => addArrayItem('services')}
            className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
          >
            Add Service
          </button>
          <button
            onClick={saveServicesSection}
            disabled={sectionLoading.services}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {sectionLoading.services ? 'Saving...' : 'Save Services'}
          </button>
        </div>
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
        <div className="flex gap-3 mt-4">
          <button
            onClick={() => addArrayItem('education')}
            className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
          >
            Add Education
          </button>
          <button
            onClick={saveEducationSection}
            disabled={sectionLoading.education}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {sectionLoading.education ? 'Saving...' : 'Save Education'}
          </button>
        </div>
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
        <div className="flex gap-3 mt-4">
          <button
            onClick={() => addArrayItem('experience')}
            className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
          >
            Add Experience
          </button>
          <button
            onClick={saveExperienceSection}
            disabled={sectionLoading.experience}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {sectionLoading.experience ? 'Saving...' : 'Save Experience'}
          </button>
        </div>
      </div>

      {/* Contact Information */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-xl font-semibold mb-4">Contact Information</h2>
        <div className="grid md:grid-cols-3 gap-6 mb-6">
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
              placeholder="john.doe@careconnect.com"
            />
          </div>
        </div>
        
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Office Phone
            </label>
            <input
              type="tel"
              value={formData.contact.office_phone || ''}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                contact: { ...prev.contact, office_phone: e.target.value }
              }))}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="+1-555-0102"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Website URL
            </label>
            <input
              type="url"
              value={formData.contact.website_url || ''}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                contact: { ...prev.contact, website_url: e.target.value }
              }))}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="https://www.doctorwebsite.com"
            />
          </div>
        </div>
        
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Address
          </label>
          <textarea
            value={formData.contact.address || ''}
            onChange={(e) => setFormData(prev => ({
              ...prev,
              contact: { ...prev.contact, address: e.target.value }
            }))}
            rows={3}
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="123 Medical Avenue, Suite 400, Metropolitan Heart Center, New York, NY 10001"
          />
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            onClick={async () => {
              setSaveLoading(true);
              try {
                await saveContact();
                showNotification('Contact information saved successfully!', 'success');
              } catch (error) {
                showNotification('Failed to save contact information', 'error');
              } finally {
                setSaveLoading(false);
              }
            }}
            disabled={saveLoading}
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saveLoading ? 'Saving...' : 'Save Contact Information'}
          </button>
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
        <div className="flex gap-3 mt-4">
          <button
            onClick={() => addArrayItem('social_media')}
            className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
          >
            Add Social Media
          </button>
          <button
            onClick={saveSocialMediaSection}
            disabled={sectionLoading.socialMedia}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {sectionLoading.socialMedia ? 'Saving...' : 'Save Social Media'}
          </button>
        </div>
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