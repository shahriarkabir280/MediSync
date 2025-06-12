
import React, { useState } from 'react';
import { Settings, User, Bell, Shield, CreditCard, HelpCircle, LogOut, Globe, Save, MapPin, Award, Briefcase, Upload, Edit3, Facebook, Instagram, Linkedin, Twitter, Youtube } from 'lucide-react';

const VerticleTab = () => {
  const [activeTab, setActiveTab] = useState('settings');
  
  // State for website/profile data
  const [formData, setFormData] = useState({
    full_name: "",
    profile_photo_url: "",
    active_status: true,
    served_total_patients: 0,
    years_experience: 0,
    chamber: [{ available_time: "", chamber_location: "" }],
    services: [{ service_icon: "", service_name: "", service_description: "" }],
    education: [
      { degree: "", institution: "", passing_year: "", short_description: "" },
    ],
    experience: [
      {
        designation: "",
        organization: "",
        start_date: "",
        end_date: "",
        short_description: "",
      },
    ],
    testimonials: { patient_name: "", patient_feedback: "", feedback_date: "" },
    sponsors_company: {
      organization_logo: "",
      organization_name: "",
      organization_description: "",
      start_date: "",
      end_date: "",
    },
    contact: { phone: "", whatsapp: "", email: "" },
    social_media: [{ platform: "", profile_url: "" }],
    website: {
      title: "",
      tagline: "",
      description: "",
      theme_color: "",
      layout_style: "",
      show_phone: true,
      show_email: true,
      show_address: true,
      show_appointment: true,
      show_social: true,
      meta_keywords: "",
      url_slug: "",
      visibility: true
    }
  });

  const tabs = [
    { id: 'settings', label: 'Settings', icon: Settings },
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'website', label: 'Edit Public Website', icon: Globe },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'billing', label: 'Billing', icon: CreditCard },
    { id: 'help', label: 'Help & Support', icon: HelpCircle },
    { id: 'logout', label: 'Logout', icon: LogOut },
  ];

  const socialPlatforms = [
    { value: "facebook", label: "Facebook", color: "bg-blue-600", icon: Facebook },
    { value: "twitter", label: "Twitter/X", color: "bg-sky-500", icon: Twitter },
    { value: "instagram", label: "Instagram", color: "bg-gradient-to-r from-purple-500 to-pink-500", icon: Instagram },
    { value: "linkedin", label: "LinkedIn", color: "bg-blue-700", icon: Linkedin },
    { value: "youtube", label: "YouTube", color: "bg-red-600", icon: Youtube },
  ];

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleWebsiteChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      website: { ...prev.website, [field]: value }
    }));
  };

  const handleArrayInputChange = (section, index, field, value) => {
    setFormData((prev) => ({
      ...prev,
      [section]: prev[section].map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      ),
    }));
  };

  const addArrayItem = (section) => {
    const newItem =
      section === "chamber"
        ? { available_time: "", chamber_location: "" }
        : section === "services"
        ? { service_icon: "", service_name: "", service_description: "" }
        : section === "education"
        ? { degree: "", institution: "", passing_year: "", short_description: "" }
        : section === "experience"
        ? { designation: "", organization: "", start_date: "", end_date: "", short_description: "" }
        : { platform: "", profile_url: "" };

    setFormData((prev) => ({
      ...prev,
      [section]: [...prev[section], newItem],
    }));
  };

  const removeArrayItem = (section, index) => {
    setFormData((prev) => ({
      ...prev,
      [section]: prev[section].filter((_, i) => i !== index),
    }));
  };

  const handleSave = () => {
    console.log("Saving website data:", formData);
    alert("Website data saved successfully!");
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        handleInputChange('profile_photo_url', e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const getSocialIcon = (platform) => {
    const platformData = socialPlatforms.find(p => p.value === platform);
    if (platformData) {
      const IconComponent = platformData.icon;
      return <IconComponent size={16} className="text-white" />;
    }
    return null;
  };

  const renderContent = () => {
    switch (activeTab) {
      // ... keep existing code for settings, profile, notifications, security, billing, and help cases

      case 'website':
        return (
          <div className="space-y-6">
            {/* Header */}
            <div className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold">Professional Website Editor</h1>
                  <p className="text-primary-foreground/80 mt-1">
                    Customize your professional website appearance and content
                  </p>
                </div>
                <button
                  onClick={handleSave}
                  className="flex items-center space-x-2 bg-background text-foreground px-6 py-2.5 rounded-lg font-medium hover:bg-background/90 transition-colors shadow-sm"
                >
                  <Save size={18} />
                  <span>Save Changes</span>
                </button>
              </div>
            </div>

            <div className="grid gap-6">
              {/* Website Status */}
              <div className="bg-card border border-border rounded-lg p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <Globe className="text-primary" size={20} />
                  <h3 className="text-lg font-semibold">Website Status</h3>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Public Website Visibility</p>
                    <p className="text-sm text-muted-foreground">Toggle to make your website publicly accessible to visitors</p>
                  </div>
                  <div className="relative inline-block w-10 mr-2 align-middle select-none">
                    <input 
                      type="checkbox" 
                      checked={formData.website.visibility}
                      onChange={(e) => handleWebsiteChange('visibility', e.target.checked)}
                      className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer"
                    />
                    <label className="toggle-label block overflow-hidden h-6 rounded-full bg-gray-300 cursor-pointer"></label>
                  </div>
                </div>
                <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-800">
                    <strong>Website URL:</strong> https://yoursite.com/{formData.website.url_slug}
                  </p>
                </div>
              </div>

              {/* Basic Information */}
              <div className="bg-card border border-border rounded-lg p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <User className="text-primary" size={20} />
                  <h3 className="text-lg font-semibold">Basic Information</h3>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-1 flex flex-col items-center space-y-4">
                    <div className="relative group">
                      <div className="w-32 h-32 bg-primary/10 rounded-full flex items-center justify-center border-2 border-dashed border-primary/30 overflow-hidden">
                        {formData.profile_photo_url ? (
                          <img 
                            src={formData.profile_photo_url} 
                            alt="Profile" 
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="text-center">
                            <User className="w-12 h-12 text-primary/50 mx-auto mb-2" />
                            <p className="text-xs text-muted-foreground">Upload Photo</p>
                          </div>
                        )}
                      </div>
                      <div className="absolute inset-0 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Edit3 className="w-6 h-6 text-white" />
                      </div>
                    </div>
                    
                    <div className="flex space-x-2">
                      <label className="flex items-center space-x-2 bg-primary text-primary-foreground px-3 py-2 rounded-md cursor-pointer hover:bg-primary/90 transition-colors text-sm">
                        <Upload size={16} />
                        <span>Upload Photo</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleFileUpload}
                          className="hidden"
                        />
                      </label>
                      {formData.profile_photo_url && (
                        <button
                          onClick={() => handleInputChange('profile_photo_url', '')}
                          className="px-3 py-2 border border-border rounded-md hover:bg-accent transition-colors text-sm"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground text-center">
                      Upload a professional headshot. Recommended size: 400x400px
                    </p>
                  </div>

                  <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Full Name </label>
                      <p className="text-xs text-muted-foreground mb-2">Your complete professional name as it appears on certificates</p>
                      <input
                        type="text"
                        value={formData.full_name}
                        onChange={(e) => handleInputChange('full_name', e.target.value)}
                        className="w-full p-2 border border-input rounded-md bg-background"
                        placeholder="Ex.  Md. Jobayer Hasan"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Years of Experience</label>
                      <p className="text-xs text-muted-foreground mb-2">Total years of professional medical practice</p>
                      <input
                        type="number"
                        value={formData.years_experience}
                        onChange={(e) => handleInputChange('years_experience', parseInt(e.target.value) || 0)}
                        className="w-full p-2 border border-input rounded-md bg-background"
                        placeholder="15"
                        min="0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Total Patients Served</label>
                      <p className="text-xs text-muted-foreground mb-2">Approximate number of patients you've treated</p>
                      <input
                        type="number"
                        value={formData.served_total_patients}
                        onChange={(e) => handleInputChange('served_total_patients', parseInt(e.target.value) || 0)}
                        className="w-full p-2 border border-input rounded-md bg-background"
                        placeholder="500"
                        min="0"
                      />
                    </div>
                    <div className="flex items-center pt-6">
                      <label className="flex items-center space-x-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.active_status}
                          onChange={(e) => handleInputChange('active_status', e.target.checked)}
                          className="w-4 h-4 text-primary border-input rounded focus:ring-ring"
                        />
                        <div>
                          <span className="text-sm font-medium text-foreground">
                            Currently accepting patients
                          </span>
                          <p className="text-xs text-muted-foreground">Show that you're available for new appointments</p>
                        </div>
                      </label>
                    </div>
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Website Title</label>
                    <p className="text-xs text-muted-foreground mb-2">Main heading that appears on your website</p>
                    <input 
                      type="text" 
                      value={formData.website.title}
                      onChange={(e) => handleWebsiteChange('title', e.target.value)}
                      className="w-full p-2 border border-input rounded-md bg-background" 
                      placeholder="Ex. Dr. Jobayear Hasan - Cardiologist" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Website Tagline</label>
                    <p className="text-xs text-muted-foreground mb-2">Brief catchy phrase describing your practice</p>
                    <input 
                      type="text" 
                      value={formData.website.tagline}
                      onChange={(e) => handleWebsiteChange('tagline', e.target.value)}
                      className="w-full p-2 border border-input rounded-md bg-background" 
                      placeholder="Ex. Expert heart care with compassion" 
                    />
                  </div>
                </div>
                <div className="mt-4">
                  <label className="block text-sm font-medium mb-2">Website Description</label>
                  <p className="text-xs text-muted-foreground mb-2">Detailed description of your practice and expertise</p>
                  <textarea 
                    rows={3} 
                    value={formData.website.description}
                    onChange={(e) => handleWebsiteChange('description', e.target.value)}
                    className="w-full p-2 border border-input rounded-md bg-background" 
                    placeholder="EX. Dr. John Smith is a board-certified cardiologist with over 15 years of experience in treating heart conditions. Specializing in preventive cardiology and minimally invasive procedures..."
                  />
                </div>
              </div>

              {/* Chamber Information */}
              <div className="bg-card border border-border rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <MapPin className="text-primary" size={20} />
                    <h3 className="text-lg font-semibold">Chamber Information</h3>
                  </div>
                  <button
                    onClick={() => addArrayItem('chamber')}
                    className="px-3 py-1 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                  >
                    Add Chamber
                  </button>
                </div>
                
                <div className="space-y-4">
                  {formData.chamber.map((chamber, index) => (
                    <div key={index} className="p-4 border border-border rounded-lg">
                      <div className="flex justify-between items-center mb-3">
                        <h4 className="font-medium">Chamber {index + 1}</h4>
                        {formData.chamber.length > 1 && (
                          <button
                            onClick={() => removeArrayItem('chamber', index)}
                            className="text-red-500 hover:text-red-700 text-sm"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm font-medium mb-2">Available Time</label>
                          <p className="text-xs text-muted-foreground mb-2">Days and hours when you're available at this location</p>
                          <input
                            type="text"
                            value={chamber.available_time}
                            onChange={(e) => handleArrayInputChange('chamber', index, 'available_time', e.target.value)}
                            className="w-full p-2 border border-input rounded-md bg-background"
                            placeholder="Ex. Mon-Fri 9:00 AM - 6:00 PM, Sat 9:00 AM - 2:00 PM"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-2">Chamber Location</label>
                          <p className="text-xs text-muted-foreground mb-2">Complete address including building name and room number</p>
                          <input
                            type="text"
                            value={chamber.chamber_location}
                            onChange={(e) => handleArrayInputChange('chamber', index, 'chamber_location', e.target.value)}
                            className="w-full p-2 border border-input rounded-md bg-background"
                            placeholder="Ex. Road No. 5, Banani, Dhaka 1213"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Services */}
              <div className="bg-card border border-border rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <Award className="text-primary" size={20} />
                    <h3 className="text-lg font-semibold">Medical Services</h3>
                  </div>
                  <button
                    onClick={() => addArrayItem('services')}
                    className="px-3 py-1 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                  >
                    Add Service
                  </button>
                </div>
                
                <div className="space-y-4">
                  {formData.services.map((service, index) => (
                    <div key={index} className="p-4 border border-border rounded-lg">
                      <div className="flex justify-between items-center mb-3">
                        <h4 className="font-medium">Service {index + 1}</h4>
                        {formData.services.length > 1 && (
                          <button
                            onClick={() => removeArrayItem('services', index)}
                            className="text-red-500 hover:text-red-700 text-sm"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                      <div className="space-y-3">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-sm font-medium mb-2">Service Icon URL</label>
                            <p className="text-xs text-muted-foreground mb-2">URL to an icon representing this service (optional)</p>
                            <input
                              type="url"
                              value={service.service_icon}
                              onChange={(e) => handleArrayInputChange('services', index, 'service_icon', e.target.value)}
                              className="w-full p-2 border border-input rounded-md bg-background"
                              placeholder="Ex.  https://example.com/cardiology-icon.png"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-2">Service Name</label>
                            <p className="text-xs text-muted-foreground mb-2">Clear name for the medical service you provide</p>
                            <input
                              type="text"
                              value={service.service_name}
                              onChange={(e) => handleArrayInputChange('services', index, 'service_name', e.target.value)}
                              className="w-full p-2 border border-input rounded-md bg-background"
                              placeholder="Ex. Cardiac Consultation"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-2">Service Description</label>
                          <p className="text-xs text-muted-foreground mb-2">Detailed explanation of what this service includes</p>
                          <textarea
                            value={service.service_description}
                            onChange={(e) => handleArrayInputChange('services', index, 'service_description', e.target.value)}
                            className="w-full p-2 border border-input rounded-md bg-background"
                            placeholder="Ex. Comprehensive heart examination including ECG, echocardiogram, and personalized treatment recommendations..."
                            rows={2}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Education & Experience Row */}
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {/* Education */}
                <div className="bg-card border border-border rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <Award className="text-primary" size={20} />
                      <h3 className="text-lg font-semibold">Education</h3>
                    </div>
                    <button
                      onClick={() => addArrayItem('education')}
                      className="px-3 py-1 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                    >
                      Add Education
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    {formData.education.map((edu, index) => (
                      <div key={index} className="p-4 border border-border rounded-lg">
                        <div className="flex justify-between items-center mb-3">
                          <h4 className="font-medium">Education {index + 1}</h4>
                          {formData.education.length > 1 && (
                            <button
                              onClick={() => removeArrayItem('education', index)}
                              className="text-red-500 hover:text-red-700 text-sm"
                            >
                              Remove
                            </button>
                          )}
                        </div>
                        <div className="space-y-3">
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-sm font-medium mb-2">Degree</label>
                              <p className="text-xs text-muted-foreground mb-2">Your qualification (MBBS, MD, PhD, etc.)</p>
                              <input
                                type="text"
                                value={edu.degree}
                                onChange={(e) => handleArrayInputChange('education', index, 'degree', e.target.value)}
                                className="w-full p-2 border border-input rounded-md bg-background"
                                placeholder="Ex. MBBS, MD Cardiology"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium mb-2">Graduation Year</label>
                              <p className="text-xs text-muted-foreground mb-2">Year you completed this degree</p>
                              <input
                                type="text"
                                value={edu.passing_year}
                                onChange={(e) => handleArrayInputChange('education', index, 'passing_year', e.target.value)}
                                className="w-full p-2 border border-input rounded-md bg-background"
                                placeholder="Ex. 2010"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-2">Institution</label>
                            <p className="text-xs text-muted-foreground mb-2">Name of university or medical college</p>
                            <input
                              type="text"
                              value={edu.institution}
                              onChange={(e) => handleArrayInputChange('education', index, 'institution', e.target.value)}
                              className="w-full p-2 border border-input rounded-md bg-background"
                              placeholder="Ex. Dhaka Medical College"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-2">Description</label>
                            <p className="text-xs text-muted-foreground mb-2">Additional details about your education or achievements</p>
                            <textarea
                              value={edu.short_description}
                              onChange={(e) => handleArrayInputChange('education', index, 'short_description', e.target.value)}
                              className="w-full p-2 border border-input rounded-md bg-background"
                              placeholder="Ex. Graduated with specialization in interventional cardiology..."
                              rows={2}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Experience */}
                <div className="bg-card border border-border rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <Briefcase className="text-primary" size={20} />
                      <h3 className="text-lg font-semibold">Experience</h3>
                    </div>
                    <button
                      onClick={() => addArrayItem('experience')}
                      className="px-3 py-1 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                    >
                      Add Experience
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    {formData.experience.map((exp, index) => (
                      <div key={index} className="p-4 border border-border rounded-lg">
                        <div className="flex justify-between items-center mb-3">
                          <h4 className="font-medium">Experience {index + 1}</h4>
                          {formData.experience.length > 1 && (
                            <button
                              onClick={() => removeArrayItem('experience', index)}
                              className="text-red-500 hover:text-red-700 text-sm"
                            >
                              Remove
                            </button>
                          )}
                        </div>
                        <div className="space-y-3">
                          <div>
                            <label className="block text-sm font-medium mb-2">Designation</label>
                            <p className="text-xs text-muted-foreground mb-2">Your job title or position</p>
                            <input
                              type="text"
                              value={exp.designation}
                              onChange={(e) => handleArrayInputChange('experience', index, 'designation', e.target.value)}
                              className="w-full p-2 border border-input rounded-md bg-background"
                              placeholder="Senior Cardiologist, Chief of Cardiology"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-2">Organization</label>
                            <p className="text-xs text-muted-foreground mb-2">Hospital, clinic, or healthcare organization</p>
                            <input
                              type="text"
                              value={exp.organization}
                              onChange={(e) => handleArrayInputChange('experience', index, 'organization', e.target.value)}
                              className="w-full p-2 border border-input rounded-md bg-background"
                              placeholder="Ex. City General Hospital"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-sm font-medium mb-2">Start Date</label>
                              <p className="text-xs text-muted-foreground mb-2">When you began this position</p>
                              <input
                                type="date"
                                value={exp.start_date}
                                onChange={(e) => handleArrayInputChange('experience', index, 'start_date', e.target.value)}
                                className="w-full p-2 border border-input rounded-md bg-background"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium mb-2">End Date</label>
                              <p className="text-xs text-muted-foreground mb-2">When you left (or leave blank if current)</p>
                              <input
                                type="date"
                                value={exp.end_date}
                                onChange={(e) => handleArrayInputChange('experience', index, 'end_date', e.target.value)}
                                className="w-full p-2 border border-input rounded-md bg-background"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-2">Description</label>
                            <p className="text-xs text-muted-foreground mb-2">Key responsibilities and achievements in this role</p>
                            <textarea
                              value={exp.short_description}
                              onChange={(e) => handleArrayInputChange('experience', index, 'short_description', e.target.value)}
                              className="w-full p-2 border border-input rounded-md bg-background"
                              placeholder="Ex. Led a team of 15 medical professionals, performed over 200 cardiac procedures annually..."
                              rows={2}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Contact & Testimonials Row */}
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {/* Contact Information */}
                <div className="bg-card border border-border rounded-lg p-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <User className="text-primary" size={20} />
                    <h3 className="text-lg font-semibold">Contact Information</h3>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Phone Number</label>
                      <p className="text-xs text-muted-foreground mb-2">Primary contact number for appointments</p>
                      <input
                        type="tel"
                        value={formData.contact?.phone || ""}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            contact: { ...prev.contact, phone: e.target.value },
                          }))
                        }
                        className="w-full p-2 border border-input rounded-md bg-background"
                        placeholder="Ex. +8801234567890"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">WhatsApp</label>
                      <p className="text-xs text-muted-foreground mb-2">WhatsApp number for quick consultations (optional)</p>
                      <input
                        type="tel"
                        value={formData.contact?.whatsapp || ""}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            contact: { ...prev.contact, whatsapp: e.target.value },
                          }))
                        }
                        className="w-full p-2 border border-input rounded-md bg-background"
                        placeholder="Ex.+8801234567890"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Email</label>
                      <p className="text-xs text-muted-foreground mb-2">Professional email address for correspondence</p>
                      <input
                        type="email"
                        value={formData.contact?.email || ""}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            contact: { ...prev.contact, email: e.target.value },
                          }))
                        }
                        className="w-full p-2 border border-input rounded-md bg-background"
                        placeholder="Ex. jobayerhasan@gmail.com"
                      />
                    </div>
                  </div>
                </div>

                {/* Testimonials */}
                <div className="bg-card border border-border rounded-lg p-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <Award className="text-primary" size={20} />
                    <h3 className="text-lg font-semibold">Featured Testimonial</h3>
                  </div>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium mb-2">Patient Name</label>
                        <p className="text-xs text-muted-foreground mb-2">Name of the patient (use initials for privacy if needed)</p>
                        <input
                          type="text"
                          value={formData.testimonials?.patient_name || ""}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              testimonials: {
                                ...prev.testimonials,
                                patient_name: e.target.value,
                              },
                            }))
                          }
                          className="w-full p-2 border border-input rounded-md bg-background"
                          placeholder="Ex. Dr. Jobayer Hasan. or Anonymous"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Date</label>
                        <p className="text-xs text-muted-foreground mb-2">When this testimonial was given</p>
                        <input
                          type="date"
                          value={formData.testimonials?.feedback_date || ""}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              testimonials: {
                                ...prev.testimonials,
                                feedback_date: e.target.value,
                              },
                            }))
                          }
                          className="w-full p-2 border border-input rounded-md bg-background"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Testimonial</label>
                      <p className="text-xs text-muted-foreground mb-2">Patient's feedback about your care and service</p>
                      <textarea
                        value={formData.testimonials?.patient_feedback || ""}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            testimonials: {
                              ...prev.testimonials,
                              patient_feedback: e.target.value,
                            },
                          }))
                        }
                        className="w-full p-2 border border-input rounded-md bg-background"
                        placeholder="Ex. Dr. Jobayer hasan provided excellent care during my treatment. His expertise and compassion made all the difference..."
                        rows={3}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Social Media */}
              <div className="bg-card border border-border rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <Award className="text-primary" size={20} />
                    <h3 className="text-lg font-semibold">Social Media Profiles</h3>
                  </div>
                  <button
                    onClick={() => addArrayItem('social_media')}
                    className="px-3 py-1 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                  >
                    Add Social Media
                  </button>
                </div>
                
                <div className="space-y-4">
                  {formData.social_media.map((social, index) => {
                    const selectedPlatform = socialPlatforms.find(p => p.value === social.platform);
                    return (
                      <div key={index} className="p-4 border border-border rounded-lg">
                        <div className="flex justify-between items-center mb-3">
                          <h4 className="font-medium">Social Media {index + 1}</h4>
                          {formData.social_media.length > 1 && (
                            <button
                              onClick={() => removeArrayItem('social_media', index)}
                              className="text-red-500 hover:text-red-700 text-sm"
                            >
                              Remove
                            </button>
                          )}
                        </div>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-sm font-medium mb-2">Platform</label>
                            <p className="text-xs text-muted-foreground mb-2">Choose the social media platform</p>
                            <select
                              value={social.platform}
                              onChange={(e) => handleArrayInputChange('social_media', index, 'platform', e.target.value)}
                              className="w-full p-2 border border-input rounded-md bg-background"
                            >
                              <option value="">Select platform</option>
                              {socialPlatforms.map((platform) => (
                                <option key={platform.value} value={platform.value}>
                                  {platform.label}
                                </option>
                              ))}
                            </select>
                            {selectedPlatform && (
                              <div className="flex items-center space-x-2 mt-2 p-2 bg-accent rounded">
                                <div className={`w-6 h-6 ${selectedPlatform.color} rounded-full flex items-center justify-center`}>
                                  {getSocialIcon(social.platform)}
                                </div>
                                <span className="text-sm font-medium">{selectedPlatform.label}</span>
                              </div>
                            )}
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-2">Profile URL</label>
                            <p className="text-xs text-muted-foreground mb-2">Direct link to your professional profile</p>
                            <input
                              type="url"
                              value={social.profile_url}
                              onChange={(e) => handleArrayInputChange('social_media', index, 'profile_url', e.target.value)}
                              className="w-full p-2 border border-input rounded-md bg-background"
                              placeholder="Ex. https://linkedin.com/in/dr-jobayer-hasan"
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Theme & Display Settings */}
              <div className="bg-card border border-border rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4">Theme & Display Settings</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">Color Theme</label>
                    <p className="text-xs text-muted-foreground mb-2">Choose the primary color scheme for your website</p>
                    <div className="grid grid-cols-4 gap-2">
                      <div 
                        className={`w-12 h-12 bg-blue-500 rounded-lg cursor-pointer border-2 ${formData.website.theme_color === 'blue' ? 'border-blue-600' : 'border-transparent hover:border-blue-600'}`}
                        onClick={() => handleWebsiteChange('theme_color', 'blue')}
                        title="Blue - Professional and trustworthy"
                      ></div>
                      <div 
                        className={`w-12 h-12 bg-green-500 rounded-lg cursor-pointer border-2 ${formData.website.theme_color === 'green' ? 'border-green-600' : 'border-transparent hover:border-green-600'}`}
                        onClick={() => handleWebsiteChange('theme_color', 'green')}
                        title="Green - Health and wellness"
                      ></div>
                      <div 
                        className={`w-12 h-12 bg-purple-500 rounded-lg cursor-pointer border-2 ${formData.website.theme_color === 'purple' ? 'border-purple-600' : 'border-transparent hover:border-purple-600'}`}
                        onClick={() => handleWebsiteChange('theme_color', 'purple')}
                        title="Purple - Modern and sophisticated"
                      ></div>
                      <div 
                        className={`w-12 h-12 bg-red-500 rounded-lg cursor-pointer border-2 ${formData.website.theme_color === 'red' ? 'border-red-600' : 'border-transparent hover:border-red-600'}`}
                        onClick={() => handleWebsiteChange('theme_color', 'red')}
                        title="Red - Emergency and cardiology"
                      ></div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Layout Style</label>
                    <p className="text-xs text-muted-foreground mb-2">Overall design style for your website</p>
                    <select 
                      value={formData.website.layout_style}
                      onChange={(e) => handleWebsiteChange('layout_style', e.target.value)}
                      className="w-full p-2 border border-input rounded-md bg-background"
                    >
                      <option>Modern Card Layout</option>
                      <option>Classic Professional</option>
                      <option>Minimal Clean</option>
                      <option>Medical Focus</option>
                    </select>
                  </div>
                </div>

                <div className="mt-6">
                  <h4 className="text-md font-semibold mb-3">Contact Information Display</h4>
                  <p className="text-xs text-muted-foreground mb-3">Choose which contact details to show on your website</p>
                  <div className="space-y-3">
                    {[
                      {key: 'show_phone', label: 'Show Phone Number', desc: 'Display your phone number for direct calls'},
                      {key: 'show_email', label: 'Show Email Address', desc: 'Allow patients to email you directly'},
                      {key: 'show_address', label: 'Show Office Address', desc: 'Display your practice location'},
                      {key: 'show_appointment', label: 'Show Appointment Button', desc: 'Include a book appointment call-to-action'},
                      {key: 'show_social', label: 'Show Social Media Links', desc: 'Display links to your social profiles'}
                    ].map((item) => (
                      <div key={item.key} className="flex items-center justify-between">
                        <div>
                          <span className="font-medium">{item.label}</span>
                          <p className="text-xs text-muted-foreground">{item.desc}</p>
                        </div>
                        <div className="relative inline-block w-10 mr-2 align-middle select-none">
                          <input 
                            type="checkbox" 
                            checked={formData.website[item.key]}
                            onChange={(e) => handleWebsiteChange(item.key, e.target.checked)}
                            className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer"
                          />
                          <label className="toggle-label block overflow-hidden h-6 rounded-full bg-gray-300 cursor-pointer"></label>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* SEO Settings */}
              <div className="bg-card border border-border rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4">SEO Settings</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Meta Keywords</label>
                    <p className="text-xs text-muted-foreground mb-2">Keywords that help search engines understand your specialty</p>
                    <input 
                      type="text" 
                      value={formData.website.meta_keywords}
                      onChange={(e) => handleWebsiteChange('meta_keywords', e.target.value)}
                      className="w-full p-2 border border-input rounded-md bg-background" 
                      placeholder="cardiologist, heart doctor, cardiac care, medical consultation" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Custom URL Slug</label>
                    <p className="text-xs text-muted-foreground mb-2">Customize the end part of your website URL</p>
                    <div className="flex items-center">
                      <span className="text-sm text-muted-foreground mr-2">https://yoursite.com/</span>
                      <input 
                        type="text" 
                        value={formData.website.url_slug}
                        onChange={(e) => handleWebsiteChange('url_slug', e.target.value)}
                        className="flex-1 p-2 border border-input rounded-md bg-background"
                        placeholder="dr-john-smith-cardiologist" 
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="bg-card border border-border rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4">Preview & Actions</h3>
                <div className="flex flex-wrap gap-3">
                  <button className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors">
                    Preview Website
                  </button>
                  <button className="px-4 py-2 border border-border rounded-md hover:bg-accent transition-colors">
                    Copy Website Link
                  </button>
                  <button 
                    onClick={handleSave}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                  >
                    Publish Changes
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      
      // ... keep existing code for other tab cases (notifications, security, billing, help, default)

      default:
        return (
          <div className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">Select a tab to view content</p>
          </div>
        );
    }
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Left Sidebar - Tabs */}
      <div className="w-64 bg-card border-r border-border flex flex-col">
        <div className="p-6 border-b border-border">
          <h2 className="text-xl font-semibold text-foreground">Dashboard</h2>
        </div>
        
        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <li key={tab.id}>
                  <button
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                      activeTab === tab.id
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                    }`}
                  >
                    <Icon size={20} />
                    <span className="font-medium">{tab.label}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>

      {/* Right Content Area */}
      <div className="flex-1 overflow-auto">
        <div className="p-8">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default VerticleTab;
