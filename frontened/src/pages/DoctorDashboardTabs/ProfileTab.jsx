import React, { useState, useEffect } from "react";
import { User, Edit2, Save, X, Check, AlertCircle } from "lucide-react";
import { doctorApi } from "../../lib/api";
import { useDoctor } from "../../hooks/useDoctor";
import { getImageUrl } from "../../config/api";

const ProfileTab = () => {
    const { doctorId } = useDoctor();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({});
    const [validationErrors, setValidationErrors] = useState({});

    useEffect(() => {
        if (doctorId) {
            fetchProfile();
        }
    }, [doctorId]);

    const fetchProfile = async () => {
        if (!doctorId) return;
        try {
            setLoading(true);
            const data = await doctorApi.getProfile(doctorId);
            setProfile(data.data);
            setFormData(data.data);
            setError(null);
        } catch (err) {
            setError(err.message);
            console.error('Error fetching profile:', err);
        } finally {
            setLoading(false);
        }
    };

    const validateForm = () => {
        const errors = {};
        
        if (!formData.first_name?.trim()) {
            errors.first_name = 'First name is required';
        }
        
        if (!formData.last_name?.trim()) {
            errors.last_name = 'Last name is required';
        }
        
        if (!formData.email?.trim()) {
            errors.email = 'Email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            errors.email = 'Please enter a valid email address';
        }
        
        if (formData.phone && !/^[\+\-\s\(\)\d]+$/.test(formData.phone)) {
            errors.phone = 'Please enter a valid phone number';
        }
        
        if (formData.years_of_experience && (formData.years_of_experience < 0 || formData.years_of_experience > 100)) {
            errors.years_of_experience = 'Years of experience must be between 0 and 100';
        }

        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!validateForm()) {
            return;
        }

        try {
            setSaving(true);
            await doctorApi.updateProfile(doctorId, formData);
            await fetchProfile();
            setIsEditing(false);
            setSuccess('Profile updated successfully!');
            setValidationErrors({});
            
            // Clear success message after 3 seconds
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError('Error updating profile: ' + err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value
        });
        
        // Clear validation error for this field when user starts typing
        if (validationErrors[name]) {
            setValidationErrors({
                ...validationErrors,
                [name]: ''
            });
        }
    };

    const handleCancel = () => {
        setIsEditing(false);
        setFormData(profile);
        setValidationErrors({});
        setError(null);
    };

    const showMessage = (message, type = 'success') => {
        if (type === 'success') {
            setSuccess(message);
            setTimeout(() => setSuccess(''), 3000);
        } else {
            setError(message);
            setTimeout(() => setError(''), 5000);
        }
    };

    if (loading && !profile) {
        return (
            <div className="flex items-center justify-center h-64">
                <p className="text-muted-foreground">Loading profile...</p>
            </div>
        );
    }

    if (error && !profile) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <p className="text-red-600 mb-2">Error loading profile</p>
                    <p className="text-sm text-muted-foreground">{error}</p>
                    <button 
                        onClick={fetchProfile}
                        className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    return(
         <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">Profile</h1>
              <p className="text-muted-foreground">Manage your personal information and preferences.</p>
            </div>

            {/* Success Message */}
            {success && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-2">
                    <Check className="h-5 w-5 text-green-600" />
                    <span className="text-green-800">{success}</span>
                </div>
            )}

            {/* Error Message */}
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-red-600" />
                    <span className="text-red-800">{error}</span>
                </div>
            )}
            
            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-4">
                  <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center">
                    {profile?.profile_image_url ? (
                      <img 
                        src={getImageUrl(profile.profile_image_url)} 
                        alt="Profile" 
                        className="w-20 h-20 rounded-full object-cover"
                        onError={(e) => {
                          console.error('ProfileTab: Image failed to load:', profile.profile_image_url);
                          e.target.style.display = 'none';
                          e.target.parentElement.querySelector('.fallback-icon').style.display = 'block';
                        }}
                      />
                    ) : null}
                    <User 
                      className={`w-10 h-10 text-primary-foreground fallback-icon ${profile?.profile_image_url ? 'hidden' : 'block'}`} 
                    />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold">
                      {profile?.first_name} {profile?.last_name}
                    </h3>
                    <p className="text-muted-foreground">{profile?.email}</p>
                    {profile?.unique_id && (
                      <p className="text-sm text-blue-600 font-medium">Doctor ID: {profile.unique_id}</p>
                    )}
                    {profile?.specialization && (
                      <p className="text-sm text-primary">{profile.specialization}</p>
                    )}
                  </div>
                </div>

                {/* Edit Toggle Button */}
                {!isEditing && (
                  <button 
                    onClick={() => setIsEditing(true)}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 flex items-center gap-2"
                  >
                    <Edit2 className="h-4 w-4" />
                    Edit Profile
                  </button>
                )}
              </div>
              
              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      First Name *
                    </label>
                    <input 
                      type="text" 
                      name="first_name"
                      value={formData.first_name || ''} 
                      onChange={handleChange}
                      disabled={!isEditing}
                      className={`w-full p-2 border rounded-md bg-background disabled:opacity-60 ${
                        validationErrors.first_name ? 'border-red-500' : 'border-input'
                      }`}
                    />
                    {validationErrors.first_name && (
                      <p className="text-sm text-red-600 mt-1">{validationErrors.first_name}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Last Name *
                    </label>
                    <input 
                      type="text" 
                      name="last_name"
                      value={formData.last_name || ''} 
                      onChange={handleChange}
                      disabled={!isEditing}
                      className={`w-full p-2 border rounded-md bg-background disabled:opacity-60 ${
                        validationErrors.last_name ? 'border-red-500' : 'border-input'
                      }`}
                    />
                    {validationErrors.last_name && (
                      <p className="text-sm text-red-600 mt-1">{validationErrors.last_name}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Email *
                    </label>
                    <input 
                      type="email" 
                      name="email"
                      value={formData.email || ''} 
                      onChange={handleChange}
                      disabled={!isEditing}
                      className={`w-full p-2 border rounded-md bg-background disabled:opacity-60 ${
                        validationErrors.email ? 'border-red-500' : 'border-input'
                      }`}
                    />
                    {validationErrors.email && (
                      <p className="text-sm text-red-600 mt-1">{validationErrors.email}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Phone</label>
                    <input 
                      type="tel" 
                      name="phone"
                      value={formData.phone || ''} 
                      onChange={handleChange}
                      disabled={!isEditing}
                      placeholder="(555) 123-4567"
                      className={`w-full p-2 border rounded-md bg-background disabled:opacity-60 ${
                        validationErrors.phone ? 'border-red-500' : 'border-input'
                      }`}
                    />
                    {validationErrors.phone && (
                      <p className="text-sm text-red-600 mt-1">{validationErrors.phone}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Specialization</label>
                    <input 
                      type="text" 
                      name="specialization"
                      value={formData.specialization || ''} 
                      onChange={handleChange}
                      disabled={!isEditing}
                      placeholder="e.g., Cardiology, Pediatrics"
                      className="w-full p-2 border border-input rounded-md bg-background disabled:opacity-60" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Years of Experience</label>
                    <input 
                      type="number" 
                      name="years_of_experience"
                      value={formData.years_of_experience || ''} 
                      onChange={handleChange}
                      disabled={!isEditing}
                      min="0"
                      max="100"
                      placeholder="0"
                      className={`w-full p-2 border rounded-md bg-background disabled:opacity-60 ${
                        validationErrors.years_of_experience ? 'border-red-500' : 'border-input'
                      }`}
                    />
                    {validationErrors.years_of_experience && (
                      <p className="text-sm text-red-600 mt-1">{validationErrors.years_of_experience}</p>
                    )}
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-2">Bio</label>
                    <textarea 
                      name="bio"
                      value={formData.bio || ''} 
                      onChange={handleChange}
                      disabled={!isEditing}
                      rows={4}
                      placeholder="Tell us about yourself, your experience, and your approach to patient care..."
                      className="w-full p-2 border border-input rounded-md bg-background disabled:opacity-60" 
                    />
                  </div>
                </div>
                
                {isEditing && (
                  <div className="flex gap-2 pt-4 border-t border-border">
                    <button 
                      type="submit"
                      disabled={saving}
                      className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
                    >
                      {saving ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4" />
                          Save Changes
                        </>
                      )}
                    </button>
                    <button 
                      type="button"
                      onClick={handleCancel}
                      disabled={saving}
                      className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 disabled:opacity-50 flex items-center gap-2"
                    >
                      <X className="h-4 w-4" />
                      Cancel
                    </button>
                  </div>
                )}
              </form>
            </div>
          </div> 
    );
};
export default ProfileTab;