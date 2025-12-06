import React, { useState, useEffect } from "react";
import { User } from "lucide-react";
import { doctorApi } from "../../lib/api";
import { useDoctor } from "../../hooks/useDoctor";
import { getImageUrl } from "../../config/api";

const ProfileTab = () => {
    const { doctorId } = useDoctor();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({});

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

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setLoading(true);
            await doctorApi.updateProfile(doctorId, formData);
            await fetchProfile();
            setIsEditing(false);
            alert('Profile updated successfully!');
        } catch (err) {
            alert('Error updating profile: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
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
            
            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-center space-x-4 mb-6">
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
              
              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">First Name</label>
                    <input 
                      type="text" 
                      name="first_name"
                      value={formData.first_name || ''} 
                      onChange={handleChange}
                      disabled={!isEditing}
                      className="w-full p-2 border border-input rounded-md bg-background disabled:opacity-60" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Last Name</label>
                    <input 
                      type="text" 
                      name="last_name"
                      value={formData.last_name || ''} 
                      onChange={handleChange}
                      disabled={!isEditing}
                      className="w-full p-2 border border-input rounded-md bg-background disabled:opacity-60" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Email</label>
                    <input 
                      type="email" 
                      name="email"
                      value={formData.email || ''} 
                      onChange={handleChange}
                      disabled={!isEditing}
                      className="w-full p-2 border border-input rounded-md bg-background disabled:opacity-60" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Phone</label>
                    <input 
                      type="tel" 
                      name="phone"
                      value={formData.phone || ''} 
                      onChange={handleChange}
                      disabled={!isEditing}
                      className="w-full p-2 border border-input rounded-md bg-background disabled:opacity-60" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Specialization</label>
                    <input 
                      type="text" 
                      name="specialization"
                      value={formData.specialization || ''} 
                      onChange={handleChange}
                      disabled={!isEditing}
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
                      className="w-full p-2 border border-input rounded-md bg-background disabled:opacity-60" 
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-2">Bio</label>
                    <textarea 
                      name="bio"
                      value={formData.bio || ''} 
                      onChange={handleChange}
                      disabled={!isEditing}
                      rows={4}
                      className="w-full p-2 border border-input rounded-md bg-background disabled:opacity-60" 
                    />
                  </div>
                </div>
                
                <div className="flex gap-2">
                  {isEditing ? (
                    <>
                      <button 
                        type="submit"
                        disabled={loading}
                        className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"
                      >
                        {loading ? 'Saving...' : 'Save Changes'}
                      </button>
                      <button 
                        type="button"
                        onClick={() => {
                          setIsEditing(false);
                          setFormData(profile);
                        }}
                        disabled={loading}
                        className="px-4 py-2 border border-border rounded-md hover:bg-accent"
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <button 
                      type="button"
                      onClick={() => setIsEditing(true)}
                      className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
                    >
                      Edit Profile
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div> 
    );
};
export default ProfileTab;