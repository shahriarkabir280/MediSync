import React, { useState } from "react";
import {
  Save,
  User,
  MapPin,
  Award,
  Briefcase,
} from "lucide-react";

import SettingsCard from "../components/SettingsCard";
import ProfilePhotoUpload from "../components/ProfilePhotoUpload";
import { FormField, FormInput, FormTextarea } from '../components/FormField';
import ArraySection from "../components/ArraySection";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "../components/ui/select";



export default function SettingsPage() {
  
  const [formData, setFormData] = useState({
    full_name: "",
    profile_photo_url: "",
    active_status: false,
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
  });

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
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
        ? {
            degree: "",
            institution: "",
            passing_year: "",
            short_description: "",
          }
        : section === "experience"
        ? {
            designation: "",
            organization: "",
            start_date: "",
            end_date: "",
            short_description: "",
          }
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
    console.log("Saving profile data:", formData);
    alert("Profile data saved successfully!");
  };

  const socialPlatforms = [
    { value: "facebook", label: "Facebook", color: "bg-blue-600", icon: "f" },
    { value: "twitter", label: "Twitter/X", color: "bg-sky-500", icon: "X" },
    {
      value: "instagram",
      label: "Instagram",
      color: "bg-gradient-to-r from-purple-500 to-pink-500",
      icon: "IG",
    },
    { value: "linkedin", label: "LinkedIn", color: "bg-blue-700", icon: "in" },
    { value: "youtube", label: "YouTube", color: "bg-red-600", icon: "YT" },
    { value: "tiktok", label: "TikTok", color: "bg-black", icon: "TT" },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Professional Settings</h1>
              <p className="text-primary-foreground/80 mt-1">
                Manage your professional profile and information
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
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8 space-y-6">
        {/* Basic Information */}
        <SettingsCard
          title="Basic Information"
          icon={<User className="text-primary" size={20} />}
        >
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 flex justify-center">
              <ProfilePhotoUpload
                value={formData.profile_photo_url}
                onChange={(url) => handleInputChange("profile_photo_url", url)}
                name={formData.full_name}
              />
            </div>

            <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label="Full Name" required>
                <FormInput
                  value={formData.full_name}
                  onChange={(e) =>
                    handleInputChange("full_name", e.target.value)
                  }
                  placeholder="Enter your full name"
                />
              </FormField>

              <FormField label="Years of Experience">
                <FormInput
                  type="number"
                  value={formData.years_experience}
                  onChange={(e) =>
                    handleInputChange(
                      "years_experience",
                      parseInt(e.target.value) || 0
                    )
                  }
                  placeholder="0"
                  min="0"
                />
              </FormField>

              <FormField label="Total Patients Served">
                <FormInput
                  type="number"
                  value={formData.served_total_patients}
                  onChange={(e) =>
                    handleInputChange(
                      "served_total_patients",
                      parseInt(e.target.value) || 0
                    )
                  }
                  placeholder="0"
                  min="0"
                />
              </FormField>
            </div>
          </div>

          <div className="pt-2">
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.active_status}
                onChange={(e) =>
                  handleInputChange("active_status", e.target.checked)
                }
                className="w-4 h-4 text-primary border-input rounded focus:ring-ring"
              />
              <span className="text-sm font-medium text-foreground">
                Currently accepting new patients
              </span>
            </label>
          </div>
        </SettingsCard>

        {/* Chamber Information */}
        <SettingsCard
          title="Chamber Information"
          icon={<MapPin className="text-primary" size={20} />}
        >
          <ArraySection
            title="Chambers"
            items={formData.chamber}
            onAdd={() => addArrayItem("chamber")}
            onRemove={(index) => removeArrayItem("chamber", index)}
          >
            {(chamber, index) => (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                <FormField label="Available Time">
                  <FormInput
                    value={chamber.available_time}
                    onChange={(e) =>
                      handleArrayInputChange(
                        "chamber",
                        index,
                        "available_time",
                        e.target.value
                      )
                    }
                    placeholder="e.g., Mon-Fri 9AM-5PM"
                  />
                </FormField>
                <FormField label="Chamber Location">
                  <FormInput
                    value={chamber.chamber_location}
                    onChange={(e) =>
                      handleArrayInputChange(
                        "chamber",
                        index,
                        "chamber_location",
                        e.target.value
                      )
                    }
                    placeholder="Enter chamber address"
                  />
                </FormField>
              </div>
            )}
          </ArraySection>
        </SettingsCard>

        {/* Services */}
        <SettingsCard
          title="Services"
          icon={<Award className="text-primary" size={20} />}
        >
          <ArraySection
            title="Medical Services"
            items={formData.services}
            onAdd={() => addArrayItem("services")}
            onRemove={(index) => removeArrayItem("services", index)}
          >
            {(service, index) => (
              <div className="space-y-3">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                  <FormField label="Service Icon URL">
                    <FormInput
                      type="url"
                      value={service.service_icon}
                      onChange={(e) =>
                        handleArrayInputChange(
                          "services",
                          index,
                          "service_icon",
                          e.target.value
                        )
                      }
                      placeholder="https://example.com/icon.png"
                    />
                  </FormField>
                  <FormField label="Service Name">
                    <FormInput
                      value={service.service_name}
                      onChange={(e) =>
                        handleArrayInputChange(
                          "services",
                          index,
                          "service_name",
                          e.target.value
                        )
                      }
                      placeholder="Enter service name"
                    />
                  </FormField>
                </div>
                <FormField label="Service Description">
                  <FormTextarea
                    value={service.service_description}
                    onChange={(e) =>
                      handleArrayInputChange(
                        "services",
                        index,
                        "service_description",
                        e.target.value
                      )
                    }
                    placeholder="Describe this service..."
                    rows={2}
                  />
                </FormField>
              </div>
            )}
          </ArraySection>
        </SettingsCard>

        {/* Education & Experience Row */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Education */}
          <SettingsCard
            title="Education"
            icon={<Award className="text-primary" size={20} />}
          >
            <ArraySection
              title="Academic Background"
              items={formData.education}
              onAdd={() => addArrayItem("education")}
              onRemove={(index) => removeArrayItem("education", index)}
            >
              {(edu, index) => (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <FormField label="Degree">
                      <FormInput
                        value={edu.degree}
                        onChange={(e) =>
                          handleArrayInputChange(
                            "education",
                            index,
                            "degree",
                            e.target.value
                          )
                        }
                        placeholder="e.g., MBBS, MD"
                      />
                    </FormField>
                    <FormField label="Year">
                      <FormInput
                        value={edu.passing_year}
                        onChange={(e) =>
                          handleArrayInputChange(
                            "education",
                            index,
                            "passing_year",
                            e.target.value
                          )
                        }
                        placeholder="2020"
                      />
                    </FormField>
                  </div>
                  <FormField label="Institution">
                    <FormInput
                      value={edu.institution}
                      onChange={(e) =>
                        handleArrayInputChange(
                          "education",
                          index,
                          "institution",
                          e.target.value
                        )
                      }
                      placeholder="University name"
                    />
                  </FormField>
                  <FormField label="Description">
                    <FormTextarea
                      value={edu.short_description}
                      onChange={(e) =>
                        handleArrayInputChange(
                          "education",
                          index,
                          "short_description",
                          e.target.value
                        )
                      }
                      placeholder="Brief description..."
                      rows={2}
                    />
                  </FormField>
                </div>
              )}
            </ArraySection>
          </SettingsCard>

          {/* Professional Experience */}
          <SettingsCard
            title="Experience"
            icon={<Briefcase className="text-primary" size={20} />}
          >
            <ArraySection
              title="Work History"
              items={formData.experience}
              onAdd={() => addArrayItem("experience")}
              onRemove={(index) => removeArrayItem("experience", index)}
            >
              {(exp, index) => (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 gap-3">
                    <FormField label="Designation">
                      <FormInput
                        value={exp.designation}
                        onChange={(e) =>
                          handleArrayInputChange(
                            "experience",
                            index,
                            "designation",
                            e.target.value
                          )
                        }
                        placeholder="Senior Doctor, Consultant"
                      />
                    </FormField>
                    <FormField label="Organization">
                      <FormInput
                        value={exp.organization}
                        onChange={(e) =>
                          handleArrayInputChange(
                            "experience",
                            index,
                            "organization",
                            e.target.value
                          )
                        }
                        placeholder="Hospital/Organization"
                      />
                    </FormField>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <FormField label="Start Date">
                      <FormInput
                        type="date"
                        value={exp.start_date}
                        onChange={(e) =>
                          handleArrayInputChange(
                            "experience",
                            index,
                            "start_date",
                            e.target.value
                          )
                        }
                      />
                    </FormField>
                    <FormField label="End Date">
                      <FormInput
                        type="date"
                        value={exp.end_date}
                        onChange={(e) =>
                          handleArrayInputChange(
                            "experience",
                            index,
                            "end_date",
                            e.target.value
                          )
                        }
                      />
                    </FormField>
                  </div>
                  <FormField label="Description">
                    <FormTextarea
                      value={exp.short_description}
                      onChange={(e) =>
                        handleArrayInputChange(
                          "experience",
                          index,
                          "short_description",
                          e.target.value
                        )
                      }
                      placeholder="Describe your role..."
                      rows={2}
                    />
                  </FormField>
                </div>
              )}
            </ArraySection>
          </SettingsCard>
        </div>

        {/* Testimonials & Contact Row */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Testimonials */}
          <SettingsCard
            title="Featured Testimonial"
            icon={<Award className="text-primary" size={20} />}
          >
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <FormField label="Patient Name">
                  <FormInput
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
                    placeholder="Patient name"
                  />
                </FormField>
                <FormField label="Date">
                  <FormInput
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
                  />
                </FormField>
              </div>
              <FormField label="Testimonial">
                <FormTextarea
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
                  placeholder="Enter patient testimonial..."
                  rows={3}
                />
              </FormField>
            </div>
          </SettingsCard>

          {/* Contact Information */}
          <SettingsCard
            title="Contact Information"
            icon={<User className="text-primary" size={20} />}
          >
            <div className="space-y-4">
              <FormField label="Phone Number">
                <FormInput
                  type="tel"
                  value={formData.contact?.phone || ""}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      contact: { ...prev.contact, phone: e.target.value },
                    }))
                  }
                  placeholder="+1234567890"
                />
              </FormField>
              <FormField label="WhatsApp">
                <FormInput
                  type="tel"
                  value={formData.contact?.whatsapp || ""}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      contact: { ...prev.contact, whatsapp: e.target.value },
                    }))
                  }
                  placeholder="+1234567890"
                />
              </FormField>
              <FormField label="Email">
                <FormInput
                  type="email"
                  value={formData.contact?.email || ""}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      contact: { ...prev.contact, email: e.target.value },
                    }))
                  }
                  placeholder="doctor@example.com"
                />
              </FormField>
            </div>
          </SettingsCard>
        </div>

        {/* Sponsor Company */}
        <SettingsCard
          title="Sponsor Company"
          icon={<Briefcase className="text-primary" size={20} />}
        >
          <div className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <FormField label="Organization Logo URL">
                <FormInput
                  type="url"
                  value={formData.sponsors_company?.organization_logo || ""}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      sponsors_company: {
                        ...prev.sponsors_company,
                        organization_logo: e.target.value,
                      },
                    }))
                  }
                  placeholder="https://example.com/logo.png"
                />
              </FormField>
              <FormField label="Organization Name">
                <FormInput
                  value={formData.sponsors_company?.organization_name || ""}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      sponsors_company: {
                        ...prev.sponsors_company,
                        organization_name: e.target.value,
                      },
                    }))
                  }
                  placeholder="Company name"
                />
              </FormField>
              <FormField label="Start Date">
                <FormInput
                  type="date"
                  value={formData.sponsors_company?.start_date || ""}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      sponsors_company: {
                        ...prev.sponsors_company,
                        start_date: e.target.value,
                      },
                    }))
                  }
                />
              </FormField>
              <FormField label="End Date">
                <FormInput
                  type="date"
                  value={formData.sponsors_company?.end_date || ""}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      sponsors_company: {
                        ...prev.sponsors_company,
                        end_date: e.target.value,
                      },
                    }))
                  }
                />
              </FormField>
            </div>
            <FormField label="Organization Description">
              <FormTextarea
                value={
                  formData.sponsors_company?.organization_description || ""
                }
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    sponsors_company: {
                      ...prev.sponsors_company,
                      organization_description: e.target.value,
                    },
                  }))
                }
                placeholder="Describe the organization..."
                rows={2}
              />
            </FormField>
          </div>
        </SettingsCard>

        {/* Social Media */}
        <SettingsCard
          title="Social Media Profiles"
          icon={<Award className="text-primary" size={20} />}
        >
          <ArraySection
            title="Social Media Accounts"
            items={formData.social_media}
            onAdd={() => addArrayItem("social_media")}
            onRemove={(index) => removeArrayItem("social_media", index)}
          >
            {(social, index) => {
              const selectedPlatform = socialPlatforms.find(
                (p) => p.value === social.platform
              );
              return (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                  <FormField label="Platform">
                    <Select
                      value={social.platform}
                      onValueChange={(value) =>
                        handleArrayInputChange(
                          "social_media",
                          index,
                          "platform",
                          value
                        )
                      }
                    >
                      <SelectTrigger>
                        <div className="flex items-center space-x-2">
                          {selectedPlatform && (
                            <div
                              className={`w-5 h-5 ${selectedPlatform.color} rounded-full flex items-center justify-center`}
                            >
                              <span className="text-white text-xs font-bold">
                                {selectedPlatform.icon}
                              </span>
                            </div>
                          )}
                          <SelectValue placeholder="Select platform" />
                        </div>
                      </SelectTrigger>
                      <SelectContent>
                        {socialPlatforms.map((platform) => (
                          <SelectItem
                            key={platform.value}
                            value={platform.value}
                          >
                            <div className="flex items-center space-x-2">
                              <div
                                className={`w-5 h-5 ${platform.color} rounded-full flex items-center justify-center`}
                              >
                                <span className="text-white text-xs font-bold">
                                  {platform.icon}
                                </span>
                              </div>
                              <span>{platform.label}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormField>
                  <FormField label="Profile URL">
                    <FormInput
                      type="url"
                      value={social.profile_url}
                      onChange={(e) =>
                        handleArrayInputChange(
                          "social_media",
                          index,
                          "profile_url",
                          e.target.value
                        )
                      }
                      placeholder="Enter your profile URL"
                    />
                  </FormField>
                </div>
              );
            }}
          </ArraySection>
        </SettingsCard>

        {/* Save Button Footer */}
        <div className="flex justify-end pt-4">
          <button
            onClick={handleSave}
            className="flex items-center space-x-2 bg-primary text-primary-foreground px-8 py-3 rounded-lg font-medium hover:bg-primary/90 transition-colors shadow-sm"
          >
            <Save size={18} />
            <span>Save All Changes</span>
          </button>
        </div>
      </div>
    </div>
  );
}
