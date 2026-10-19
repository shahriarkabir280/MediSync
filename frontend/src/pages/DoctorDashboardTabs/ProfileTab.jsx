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

    if (formData.phone && !/^[+\-\s()\d]+$/.test(formData.phone)) {
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

  if (loading && !profile) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground font-black uppercase tracking-widest text-xs animate-pulse">Loading clinical profile...</p>
      </div>
    );
  }

  if (error && !profile) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center bg-red-500/5 border border-red-500/20 p-10 rounded-3xl backdrop-blur-3xl">
          <p className="text-red-600 font-black uppercase tracking-widest text-xs mb-4">Critical Connection Error</p>
          <p className="text-sm text-muted-foreground font-medium mb-8 max-w-xs mx-auto">{error}</p>
          <button
            onClick={fetchProfile}
            className="bg-indigo-600 text-white px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all hover:bg-indigo-700 active:scale-95"
          >
            Retry Synchronization
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-indigo-500/10 rounded-xl">
          <User className="h-5 w-5 text-indigo-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground tracking-tight">Clinical practitioner profile</h1>
          <p className="text-muted-foreground text-[10px] font-semibold mt-0.5">Manage your professional identity and public healthcare credentials</p>
        </div>
      </div>

      {/* Status Messages */}
      <div className="space-y-3">
        {success && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="p-1.5 bg-emerald-500/20 rounded-lg">
              <Check className="h-4 w-4 text-emerald-600" />
            </div>
            <span className="text-xs font-bold text-emerald-900 dark:text-emerald-400">{success}</span>
          </div>
        )}

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="p-1.5 bg-red-500/20 rounded-lg">
              <AlertCircle className="h-4 w-4 text-red-600" />
            </div>
            <span className="text-xs font-bold text-red-900 dark:text-red-400">{error}</span>
          </div>
        )}
      </div>

      <div className="bg-card border border-border rounded-xl p-6 shadow-sm overflow-hidden relative text-card-foreground">
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl -mr-16 -mt-16 text-card-foreground"></div>

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-8 relative z-10">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="relative group">
              <div className="w-24 h-24 bg-indigo-500/10 border-2 border-indigo-500/20 rounded-xl flex items-center justify-center overflow-hidden shadow-sm transition-all group-hover:scale-105">
                {profile?.profile_image_url ? (
                  <img
                    src={getImageUrl(profile.profile_image_url)}
                    alt="Profile"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.parentElement.querySelector('.fallback-icon').style.display = 'block';
                    }}
                  />
                ) : null}
                <User
                  className={`w-10 h-10 text-indigo-600/40 fallback-icon ${profile?.profile_image_url ? 'hidden' : 'block'}`}
                />
              </div>
              {isEditing && (
                <button className="absolute -bottom-1 -right-1 p-2 bg-indigo-600 text-white rounded-lg shadow-md hover:bg-indigo-700 transition-all active:scale-90">
                  <Edit2 className="h-3 w-3" />
                </button>
              )}
            </div>
            <div className="text-center md:text-left space-y-1.5">
              <div className="flex flex-col md:flex-row md:items-center gap-2">
                <h3 className="text-xl font-bold text-foreground tracking-tight">
                  {profile?.first_name} {profile?.last_name}
                </h3>
                {profile?.specialization && (
                  <span className="px-3 py-1 bg-indigo-500/10 text-indigo-600 border border-indigo-500/20 rounded-full text-[9px] font-bold tracking-tight h-fit">
                    {profile.specialization}
                  </span>
                )}
              </div>
              <div className="flex flex-col md:flex-row md:items-center gap-4">
                <p className="text-muted-foreground text-xs font-medium flex items-center justify-center md:justify-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  {profile?.email}
                </p>
                {profile?.unique_id && (
                  <p className="text-[9px] font-bold text-indigo-600/60 py-0.5 px-2 bg-muted rounded-md border border-border">
                    Credential id: {profile.unique_id}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-bold text-xs hover:bg-indigo-700 transition-all active:scale-95 flex items-center gap-2 shadow-sm"
            >
              <Edit2 className="h-3.5 w-3.5" />
              Edit credentials
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-muted-foreground tracking-tight ml-1">Practitioner first name *</label>
              <input
                type="text"
                name="first_name"
                value={formData.first_name || ''}
                onChange={handleChange}
                disabled={!isEditing}
                className={`w-full px-4 py-2.5 bg-muted/40 border rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-xs text-foreground font-medium disabled:opacity-40 disabled:cursor-not-allowed ${validationErrors.first_name ? 'border-red-500' : 'border-border'
                  }`}
              />
              {validationErrors.first_name && (
                <p className="text-[9px] text-red-600 font-bold ml-1">{validationErrors.first_name}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-muted-foreground tracking-tight ml-1">Practitioner last name *</label>
              <input
                type="text"
                name="last_name"
                value={formData.last_name || ''}
                onChange={handleChange}
                disabled={!isEditing}
                className={`w-full px-4 py-2.5 bg-muted/40 border rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-xs text-foreground font-medium disabled:opacity-40 disabled:cursor-not-allowed ${validationErrors.last_name ? 'border-red-500' : 'border-border'
                  }`}
              />
              {validationErrors.last_name && (
                <p className="text-[9px] text-red-600 font-bold ml-1">{validationErrors.last_name}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-muted-foreground tracking-tight ml-1">Professional email alias *</label>
              <input
                type="email"
                name="email"
                value={formData.email || ''}
                onChange={handleChange}
                disabled={!isEditing}
                className={`w-full px-4 py-2.5 bg-muted/40 border rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-xs text-foreground font-medium disabled:opacity-40 disabled:cursor-not-allowed ${validationErrors.email ? 'border-red-500' : 'border-border'
                  }`}
              />
              {validationErrors.email && (
                <p className="text-[9px] text-red-600 font-bold ml-1">{validationErrors.email}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-muted-foreground tracking-tight ml-1">Clinical contact number</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone || ''}
                onChange={handleChange}
                disabled={!isEditing}
                placeholder="(555) 123-4567"
                className={`w-full px-4 py-2.5 bg-muted/40 border rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-xs text-foreground font-medium disabled:opacity-40 disabled:cursor-not-allowed ${validationErrors.phone ? 'border-red-500' : 'border-border'
                  }`}
              />
              {validationErrors.phone && (
                <p className="text-[9px] text-red-600 font-bold ml-1">{validationErrors.phone}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-muted-foreground tracking-tight ml-1">Medical specialization</label>
              <input
                type="text"
                name="specialization"
                value={formData.specialization || ''}
                onChange={handleChange}
                disabled={!isEditing}
                placeholder="e.g., Cardiology, Pediatrics"
                className="w-full px-4 py-2.5 bg-muted/40 border border-border rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-xs text-foreground font-medium disabled:opacity-40 disabled:cursor-not-allowed"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-muted-foreground tracking-tight ml-1">Clinical experience (years)</label>
              <input
                type="number"
                name="years_of_experience"
                value={formData.years_of_experience || ''}
                onChange={handleChange}
                disabled={!isEditing}
                min="0"
                max="100"
                placeholder="0"
                className={`w-full px-4 py-2.5 bg-muted/40 border rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-xs text-foreground font-medium disabled:opacity-40 disabled:cursor-not-allowed ${validationErrors.years_of_experience ? 'border-red-500' : 'border-border'
                  }`}
              />
              {validationErrors.years_of_experience && (
                <p className="text-[9px] text-red-600 font-bold ml-1">{validationErrors.years_of_experience}</p>
              )}
            </div>
            <div className="md:col-span-2 space-y-1.5">
              <label className="block text-[10px] font-bold text-muted-foreground tracking-tight ml-1">Professional medical bio</label>
              <textarea
                name="bio"
                value={formData.bio || ''}
                onChange={handleChange}
                disabled={!isEditing}
                rows={5}
                placeholder="Detail your clinical methodology..."
                className="w-full px-6 py-4 bg-muted/40 border border-border rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-xs text-foreground font-medium leading-relaxed disabled:opacity-40 disabled:cursor-not-allowed resize-none"
              />
            </div>
          </div>

          {isEditing && (
            <div className="flex gap-4 pt-8 border-t border-border">
              <button
                type="submit"
                disabled={saving}
                className="bg-emerald-600 text-white px-8 py-2.5 rounded-lg font-bold text-xs hover:bg-emerald-700 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2 shadow-sm"
              >
                {saving ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Synchronizing...
                  </>
                ) : (
                  <>
                    <Save className="h-3.5 w-3.5" />
                    Save changes
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                disabled={saving}
                className="bg-muted text-foreground px-6 py-2.5 rounded-lg font-bold text-xs hover:bg-muted/80 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2"
              >
                <X className="h-3.5 w-3.5" />
                Discard
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default ProfileTab;
