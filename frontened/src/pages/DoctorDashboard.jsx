
import React, { useState } from 'react';
import { Save, Edit3, Briefcase, Award, Upload,MapPin ,Settings, User, Bell, Shield, CreditCard, HelpCircle, LogOut, Globe, Calendar, Users, Mail, MessageCircle, BarChart3, FlaskConical, Facebook, Twitter, Instagram, Linkedin, Youtube } from 'lucide-react';

const DoctorDashboard = () => {
  const [activeTab, setActiveTab] = useState('appointments');
  const [selectedPatient, setSelectedPatient] = useState(null);

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
    
    { id: 'appointments', label: 'Appointments', icon: Calendar },
    { id: 'patients', label: 'Patients', icon: Users },
    { id: 'laboratory', label: 'Laboratory', icon: FlaskConical },
    { id: 'chat', label: 'Chat', icon: MessageCircle },
    { id: 'email', label: 'Email', icon: Mail },
    { id: 'calendar', label: 'Calendar', icon: Calendar },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'billing', label: 'Billing', icon: CreditCard },
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'website', label: 'Edit Public Website', icon: Globe },
    { id: 'settings', label: 'Settings', icon: Settings },
    { id: 'security', label: 'Security', icon: Shield },
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
      // ... keep existing code (settings case) the same ...
      case 'settings':
        return (
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">Settings</h1>
              <p className="text-muted-foreground">Manage your application preferences and configurations.</p>
            </div>
            
            <div className="grid gap-6">
              <div className="bg-card border border-border rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4">General Settings</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Dark Mode</p>
                      <p className="text-sm text-muted-foreground">Toggle between light and dark themes</p>
                    </div>
                    <div className="relative inline-block w-10 mr-2 align-middle select-none">
                      <input type="checkbox" className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer"/>
                      <label className="toggle-label block overflow-hidden h-6 rounded-full bg-gray-300 cursor-pointer"></label>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Email Notifications</p>
                      <p className="text-sm text-muted-foreground">Receive updates via email</p>
                    </div>
                    <div className="relative inline-block w-10 mr-2 align-middle select-none">
                      <input type="checkbox" className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer"/>
                      <label className="toggle-label block overflow-hidden h-6 rounded-full bg-gray-300 cursor-pointer"></label>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-card border border-border rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4">Language & Region</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Language</label>
                    <select className="w-full p-2 border border-input rounded-md bg-background">
                      <option>English</option>
                      <option>Spanish</option>
                      <option>French</option>
                      <option>German</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Timezone</label>
                    <select className="w-full p-2 border border-input rounded-md bg-background">
                      <option>UTC-5 (Eastern Time)</option>
                      <option>UTC-8 (Pacific Time)</option>
                      <option>UTC+0 (GMT)</option>
                      <option>UTC+1 (Central European Time)</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      // ... keep existing code (profile case) the same ...
      case 'profile':
        return (
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">Profile</h1>
              <p className="text-muted-foreground">Manage your personal information and preferences.</p>
            </div>
            
            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-center space-x-4 mb-6">
                <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center">
                  <User className="w-10 h-10 text-primary-foreground" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold">John Doe</h3>
                  <p className="text-muted-foreground">john.doe@example.com</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">First Name</label>
                  <input type="text" defaultValue="John" className="w-full p-2 border border-input rounded-md bg-background" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Last Name</label>
                  <input type="text" defaultValue="Doe" className="w-full p-2 border border-input rounded-md bg-background" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Email</label>
                  <input type="email" defaultValue="john.doe@example.com" className="w-full p-2 border border-input rounded-md bg-background" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Phone</label>
                  <input type="tel" defaultValue="+1 (555) 123-4567" className="w-full p-2 border border-input rounded-md bg-background" />
                </div>
              </div>
            </div>
          </div>
        );

      // ... keep existing code (website case) the same ...
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


      case 'appointments':
        return (
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">Appointments</h1>
              <p className="text-muted-foreground">Manage patient appointments and scheduling.</p>
            </div>
            
            <div className="grid gap-6">
              {/* Today's Appointments */}
              <div className="bg-card border border-border rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Today's Appointments</h3>
                  <button className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors">
                    New Appointment
                  </button>
                </div>
                <div className="space-y-3">
                  {[
                    { time: '09:00 AM', patient: 'John Smith', type: 'Consultation', status: 'Confirmed' },
                    { time: '10:30 AM', patient: 'Mary Johnson', type: 'Follow-up', status: 'Pending' },
                    { time: '02:00 PM', patient: 'David Brown', type: 'Check-up', status: 'Confirmed' },
                  ].map((appointment, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border border-border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="text-sm font-medium text-primary">{appointment.time}</div>
                        <div>
                          <p className="font-medium">{appointment.patient}</p>
                          <p className="text-sm text-muted-foreground">{appointment.type}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          appointment.status === 'Confirmed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {appointment.status}
                        </span>
                        <button className="px-3 py-1 text-sm border border-border rounded hover:bg-accent">
                          Edit
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Appointment Statistics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-card border border-border rounded-lg p-4">
                  <h4 className="font-medium text-muted-foreground mb-2">Today</h4>
                  <p className="text-2xl font-bold">8</p>
                  <p className="text-sm text-green-600">+2 from yesterday</p>
                </div>
                <div className="bg-card border border-border rounded-lg p-4">
                  <h4 className="font-medium text-muted-foreground mb-2">This Week</h4>
                  <p className="text-2xl font-bold">45</p>
                  <p className="text-sm text-blue-600">+5 from last week</p>
                </div>
                <div className="bg-card border border-border rounded-lg p-4">
                  <h4 className="font-medium text-muted-foreground mb-2">This Month</h4>
                  <p className="text-2xl font-bold">187</p>
                  <p className="text-sm text-purple-600">+12 from last month</p>
                </div>
              </div>

              {/* Appointment Settings */}
              <div className="bg-card border border-border rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4">Appointment Settings</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Default Appointment Duration</label>
                    <select className="w-full p-2 border border-input rounded-md bg-background">
                      <option>15 minutes</option>
                      <option>30 minutes</option>
                      <option>45 minutes</option>
                      <option>1 hour</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Working Hours</label>
                    <select className="w-full p-2 border border-input rounded-md bg-background">
                      <option>9:00 AM - 5:00 PM</option>
                      <option>8:00 AM - 6:00 PM</option>
                      <option>10:00 AM - 4:00 PM</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'patients':
        return (
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">Patients</h1>
              <p className="text-muted-foreground">Manage patient records and information.</p>
            </div>
            
            <div className="grid gap-6">
              {/* Search and Filters */}
              <div className="bg-card border border-border rounded-lg p-6">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <input 
                      type="text" 
                      placeholder="Search patients by name, ID, or phone..."
                      className="w-full p-2 border border-input rounded-md bg-background"
                    />
                  </div>
                  <button className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors">
                    Add New Patient
                  </button>
                </div>
              </div>

              {/* Patient List */}
              <div className="bg-card border border-border rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4">Recent Patients</h3>
                <div className="space-y-3">
                  {[
                    { id: 'P001', name: 'Alice Wilson', age: 34, phone: '+1-555-0123', lastVisit: '2024-12-10' },
                    { id: 'P002', name: 'Bob Chen', age: 45, phone: '+1-555-0124', lastVisit: '2024-12-09' },
                    { id: 'P003', name: 'Carol Davis', age: 28, phone: '+1-555-0125', lastVisit: '2024-12-08' },
                  ].map((patient, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border border-border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                          <User className="w-5 h-5 text-primary-foreground" />
                        </div>
                        <div>
                          <p className="font-medium">{patient.name}</p>
                          <p className="text-sm text-muted-foreground">ID: {patient.id} • Age: {patient.age}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <p className="text-sm font-medium">{patient.phone}</p>
                          <p className="text-xs text-muted-foreground">Last visit: {patient.lastVisit}</p>
                        </div>
                        <button className="px-3 py-1 text-sm border border-border rounded hover:bg-accent">
                          View
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Patient Statistics */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-card border border-border rounded-lg p-4">
                  <h4 className="font-medium text-muted-foreground mb-2">Total Patients</h4>
                  <p className="text-2xl font-bold">1,247</p>
                </div>
                <div className="bg-card border border-border rounded-lg p-4">
                  <h4 className="font-medium text-muted-foreground mb-2">New This Month</h4>
                  <p className="text-2xl font-bold">34</p>
                </div>
                <div className="bg-card border border-border rounded-lg p-4">
                  <h4 className="font-medium text-muted-foreground mb-2">Active Patients</h4>
                  <p className="text-2xl font-bold">892</p>
                </div>
                <div className="bg-card border border-border rounded-lg p-4">
                  <h4 className="font-medium text-muted-foreground mb-2">Follow-ups Due</h4>
                  <p className="text-2xl font-bold">23</p>
                </div>
              </div>
            </div>
          </div>
        );

       
      case 'laboratory':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-foreground mb-2">Laboratory Management</h1>
                <p className="text-muted-foreground">Comprehensive patient lab reports, prescriptions, and clinical decision support.</p>
              </div>
              <div className="flex space-x-3">
                <button className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors">
                  New Test Order
                </button>
                <button className="px-4 py-2 border border-border rounded-md hover:bg-accent transition-colors">
                  Bulk Actions
                </button>
              </div>
            </div>

            {/* Laboratory Statistics Dashboard */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-card border border-border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-muted-foreground">Today's Reports</h4>
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                </div>
                <p className="text-2xl font-bold mb-1">24</p>
                <div className="flex items-center space-x-4 text-sm">
                  <span className="text-red-600">8 Pending</span>
                  <span className="text-yellow-600">6 Processing</span>
                  <span className="text-green-600">10 Done</span>
                </div>
              </div>
              
              <div className="bg-card border border-border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-muted-foreground">Urgent Reports</h4>
                  <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                </div>
                <p className="text-2xl font-bold mb-1 text-red-600">5</p>
                <p className="text-sm text-muted-foreground">Require immediate attention</p>
              </div>

              <div className="bg-card border border-border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-muted-foreground">Unreviewed</h4>
                  <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                </div>
                <p className="text-2xl font-bold mb-1 text-orange-600">12</p>
                <p className="text-sm text-muted-foreground">Awaiting doctor review</p>
              </div>

              <div className="bg-card border border-border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-muted-foreground">This Week</h4>
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                </div>
                <p className="text-2xl font-bold mb-1">156</p>
                <p className="text-sm text-green-600">+23% from last week</p>
              </div>
            </div>

            {/* Quick Filters */}
            <div className="bg-card border border-border rounded-lg p-4">
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-sm font-medium text-muted-foreground">Quick Filters:</span>
                {[
                  { label: 'Urgent', count: 5, color: 'bg-red-100 text-red-800 border-red-200' },
                  { label: 'Processing', count: 12, color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
                  { label: 'Unreviewed', count: 8, color: 'bg-orange-100 text-orange-800 border-orange-200' },
                  { label: 'Done Today', count: 15, color: 'bg-green-100 text-green-800 border-green-200' },
                  { label: 'Critical Values', count: 3, color: 'bg-purple-100 text-purple-800 border-purple-200' }
                ].map((filter) => (
                  <button
                    key={filter.label}
                    className={`px-3 py-1 text-xs font-medium rounded-full border transition-colors hover:opacity-80 ${filter.color}`}
                  >
                    {filter.label} ({filter.count})
                  </button>
                ))}
              </div>
            </div>

            {/* Patient Selection */}
            <div className="bg-card border border-border rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Patient Selection & Search</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <input 
                    type="text" 
                    placeholder="Search by patient name, ID, or phone..."
                    className="w-full p-3 border border-input rounded-md bg-background focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
                <div>
                  <select className="w-full p-3 border border-input rounded-md bg-background focus:ring-2 focus:ring-primary focus:border-transparent">
                    <option>All Departments</option>
                    <option>Cardiology</option>
                    <option>Endocrinology</option>
                    <option>General Medicine</option>
                    <option>Nephrology</option>
                    <option>Hematology</option>
                  </select>
                </div>
                <div>
                  <select className="w-full p-3 border border-input rounded-md bg-background focus:ring-2 focus:ring-primary focus:border-transparent">
                    <option>All Statuses</option>
                    <option>Urgent</option>
                    <option>Processing</option>
                    <option>Unreviewed</option>
                    <option>Done</option>
                  </select>
                </div>
              </div>
              
              {/* Priority Patients */}
              <div className="mt-6 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-sm text-muted-foreground">PRIORITY PATIENTS</h4>
                  <span className="text-xs text-red-600 font-medium">5 patients need immediate attention</span>
                </div>
                {[
                  { 
                    id: 'P001', 
                    name: 'Alice Wilson', 
                    age: 34, 
                    lastVisit: '2024-12-10', 
                    urgentReports: 2, 
                    status: 'Critical',
                    statusColor: 'bg-red-100 text-red-800 border-red-300'
                  },
                  { 
                    id: 'P002', 
                    name: 'Bob Chen', 
                    age: 45, 
                    lastVisit: '2024-12-09', 
                    urgentReports: 0, 
                    status: 'Processing',
                    statusColor: 'bg-yellow-100 text-yellow-800 border-yellow-300'
                  },
                  { 
                    id: 'P003', 
                    name: 'Carol Davis', 
                    age: 28, 
                    lastVisit: '2024-12-08', 
                    urgentReports: 1, 
                    status: 'Unreviewed',
                    statusColor: 'bg-orange-100 text-orange-800 border-orange-300'
                  },
                ].map((patient) => (
                  <div 
                    key={patient.id} 
                    className={`flex items-center justify-between p-4 border border-border rounded-lg cursor-pointer transition-all hover:shadow-md ${
                      selectedPatient?.id === patient.id ? 'bg-accent border-primary shadow-md' : 'hover:bg-accent/50'
                    }`}
                    onClick={() => setSelectedPatient(patient)}
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
                        <User className="w-6 h-6 text-primary-foreground" />
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <p className="font-semibold">{patient.name}</p>
                          <span className={`text-xs px-2 py-1 rounded-full border font-medium ${patient.statusColor}`}>
                            {patient.status}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">ID: {patient.id} • Age: {patient.age} • Last Visit: {patient.lastVisit}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      {patient.urgentReports > 0 && (
                        <div className="flex items-center space-x-1">
                          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                          <span className="text-xs font-medium text-red-600">
                            {patient.urgentReports} Urgent
                          </span>
                        </div>
                      )}
                      <button className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors">
                        View Reports
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {selectedPatient && (
              <>
                {/* Enhanced Patient Overview */}
                <div className="bg-card border border-border rounded-lg p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-4">
                      <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center">
                        <User className="w-8 h-8 text-primary-foreground" />
                      </div>
                      <div>
                        <div className="flex items-center space-x-3 mb-1">
                          <h3 className="text-xl font-bold">{selectedPatient.name}</h3>
                          <span className={`text-xs px-3 py-1 rounded-full border font-medium ${selectedPatient.statusColor}`}>
                            {selectedPatient.status}
                          </span>
                        </div>
                        <p className="text-muted-foreground mb-2">Patient ID: {selectedPatient.id} • Age: {selectedPatient.age}</p>
                        <div className="flex items-center space-x-6 text-sm">
                          <span className="flex items-center space-x-1">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span>Active Patient</span>
                          </span>
                          <span className="text-muted-foreground">Last Visit: {selectedPatient.lastVisit}</span>
                          <span className="text-muted-foreground">Department: Endocrinology</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors">
                        New Test Order
                      </button>
                      <button className="px-4 py-2 border border-border rounded-md hover:bg-accent transition-colors">
                        Print Reports
                      </button>
                      <button className="px-4 py-2 border border-border rounded-md hover:bg-accent transition-colors">
                        Export Data
                      </button>
                    </div>
                  </div>
                </div>

                {/* Enhanced AI Clinical Decision Support */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-bold">AI</span>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-blue-900">Clinical Decision Support System</h3>
                      <p className="text-sm text-blue-700">AI-powered analysis of patient data</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    {/* Critical Alerts */}
                    <div className="bg-white rounded-lg p-4 border border-blue-100">
                      <h4 className="font-medium text-red-900 mb-3 flex items-center space-x-2">
                        <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                        <span>🚨 Critical Alerts</span>
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div className="p-2 bg-red-50 border border-red-200 rounded">
                          <p className="font-medium text-red-800">Blood Sugar: 185 mg/dL ↑</p>
                          <p className="text-red-600 text-xs">Above target range (80-130 mg/dL)</p>
                        </div>
                        <div className="p-2 bg-yellow-50 border border-yellow-200 rounded">
                          <p className="font-medium text-yellow-800">HbA1c: 6.8% ↑</p>
                          <p className="text-yellow-600 text-xs">Trending upward from 6.5%</p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Trends Analysis */}
                    <div className="bg-white rounded-lg p-4 border border-blue-100">
                      <h4 className="font-medium text-blue-900 mb-3">📈 Trend Analysis</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between items-center">
                          <span>Glucose Control</span>
                          <span className="text-red-600 font-medium">Worsening</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span>Cholesterol</span>
                          <span className="text-green-600 font-medium">Improving</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span>Blood Pressure</span>
                          <span className="text-blue-600 font-medium">Stable</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* AI Recommendations */}
                    <div className="bg-white rounded-lg p-4 border border-blue-100">
                      <h4 className="font-medium text-blue-900 mb-3">💡 AI Recommendations</h4>
                      <ul className="space-y-2 text-sm">
                        <li className="flex items-start space-x-2">
                          <span className="text-blue-600 font-bold">•</span>
                          <span>Consider increasing Metformin to 1000mg BID</span>
                        </li>
                        <li className="flex items-start space-x-2">
                          <span className="text-green-600 font-bold">•</span>
                          <span>Continue current statin therapy</span>
                        </li>
                        <li className="flex items-start space-x-2">
                          <span className="text-orange-600 font-bold">•</span>
                          <span>Schedule HbA1c recheck in 3 months</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Enhanced Lab Reports Management */}
                <div className="bg-card border border-border rounded-lg">
                  <div className="border-b border-border">
                    <nav className="flex space-x-8 px-6">
                      {[
                        { id: 'new-reports', label: 'New Reports', count: 3, color: 'bg-red-500' },
                        { id: 'processing', label: 'Processing', count: 2, color: 'bg-yellow-500' },
                        { id: 'history', label: 'Report History', count: 15, color: 'bg-blue-500' },
                        { id: 'prescriptions', label: 'Prescriptions', count: 8, color: 'bg-green-500' },
                        { id: 'trends', label: 'Trends & Analysis', count: null, color: 'bg-purple-500' }
                      ].map((tab) => (
                        <button
                          key={tab.id}
                          className="flex items-center space-x-2 py-4 border-b-2 border-transparent hover:border-primary text-muted-foreground hover:text-foreground transition-colors relative"
                        >
                          <span>{tab.label}</span>
                          {tab.count && (
                            <div className="flex items-center space-x-1">
                              <div className={`w-2 h-2 rounded-full ${tab.color}`}></div>
                              <span className="bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full font-medium">
                                {tab.count}
                              </span>
                            </div>
                          )}
                        </button>
                      ))}
                    </nav>
                  </div>

                  <div className="p-6">
                    {/* Enhanced New Reports Section */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-lg font-semibold flex items-center space-x-2">
                          <span>New Reports</span>
                          <span className="text-sm bg-red-100 text-red-800 px-2 py-1 rounded-full">Requires Attention</span>
                        </h4>
                        <div className="flex space-x-2">
                          <button className="text-sm text-primary hover:underline">Mark All as Reviewed</button>
                          <button className="text-sm border border-border px-3 py-1 rounded hover:bg-accent">Bulk Actions</button>
                        </div>
                      </div>
                      
                      {[
                        {
                          id: 'R001',
                          testName: 'Comprehensive Metabolic Panel',
                          date: '2024-12-10',
                          time: '09:15 AM',
                          status: 'Urgent',
                          statusColor: 'bg-red-500',
                          priority: 'High',
                          abnormal: ['Glucose: 185 mg/dL', 'HbA1c: 6.8%'],
                          doctor: 'Dr. Sarah Johnson',
                          lab: 'Central Lab',
                          processingTime: '2h 30m'
                        },
                        {
                          id: 'R002',
                          testName: 'Lipid Profile Complete',
                          date: '2024-12-09',
                          time: '02:30 PM',
                          status: 'Processing',
                          statusColor: 'bg-yellow-500',
                          priority: 'Normal',
                          abnormal: [],
                          doctor: 'Dr. Sarah Johnson',
                          lab: 'Cardio Lab',
                          processingTime: '45m'
                        },
                        {
                          id: 'R003',
                          testName: 'Complete Blood Count with Diff',
                          date: '2024-12-08',
                          time: '11:45 AM',
                          status: 'Done',
                          statusColor: 'bg-green-500',
                          priority: 'Normal',
                          abnormal: ['WBC: 11.2 K/μL'],
                          doctor: 'Dr. Sarah Johnson',
                          lab: 'Hematology Lab',
                          processingTime: '1h 15m'
                        }
                      ].map((report) => (
                        <div key={report.id} className="border border-border rounded-lg p-5 hover:shadow-md transition-all">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center space-x-3">
                              <div className={`w-4 h-4 rounded-full ${
                                report.status === 'Urgent' ? 'bg-red-500 animate-pulse' : 
                                report.status === 'Processing' ? 'bg-yellow-500' : 'bg-green-500'
                              }`}></div>
                              <h5 className="font-semibold text-lg">{report.testName}</h5>
                              <span className="text-sm text-muted-foreground">#{report.id}</span>
                              <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                                report.priority === 'High' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
                              }`}>
                                {report.priority} Priority
                              </span>
                            </div>
                            <div className="flex items-center space-x-3">
                              <div className="text-right text-sm">
                                <p className="font-medium">{report.date} at {report.time}</p>
                                <p className="text-muted-foreground">Processing: {report.processingTime}</p>
                              </div>
                              <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                                report.status === 'Urgent' ? 'bg-red-100 text-red-800' :
                                report.status === 'Processing' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-green-100 text-green-800'
                              }`}>
                                {report.status}
                              </span>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
                            <div className="space-y-2">
                              <p className="text-sm"><span className="font-medium">Ordered by:</span> {report.doctor}</p>
                              <p className="text-sm"><span className="font-medium">Laboratory:</span> {report.lab}</p>
                              {report.abnormal.length > 0 && (
                                <div>
                                  <p className="text-sm font-medium text-red-600 mb-1">Abnormal Values:</p>
                                  <div className="space-y-1">
                                    {report.abnormal.map((value, index) => (
                                      <span key={index} className="inline-block text-xs bg-red-50 text-red-700 px-2 py-1 rounded mr-2">
                                        {value}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                            <div className="flex justify-end items-start space-x-2">
                              <button className="px-3 py-2 text-sm border border-border rounded hover:bg-accent transition-colors">
                                View Details
                              </button>
                              <button className="px-3 py-2 text-sm border border-border rounded hover:bg-accent transition-colors">
                                Compare Previous
                              </button>
                              {report.status !== 'Done' && (
                                <button className="px-3 py-2 text-sm bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors">
                                  Review & Sign
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Quick Results Preview */}
                          <div className="bg-muted/30 rounded-lg p-4">
                            <div className="flex items-center justify-between mb-3">
                              <h6 className="text-sm font-medium">Key Results Summary</h6>
                              <button className="text-xs text-primary hover:underline">View Full Report</button>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                              <div className="bg-white rounded p-2">
                                <span className="text-muted-foreground block">Glucose</span>
                                <span className={`font-semibold ${report.testName.includes('Metabolic') ? 'text-red-600' : 'text-green-600'}`}>
                                  {report.testName.includes('Metabolic') ? '185 mg/dL ↑' : '95 mg/dL'}
                                </span>
                              </div>
                              <div className="bg-white rounded p-2">
                                <span className="text-muted-foreground block">Cholesterol</span>
                                <span className="font-semibold text-green-600">180 mg/dL ↓</span>
                              </div>
                              <div className="bg-white rounded p-2">
                                <span className="text-muted-foreground block">HDL</span>
                                <span className="font-semibold">45 mg/dL</span>
                              </div>
                              <div className="bg-white rounded p-2">
                                <span className="text-muted-foreground block">LDL</span>
                                <span className="font-semibold">120 mg/dL</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Report History */}
                    <div className="mt-8 space-y-4">
                      <h4 className="text-lg font-semibold">Report History</h4>
                      <div className="space-y-2">
                        {[
                          { date: '2024-11-15', test: 'HbA1c Test', result: '6.5%', status: 'Reviewed' },
                          { date: '2024-10-20', test: 'Lipid Profile', result: 'Normal', status: 'Reviewed' },
                          { date: '2024-09-25', test: 'Blood Sugar', result: '160 mg/dL', status: 'Reviewed' },
                          { date: '2024-08-30', test: 'Complete Blood Count', result: 'Normal', status: 'Reviewed' },
                        ].map((historyItem, index) => (
                          <div key={index} className="flex items-center justify-between py-2 border-b border-border last:border-b-0">
                            <div className="flex items-center space-x-4">
                              <span className="text-sm text-muted-foreground w-20">{historyItem.date}</span>
                              <span className="font-medium">{historyItem.test}</span>
                              <span className="text-sm">{historyItem.result}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                                {historyItem.status}
                              </span>
                              <button className="text-sm text-primary hover:underline">View</button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Prescription Writing */}
                    <div className="mt-8 space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-lg font-semibold">Current Prescriptions</h4>
                        <button className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors">
                          Write New Prescription
                        </button>
                      </div>
                      
                      <div className="grid gap-4">
                        {[
                          {
                            medication: 'Metformin',
                            dosage: '500mg twice daily',
                            prescribed: '2024-11-15',
                            duration: '3 months',
                            remaining: '45 days'
                          },
                          {
                            medication: 'Atorvastatin',
                            dosage: '20mg once daily',
                            prescribed: '2024-10-20',
                            duration: '6 months',
                            remaining: '75 days'
                          }
                        ].map((prescription, index) => (
                          <div key={index} className="border border-border rounded-lg p-4">
                            <div className="flex items-center justify-between mb-2">
                              <h5 className="font-medium text-lg">{prescription.medication}</h5>
                              <div className="flex space-x-2">
                                <button className="px-3 py-1 text-sm border border-border rounded hover:bg-accent">
                                  Modify
                                </button>
                                <button className="px-3 py-1 text-sm bg-red-100 text-red-800 rounded hover:bg-red-200">
                                  Discontinue
                                </button>
                              </div>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm text-muted-foreground">
                              <div>
                                <span className="font-medium">Dosage:</span> {prescription.dosage}
                              </div>
                              <div>
                                <span className="font-medium">Prescribed:</span> {prescription.prescribed}
                              </div>
                              <div>
                                <span className="font-medium">Duration:</span> {prescription.duration}
                              </div>
                              <div>
                                <span className="font-medium">Remaining:</span> {prescription.remaining}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}

            {!selectedPatient && (
              <div className="bg-muted/20 border-2 border-dashed border-muted-foreground/20 rounded-lg p-16 text-center">
                <FlaskConical className="w-20 h-20 text-muted-foreground/50 mx-auto mb-6" />
                <h3 className="text-xl font-medium text-muted-foreground mb-3">Select a Patient to Begin</h3>
                <p className="text-muted-foreground mb-4">Choose a patient from the priority list above to view their comprehensive lab reports, prescriptions, and clinical data.</p>
                <div className="flex justify-center space-x-3">
                  <button className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors">
                    Search All Patients
                  </button>
                  <button className="px-4 py-2 border border-border rounded-md hover:bg-accent transition-colors">
                    Recent Reports
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      
      case 'chat':
        return (
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">Chat</h1>
              <p className="text-muted-foreground">Communicate with patients and colleagues.</p>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
              {/* Chat List */}
              <div className="bg-card border border-border rounded-lg p-4">
                <h3 className="text-lg font-semibold mb-4">Conversations</h3>
                <div className="space-y-2">
                  {[
                    { name: 'John Smith', message: 'Thank you for the consultation', time: '10:30 AM', unread: 2 },
                    { name: 'Mary Johnson', message: 'When should I take the medication?', time: '9:45 AM', unread: 0 },
                    { name: 'David Brown', message: 'Appointment confirmation needed', time: 'Yesterday', unread: 1 },
                  ].map((chat, index) => (
                    <div key={index} className="flex items-center space-x-3 p-3 rounded-lg hover:bg-accent cursor-pointer">
                      <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-primary-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{chat.name}</p>
                        <p className="text-sm text-muted-foreground truncate">{chat.message}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">{chat.time}</p>
                        {chat.unread > 0 && (
                          <span className="inline-block w-5 h-5 bg-primary text-primary-foreground text-xs rounded-full text-center">
                            {chat.unread}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Chat Window */}
              <div className="lg:col-span-2 bg-card border border-border rounded-lg flex flex-col">
                <div className="p-4 border-b border-border">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-primary-foreground" />
                    </div>
                    <div>
                      <p className="font-medium">John Smith</p>
                      <p className="text-sm text-green-600">Online</p>
                    </div>
                  </div>
                </div>
                
                <div className="flex-1 p-4 space-y-4 overflow-y-auto">
                  <div className="flex justify-start">
                    <div className="bg-accent p-3 rounded-lg max-w-xs">
                      <p className="text-sm">Hello Doctor, I have some questions about my medication.</p>
                      <p className="text-xs text-muted-foreground mt-1">10:25 AM</p>
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <div className="bg-primary text-primary-foreground p-3 rounded-lg max-w-xs">
                      <p className="text-sm">Hi John! I'm happy to help. What would you like to know?</p>
                      <p className="text-xs text-primary-foreground/70 mt-1">10:26 AM</p>
                    </div>
                  </div>
                  <div className="flex justify-start">
                    <div className="bg-accent p-3 rounded-lg max-w-xs">
                      <p className="text-sm">Should I take it before or after meals?</p>
                      <p className="text-xs text-muted-foreground mt-1">10:28 AM</p>
                    </div>
                  </div>
                </div>
                
                <div className="p-4 border-t border-border">
                  <div className="flex items-center space-x-2">
                    <input 
                      type="text" 
                      placeholder="Type your message..."
                      className="flex-1 p-2 border border-input rounded-md bg-background"
                    />
                    <button className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors">
                      Send
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'email':
        return (
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">Email</h1>
              <p className="text-muted-foreground">Manage your email communications.</p>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Email Sidebar */}
              <div className="bg-card border border-border rounded-lg p-4">
                <button className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors mb-4">
                  Compose
                </button>
                <nav className="space-y-2">
                  {[
                    { name: 'Inbox', count: 12 },
                    { name: 'Sent', count: 0 },
                    { name: 'Drafts', count: 3 },
                    { name: 'Spam', count: 0 },
                    { name: 'Trash', count: 0 },
                  ].map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-2 rounded hover:bg-accent cursor-pointer">
                      <span className="font-medium">{item.name}</span>
                      {item.count > 0 && (
                        <span className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded-full">
                          {item.count}
                        </span>
                      )}
                    </div>
                  ))}
                </nav>
              </div>

              {/* Email List */}
              <div className="lg:col-span-3 bg-card border border-border rounded-lg">
                <div className="p-4 border-b border-border">
                  <h3 className="text-lg font-semibold">Inbox</h3>
                </div>
                <div className="divide-y divide-border">
                  {[
                    { from: 'john.smith@email.com', subject: 'Thank you for the consultation', time: '2:30 PM', unread: true },
                    { from: 'mary.johnson@email.com', subject: 'Prescription refill request', time: '11:45 AM', unread: true },
                    { from: 'admin@hospital.com', subject: 'Monthly schedule update', time: 'Yesterday', unread: false },
                    { from: 'david.brown@email.com', subject: 'Appointment rescheduling', time: 'Dec 10', unread: false },
                  ].map((email, index) => (
                    <div key={index} className={`p-4 hover:bg-accent cursor-pointer ${email.unread ? 'bg-blue-50' : ''}`}>
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <p className={`font-medium ${email.unread ? 'text-foreground' : 'text-muted-foreground'}`}>
                              {email.from}
                            </p>
                            {email.unread && <div className="w-2 h-2 bg-blue-500 rounded-full"></div>}
                          </div>
                          <p className={`${email.unread ? 'font-medium' : 'text-muted-foreground'}`}>
                            {email.subject}
                          </p>
                        </div>
                        <p className="text-sm text-muted-foreground">{email.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );

      case 'calendar':
        return (
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">Calendar</h1>
              <p className="text-muted-foreground">View and manage your schedule like Google Calendar.</p>
            </div>
            
            <div className="grid gap-6">
              {/* Calendar Header */}
              <div className="bg-card border border-border rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <h3 className="text-xl font-semibold">December 2024</h3>
                    <div className="flex items-center space-x-2">
                      <button className="px-3 py-1 border border-border rounded hover:bg-accent">‹</button>
                      <button className="px-3 py-1 border border-border rounded hover:bg-accent">Today</button>
                      <button className="px-3 py-1 border border-border rounded hover:bg-accent">›</button>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <select className="p-2 border border-input rounded-md bg-background">
                      <option>Month</option>
                      <option>Week</option>
                      <option>Day</option>
                    </select>
                    <button className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors">
                      New Event
                    </button>
                  </div>
                </div>
              </div>

              {/* Calendar Grid */}
              <div className="bg-card border border-border rounded-lg p-4">
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                    <div key={day} className="p-2 text-center font-medium text-muted-foreground">
                      {day}
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {Array.from({ length: 35 }, (_, i) => {
                    const date = i - 6 + 1;
                    const isCurrentMonth = date > 0 && date <= 31;
                    const isToday = date === 11;
                    const hasEvent = [5, 11, 15, 20, 25].includes(date);
                    
                    return (
                      <div key={i} className={`p-2 h-24 border border-border ${isCurrentMonth ? 'bg-background' : 'bg-muted'} ${isToday ? 'bg-blue-50 border-blue-200' : ''}`}>
                        {isCurrentMonth && (
                          <>
                            <div className={`text-sm ${isToday ? 'font-bold text-blue-600' : 'text-foreground'}`}>
                              {date}
                            </div>
                            {hasEvent && (
                              <div className="mt-1">
                                <div className="bg-blue-500 text-white text-xs px-1 py-0.5 rounded truncate">
                                  Appointment
                                </div>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Upcoming Events */}
              <div className="bg-card border border-border rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4">Upcoming Events</h3>
                <div className="space-y-3">
                  {[
                    { title: 'Patient Consultation - John Smith', time: 'Today, 2:00 PM', type: 'appointment' },
                    { title: 'Medical Conference', time: 'Tomorrow, 9:00 AM', type: 'event' },
                    { title: 'Staff Meeting', time: 'Dec 15, 10:00 AM', type: 'meeting' },
                  ].map((event, index) => (
                    <div key={index} className="flex items-center space-x-3 p-3 border border-border rounded-lg">
                      <div className={`w-3 h-3 rounded-full ${
                        event.type === 'appointment' ? 'bg-blue-500' : 
                        event.type === 'event' ? 'bg-green-500' : 'bg-purple-500'
                      }`}></div>
                      <div className="flex-1">
                        <p className="font-medium">{event.title}</p>
                        <p className="text-sm text-muted-foreground">{event.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );

      case 'analytics':
        return (
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">Analytics</h1>
              <p className="text-muted-foreground">View practice insights and performance metrics.</p>
            </div>
            
            <div className="grid gap-6">
              {/* Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-card border border-border rounded-lg p-4">
                  <h4 className="font-medium text-muted-foreground mb-2">Total Patients</h4>
                  <p className="text-2xl font-bold">1,247</p>
                  <p className="text-sm text-green-600">+12% from last month</p>
                </div>
                <div className="bg-card border border-border rounded-lg p-4">
                  <h4 className="font-medium text-muted-foreground mb-2">Appointments</h4>
                  <p className="text-2xl font-bold">187</p>
                  <p className="text-sm text-blue-600">+8% from last month</p>
                </div>
                <div className="bg-card border border-border rounded-lg p-4">
                  <h4 className="font-medium text-muted-foreground mb-2">Revenue</h4>
                  <p className="text-2xl font-bold">$24,650</p>
                  <p className="text-sm text-purple-600">+15% from last month</p>
                </div>
                <div className="bg-card border border-border rounded-lg p-4">
                  <h4 className="font-medium text-muted-foreground mb-2">Satisfaction</h4>
                  <p className="text-2xl font-bold">4.8/5</p>
                  <p className="text-sm text-yellow-600">+0.2 from last month</p>
                </div>
              </div>

              {/* Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-card border border-border rounded-lg p-6">
                  <h3 className="text-lg font-semibold mb-4">Patient Growth</h3>
                  <div className="h-64 flex items-center justify-center text-muted-foreground">
                    [Chart Placeholder - Patient Growth Over Time]
                  </div>
                </div>
                <div className="bg-card border border-border rounded-lg p-6">
                  <h3 className="text-lg font-semibold mb-4">Appointment Types</h3>
                  <div className="h-64 flex items-center justify-center text-muted-foreground">
                    [Chart Placeholder - Appointment Distribution]
                  </div>
                </div>
              </div>

              {/* Popular Services */}
              <div className="bg-card border border-border rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4">Most Popular Services</h3>
                <div className="space-y-3">
                  {[
                    { service: 'General Consultation', count: 145, percentage: 78 },
                    { service: 'Follow-up Visits', count: 89, percentage: 48 },
                    { service: 'Health Check-ups', count: 67, percentage: 36 },
                    { service: 'Vaccination', count: 34, percentage: 18 },
                  ].map((item, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <p className="font-medium">{item.service}</p>
                          <span className="text-sm text-muted-foreground">{item.count} visits</span>
                        </div>
                        <div className="w-full bg-secondary rounded-full h-2">
                          <div className="bg-primary h-2 rounded-full" style={{ width: `${item.percentage}%` }}></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Performance Summary */}
              <div className="bg-card border border-border rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4">Monthly Performance Summary</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <p className="text-2xl font-bold text-green-600">96%</p>
                    <p className="text-sm text-green-700">On-time Appointments</p>
                  </div>
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <p className="text-2xl font-bold text-blue-600">4.2 min</p>
                    <p className="text-sm text-blue-700">Avg Wait Time</p>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <p className="text-2xl font-bold text-purple-600">23 min</p>
                    <p className="text-sm text-purple-700">Avg Consultation</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      // ... keep existing code (notifications case) the same ...
      case 'notifications':
        return (
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">Notifications</h1>
              <p className="text-muted-foreground">Configure how you receive notifications.</p>
            </div>
            
            <div className="bg-card border border-border rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Notification Preferences</h3>
              <div className="space-y-4">
                {['Email notifications', 'Push notifications', 'SMS alerts', 'Browser notifications'].map((item) => (
                  <div key={item} className="flex items-center justify-between">
                    <span className="font-medium">{item}</span>
                    <div className="relative inline-block w-10 mr-2 align-middle select-none">
                      <input type="checkbox" className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer"/>
                      <label className="toggle-label block overflow-hidden h-6 rounded-full bg-gray-300 cursor-pointer"></label>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      
      // ... keep existing code (security case) the same ...
      case 'security':
        return (
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">Security</h1>
              <p className="text-muted-foreground">Manage your account security settings.</p>
            </div>
            
            <div className="bg-card border border-border rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Password & Authentication</h3>
              <div className="space-y-4">
                <button className="w-full md:w-auto px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors">
                  Change Password
                </button>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Two-Factor Authentication</p>
                    <p className="text-sm text-muted-foreground">Add an extra layer of security</p>
                  </div>
                  <button className="px-4 py-2 border border-border rounded-md hover:bg-accent transition-colors">
                    Enable
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      
      // ... keep existing code (billing case) the same ...
      case 'billing':
        return (
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">Billing</h1>
              <p className="text-muted-foreground">Manage your subscription and payment methods.</p>
            </div>
            
            <div className="bg-card border border-border rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Current Plan</h3>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Pro Plan</p>
                  <p className="text-sm text-muted-foreground">$29/month • Next billing: Dec 15, 2024</p>
                </div>
                <button className="px-4 py-2 border border-border rounded-md hover:bg-accent transition-colors">
                  Upgrade
                </button>
              </div>
            </div>
          </div>
        );
      
      // ... keep existing code (help case) the same ...
      case 'help':
        return (
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">Help & Support</h1>
              <p className="text-muted-foreground">Get help and find answers to common questions.</p>
            </div>
            
            <div className="grid gap-4">
              <div className="bg-card border border-border rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-2">Documentation</h3>
                <p className="text-muted-foreground mb-4">Browse our comprehensive guides and tutorials.</p>
                <button className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors">
                  View Docs
                </button>
              </div>
              <div className="bg-card border border-border rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-2">Contact Support</h3>
                <p className="text-muted-foreground mb-4">Need help? Our support team is here for you.</p>
                <button className="px-4 py-2 border border-border rounded-md hover:bg-accent transition-colors">
                  Contact Us
                </button>
              </div>
            </div>
          </div>
        );
      
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

export default DoctorDashboard;
