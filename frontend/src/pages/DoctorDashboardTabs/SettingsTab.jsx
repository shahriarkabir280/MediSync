import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { API_URLS } from '../../config/api';
import { authFetch } from '../../lib/authToken';
import { Bell, Shield, CreditCard, Settings, Calendar, MessageCircle, Mail, Users, AlertCircle, Trash2, FileText, MapPin, Plus, Globe } from 'lucide-react';

const SettingsTab = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('notifications');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  // Notification Settings State - Enhanced to match NotificationTab
  const [notificationSettings, setNotificationSettings] = useState({
    // Category-based settings
    appointments: {
      email: true,
      push: true,
      sms: false,
      enabled: true
    },
    billing: {
      email: true,
      push: true,
      sms: true,
      enabled: true
    },
    chat: {
      email: false,
      push: true,
      sms: false,
      enabled: true
    },
    email: {
      email: true,
      push: false,
      sms: false,
      enabled: true
    },
    patients: {
      email: true,
      push: true,
      sms: false,
      enabled: true
    },
    system: {
      email: true,
      push: true,
      sms: false,
      enabled: true
    },
    // Global settings
    globalMute: false,
    quietHours: {
      enabled: false,
      startTime: '22:00',
      endTime: '08:00'
    },
    frequency: 'immediate' // immediate, hourly, daily
  });

  // Temporary edit state for notifications
  const [editedNotificationSettings, setEditedNotificationSettings] = useState(null);
  const [isEditingNotifications, setIsEditingNotifications] = useState(false);
  const [notificationChanges, setNotificationChanges] = useState(false);

  // Account Settings State
  const [accountSettings, setAccountSettings] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    twoFactorEnabled: false,
    backupCodes: [],
    sessionTimeout: '30'
  });

  // Billing Settings State
  const [billingSettings, setBillingSettings] = useState({
    defaultPaymentMethod: '',
    autoPayEnabled: false,
    invoiceEmail: user?.email || '',
    taxId: '',
    billingAddress: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'US'
    },
    paymentMethods: []
  });

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');

      // Load notification settings
      try {
        const notifyResponse = await authFetch(API_URLS.DOCTORS.NOTIFICATIONS, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (notifyResponse.ok) {
          const notifyData = await notifyResponse.json();
          setNotificationSettings(prev => ({ ...prev, ...notifyData }));
        }
      } catch (notifyError) {
        console.log('Notification settings not available yet:', notifyError.message);
      }

      // Load billing settings
      try {
        const billingResponse = await authFetch(API_URLS.BILLING.SETTINGS, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (billingResponse.ok) {
          const billingData = await billingResponse.json();
          setBillingSettings(prev => ({ ...prev, ...billingData }));
        }
      } catch (billingError) {
        console.log('Billing settings not available yet:', billingError.message);
      }

    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const showSuccessMessage = (message) => {
    setSuccess(message);
    setError('');
    setTimeout(() => setSuccess(''), 3000);
  };

  const showErrorMessage = (message) => {
    setError(message);
    setSuccess('');
    setTimeout(() => setError(''), 3000);
  };

  const updateNotificationSettings = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');

      const response = await authFetch(API_URLS.DOCTORS.NOTIFICATIONS, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(editedNotificationSettings || notificationSettings)
      });

      if (response.ok) {
        // Apply the changes to the main state
        if (editedNotificationSettings) {
          setNotificationSettings(editedNotificationSettings);
          setEditedNotificationSettings(null);
        }
        setIsEditingNotifications(false);
        setNotificationChanges(false);
        showSuccessMessage('Notification settings updated successfully');

        // Reload settings to ensure we have the latest data
        setTimeout(() => {
          loadSettings();
        }, 1000);
      } else {
        throw new Error('Failed to update notification settings');
      }
    } catch (error) {
      showErrorMessage('Failed to update notification settings');
      console.error('Update notification settings error:', error);
    } finally {
      setLoading(false);
    }
  };

  const startEditingNotifications = () => {
    setIsEditingNotifications(true);
    setEditedNotificationSettings({ ...notificationSettings });
    setNotificationChanges(false);
  };

  const cancelEditingNotifications = () => {
    setIsEditingNotifications(false);
    setEditedNotificationSettings(null);
    setNotificationChanges(false);
  };

  const updateEditedNotificationSetting = (path, value) => {
    setEditedNotificationSettings(prev => {
      const newSettings = { ...prev };
      const keys = path.split('.');
      let current = newSettings;

      for (let i = 0; i < keys.length - 1; i++) {
        current = current[keys[i]];
      }
      current[keys[keys.length - 1]] = value;

      setNotificationChanges(true);
      return newSettings;
    });
  };

  // Helper function to get current setting value (edit or saved state)
  const getCurrentNotificationSetting = (path) => {
    const keys = path.split('.');
    const source = isEditingNotifications ? editedNotificationSettings : notificationSettings;
    let current = source;
    for (let key of keys) {
      current = current?.[key];
    }
    return current;
  };

  // Helper function to handle notification setting changes
  const handleNotificationChange = (path, value) => {
    if (isEditingNotifications) {
      updateEditedNotificationSetting(path, value);
    }
  };

  const changePassword = async () => {
    if (accountSettings.newPassword !== accountSettings.confirmPassword) {
      showErrorMessage('New passwords do not match');
      return;
    }

    if (accountSettings.newPassword.length < 8) {
      showErrorMessage('Password must be at least 8 characters long');
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');

      const response = await authFetch(API_URLS.AUTH.CHANGE_PASSWORD, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          currentPassword: accountSettings.currentPassword,
          newPassword: accountSettings.newPassword
        })
      });

      if (response.ok) {
        setAccountSettings(prev => ({
          ...prev,
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        }));
        showSuccessMessage('Password changed successfully');
      } else {
        const data = await response.json();
        throw new Error(data.message || 'Failed to change password');
      }
    } catch (error) {
      showErrorMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  const enableTwoFactor = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');

      const response = await authFetch(API_URLS.AUTH.ENABLE_2FA, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setAccountSettings(prev => ({
          ...prev,
          twoFactorEnabled: true,
          backupCodes: data.backupCodes
        }));
        showSuccessMessage('Two-factor authentication enabled');
      } else {
        throw new Error('Failed to enable two-factor authentication');
      }
    } catch {
      showErrorMessage('Failed to enable two-factor authentication');
    } finally {
      setLoading(false);
    }
  };

  const disableTwoFactor = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');

      const response = await authFetch(API_URLS.AUTH.DISABLE_2FA, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        setAccountSettings(prev => ({
          ...prev,
          twoFactorEnabled: false,
          backupCodes: []
        }));
        showSuccessMessage('Two-factor authentication disabled');
      } else {
        throw new Error('Failed to disable two-factor authentication');
      }
    } catch {
      showErrorMessage('Failed to disable two-factor authentication');
    } finally {
      setLoading(false);
    }
  };

  const updateBillingSettings = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');

      const response = await authFetch(API_URLS.BILLING.SETTINGS, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(billingSettings)
      });

      if (response.ok) {
        showSuccessMessage('Billing settings updated successfully');
      } else {
        throw new Error('Failed to update billing settings');
      }
    } catch {
      showErrorMessage('Failed to update billing settings');
    } finally {
      setLoading(false);
    }
  };

  const deleteAccount = async () => {
    if (deleteConfirmation !== 'DELETE') {
      showErrorMessage('Please type DELETE to confirm account deletion');
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');

      const response = await authFetch(API_URLS.DOCTORS.DELETE_ACCOUNT, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        logout();
        showSuccessMessage('Account deleted successfully');
      } else {
        throw new Error('Failed to delete account');
      }
    } catch {
      showErrorMessage('Failed to delete account');
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'notifications', name: 'Notifications', icon: Bell },
    { id: 'account', name: 'Account Security', icon: Shield },
    { id: 'billing', name: 'Billing & Payment', icon: CreditCard },
    { id: 'preferences', name: 'Preferences', icon: Settings }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-foreground mb-1 tracking-tight">Settings</h1>
        <p className="text-muted-foreground text-[10px] font-semibold ml-1">Manage your professional account preferences and security configurations</p>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 px-4 py-3 rounded-xl font-semibold text-[11px] backdrop-blur-xl animate-in fade-in slide-in-from-top-2 duration-300">
          {success}
        </div>
      )}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-600 px-4 py-3 rounded-xl font-semibold text-[11px] backdrop-blur-xl animate-in fade-in slide-in-from-top-2 duration-300">
          {error}
        </div>
      )}

      {/* Tab Navigation */}
      <div className="bg-card/40 backdrop-blur-3xl border border-border rounded-xl overflow-hidden">
        <div className="flex flex-wrap border-b border-border p-1.5 gap-1.5">
          {tabs.map((tab) => {
            const IconComponent = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold transition-all rounded-lg ${isActive
                  ? 'bg-indigo-600 text-white'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  }`}
              >
                <IconComponent className={`h-3.5 w-3.5 ${isActive ? 'text-white' : 'text-indigo-500'}`} />
                {tab.name}
              </button>
            );
          })}
        </div>

        <div className="p-6 md:p-8">
          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-500/10 rounded-xl">
                    <Bell className="h-5 w-5 text-indigo-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-foreground tracking-tight">Notification settings</h2>
                    <p className="text-muted-foreground text-[10px] font-semibold mt-0.5">Manage how you receive critical medical alerts</p>
                  </div>
                </div>
                <div className="flex gap-2.5">
                  {!isEditingNotifications ? (
                    <button
                      onClick={startEditingNotifications}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all font-bold text-[11px] active:scale-95"
                    >
                      Edit settings
                    </button>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        onClick={cancelEditingNotifications}
                        className="px-4 py-2 bg-muted text-foreground rounded-lg hover:bg-muted/80 transition-all font-bold text-[11px] active:scale-95 border border-border"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={updateNotificationSettings}
                        disabled={loading || !notificationChanges}
                        className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-all font-bold text-[11px] disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
                      >
                        {loading ? 'Saving...' : 'Save changes'}
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Edit mode indicator */}
              {isEditingNotifications && (
                <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-4 backdrop-blur-3xl">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-500/20 rounded-lg">
                      <Settings className="h-4 w-4 text-indigo-600 animate-spin-slow" />
                    </div>
                    <div>
                      <span className="text-[10px] text-indigo-600 font-bold uppercase tracking-wider">
                        Configuration mode active
                      </span>
                      <p className="text-muted-foreground text-[10px] font-medium mt-0.5">
                        Make your changes and click "Save changes" to apply them to your profile
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Global Controls */}
              <div className="bg-orange-500/5 border border-orange-500/10 rounded-xl p-4 backdrop-blur-3xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-orange-500/10 rounded-xl">
                      <AlertCircle className="h-5 w-5 text-orange-600" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-orange-950 dark:text-orange-400">Global notification control</h4>
                      <p className="text-[10px] text-orange-700 dark:text-orange-500/70 font-medium">Temporarily mute all incoming dashboard alerts</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={getCurrentNotificationSetting('globalMute')}
                      onChange={(e) => handleNotificationChange('globalMute', e.target.checked)}
                      disabled={!isEditingNotifications}
                      className="sr-only peer"
                    />
                    <div className={`w-11 h-6 bg-muted/50 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-[20px] after:w-[20px] after:transition-all peer-checked:bg-orange-600 ${!isEditingNotifications ? 'opacity-30 cursor-not-allowed' : ''}`}></div>
                  </label>
                </div>
              </div>

              {/* Notification Categories */}
              <div className="grid gap-4">
                {/* Appointments */}
                <div className="bg-muted/10 border border-border rounded-xl p-5 hover:bg-muted/20 transition-all group">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-indigo-500/10 rounded-lg group-hover:bg-indigo-600 group-hover:text-white transition-all">
                        <Calendar className="h-5 w-5 text-indigo-600 group-hover:text-white" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-foreground">Appointments</h4>
                        <p className="text-[10px] text-muted-foreground font-medium">New appointments, status changes, and clinical reminders</p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isEditingNotifications ? editedNotificationSettings?.appointments?.enabled : notificationSettings.appointments.enabled}
                        onChange={(e) => isEditingNotifications && updateEditedNotificationSetting('appointments.enabled', e.target.checked)}
                        disabled={!isEditingNotifications}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-muted/50 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-[20px] after:w-[20px] after:transition-all peer-checked:bg-indigo-600"></div>
                    </label>
                  </div>
                  {(isEditingNotifications ? editedNotificationSettings?.appointments?.enabled : notificationSettings.appointments.enabled) && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 ml-8">
                      {['Email', 'Push', 'SMS'].map((method) => (
                        <label key={method} className="flex items-center gap-3 cursor-pointer group/label">
                          <input
                            type="checkbox"
                            checked={isEditingNotifications ? editedNotificationSettings?.appointments?.[method.toLowerCase()] : notificationSettings.appointments[method.toLowerCase()]}
                            onChange={(e) => isEditingNotifications && updateEditedNotificationSetting(`appointments.${method.toLowerCase()}`, e.target.checked)}
                            disabled={!isEditingNotifications}
                            className="w-4 h-4 rounded border-border text-indigo-600 focus:ring-indigo-500/20 bg-muted/30 transition-all"
                          />
                          <span className="text-[10px] font-bold text-muted-foreground group-hover/label:text-foreground transition-colors">{method}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>

                {/* Billing */}
                <div className="bg-muted/10 border border-border rounded-xl p-5 hover:bg-muted/20 transition-all group">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-emerald-500/10 rounded-lg group-hover:bg-emerald-600 group-hover:text-white transition-all">
                        <CreditCard className="h-5 w-5 text-emerald-600 group-hover:text-white" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-foreground">Billing & payments</h4>
                        <p className="text-[10px] text-muted-foreground font-medium">Payment alerts, invoice updates, and subscription changes</p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={getCurrentNotificationSetting('billing.enabled')}
                        onChange={(e) => handleNotificationChange('billing.enabled', e.target.checked)}
                        disabled={!isEditingNotifications}
                        className="sr-only peer"
                      />
                      <div className={`w-11 h-6 bg-muted/50 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-[20px] after:w-[20px] after:transition-all peer-checked:bg-emerald-600 ${!isEditingNotifications ? 'opacity-30 cursor-not-allowed' : ''}`}></div>
                    </label>
                  </div>
                  {getCurrentNotificationSetting('billing.enabled') && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 ml-8">
                      {['Email', 'Push', 'SMS'].map((method) => (
                        <label key={method} className="flex items-center gap-3 cursor-pointer group/label">
                          <input
                            type="checkbox"
                            checked={getCurrentNotificationSetting(`billing.${method.toLowerCase()}`)}
                            onChange={(e) => handleNotificationChange(`billing.${method.toLowerCase()}`, e.target.checked)}
                            disabled={!isEditingNotifications}
                            className="w-4 h-4 rounded border-border text-emerald-600 focus:ring-emerald-500/20 bg-muted/30 transition-all"
                          />
                          <span className="text-[10px] font-bold text-muted-foreground group-hover/label:text-foreground transition-colors">{method}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>

                {/* Chat/Messages */}
                <div className="bg-muted/10 border border-border rounded-xl p-5 hover:bg-muted/20 transition-all group">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-indigo-500/10 rounded-lg group-hover:bg-indigo-600 group-hover:text-white transition-all">
                        <MessageCircle className="h-5 w-5 text-indigo-600 group-hover:text-white" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-foreground">Messages & chat</h4>
                        <p className="text-[10px] text-muted-foreground font-medium">New messages from colleagues, staff, and direct patient interaction</p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={getCurrentNotificationSetting('chat.enabled')}
                        onChange={(e) => handleNotificationChange('chat.enabled', e.target.checked)}
                        disabled={!isEditingNotifications}
                        className="sr-only peer"
                      />
                      <div className={`w-11 h-6 bg-muted/50 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-[20px] after:w-[20px] after:transition-all peer-checked:bg-indigo-600 ${!isEditingNotifications ? 'opacity-30 cursor-not-allowed' : ''}`}></div>
                    </label>
                  </div>
                  {getCurrentNotificationSetting('chat.enabled') && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 ml-8">
                      {['Email', 'Push', 'SMS'].map((method) => (
                        <label key={method} className="flex items-center gap-3 cursor-pointer group/label">
                          <input
                            type="checkbox"
                            checked={getCurrentNotificationSetting(`chat.${method.toLowerCase()}`)}
                            onChange={(e) => handleNotificationChange(`chat.${method.toLowerCase()}`, e.target.checked)}
                            disabled={!isEditingNotifications}
                            className="w-4 h-4 rounded border-border text-indigo-600 focus:ring-indigo-500/20 bg-muted/30 transition-all"
                          />
                          <span className="text-[10px] font-bold text-muted-foreground group-hover/label:text-foreground transition-colors">{method}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>

                {/* Patients */}
                <div className="bg-muted/10 border border-border rounded-xl p-5 hover:bg-muted/20 transition-all group">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-indigo-500/10 rounded-lg group-hover:bg-indigo-600 group-hover:text-white transition-all">
                        <Users className="h-5 w-5 text-indigo-600 group-hover:text-white" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-foreground">Patient updates</h4>
                        <p className="text-[10px] text-muted-foreground font-medium">New registrations, medical records updates, and file shares</p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={getCurrentNotificationSetting('patients.enabled')}
                        onChange={(e) => handleNotificationChange('patients.enabled', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className={`w-11 h-6 bg-muted/50 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-[20px] after:w-[20px] after:transition-all peer-checked:bg-indigo-600 ${!isEditingNotifications ? 'opacity-30 cursor-not-allowed' : ''}`}></div>
                    </label>
                  </div>
                  {getCurrentNotificationSetting('patients.enabled') && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 ml-8">
                      {['Email', 'Push', 'SMS'].map((method) => (
                        <label key={method} className="flex items-center gap-3 cursor-pointer group/label">
                          <input
                            type="checkbox"
                            checked={getCurrentNotificationSetting(`patients.${method.toLowerCase()}`)}
                            onChange={(e) => handleNotificationChange(`patients.${method.toLowerCase()}`, e.target.checked)}
                            disabled={!isEditingNotifications}
                            className="w-4 h-4 rounded border-border text-indigo-600 focus:ring-indigo-500/20 bg-muted/30 transition-all"
                          />
                          <span className="text-[10px] font-bold text-muted-foreground group-hover/label:text-foreground transition-colors">{method}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>

                {/* System Notifications */}
                <div className="bg-muted/10 border border-border rounded-xl p-5 hover:bg-muted/20 transition-all group">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-muted rounded-lg group-hover:bg-foreground group-hover:text-background transition-all">
                        <Settings className="h-5 w-5 text-foreground group-hover:text-background" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-foreground">System notifications</h4>
                        <p className="text-[10px] text-muted-foreground font-medium">Maintenance schedules, platform updates, and security announcements</p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={getCurrentNotificationSetting('system.enabled')}
                        onChange={(e) => handleNotificationChange('system.enabled', e.target.checked)}
                        disabled={!isEditingNotifications}
                        className="sr-only peer"
                      />
                      <div className={`w-11 h-6 bg-muted/50 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-[20px] after:w-[20px] after:transition-all peer-checked:bg-foreground ${!isEditingNotifications ? 'opacity-30 cursor-not-allowed' : ''}`}></div>
                    </label>
                  </div>
                  {getCurrentNotificationSetting('system.enabled') && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 ml-8">
                      {['Email', 'Push', 'SMS'].map((method) => (
                        <label key={method} className="flex items-center gap-3 cursor-pointer group/label">
                          <input
                            type="checkbox"
                            checked={getCurrentNotificationSetting(`system.${method.toLowerCase()}`)}
                            onChange={(e) => handleNotificationChange(`system.${method.toLowerCase()}`, e.target.checked)}
                            disabled={!isEditingNotifications}
                            className="w-4 h-4 rounded border-border text-foreground focus:ring-foreground/20 bg-muted/30 transition-all"
                          />
                          <span className="text-[10px] font-bold text-muted-foreground group-hover/label:text-foreground transition-colors">{method}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Notification Frequency */}
              <div className="bg-muted/10 border border-border rounded-xl p-5">
                <h4 className="text-xs font-bold text-foreground mb-4">Notification frequency</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {[
                    { val: 'immediate', label: 'Immediate', desc: 'Alerts as they happen' },
                    { val: 'hourly', label: 'Hourly Digest', desc: 'Bundled alerts every hour' },
                    { val: 'daily', label: 'Daily Summary', desc: 'End-of-day summary' }
                  ].map((freq) => (
                    <label key={freq.val} className={`p-4 bg-card border rounded-xl transition-all cursor-pointer group ${getCurrentNotificationSetting('frequency') === freq.val
                      ? 'border-indigo-600 ring-1 ring-indigo-600/10'
                      : 'border-border grayscale opacity-60 hover:grayscale-0 hover:opacity-100 hover:border-indigo-500/30'
                      }`}>
                      <input
                        type="radio"
                        name="frequency"
                        value={freq.val}
                        checked={getCurrentNotificationSetting('frequency') === freq.val}
                        onChange={(e) => handleNotificationChange('frequency', e.target.value)}
                        disabled={!isEditingNotifications}
                        className="sr-only"
                      />
                      <h5 className="text-[10px] font-bold text-foreground mb-1">{freq.label}</h5>
                      <p className="text-[10px] text-muted-foreground font-medium">{freq.desc}</p>
                    </label>
                  ))}
                </div>
              </div>

              {/* Quiet Hours */}
              <div className="bg-muted/10 border border-border rounded-xl p-5">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h4 className="text-xs font-bold text-foreground">Quiet hours</h4>
                    <p className="text-[10px] text-muted-foreground font-medium mt-0.5">Silence notifications during specific periods of the day</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={getCurrentNotificationSetting('quietHours.enabled')}
                      onChange={(e) => handleNotificationChange('quietHours.enabled', e.target.checked)}
                      disabled={!isEditingNotifications}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-muted/50 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-[20px] after:w-[20px] after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </div>
                {getCurrentNotificationSetting('quietHours.enabled') && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 ml-4">
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-semibold text-muted-foreground ml-1">Daily start time</label>
                      <input
                        type="time"
                        value={getCurrentNotificationSetting('quietHours.startTime')}
                        onChange={(e) => handleNotificationChange('quietHours.startTime', e.target.value)}
                        disabled={!isEditingNotifications}
                        className="w-full px-3 py-2 bg-muted/40 border border-border rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-xs text-foreground font-medium"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-semibold text-muted-foreground ml-1">Daily end time</label>
                      <input
                        type="time"
                        value={getCurrentNotificationSetting('quietHours.endTime')}
                        onChange={(e) => handleNotificationChange('quietHours.endTime', e.target.value)}
                        disabled={!isEditingNotifications}
                        className="w-full px-3 py-2 bg-muted/40 border border-border rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-xs text-foreground font-medium"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Account Security Tab */}
          {activeTab === 'account' && (
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-500/10 rounded-xl">
                  <Shield className="h-5 w-5 text-indigo-600" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-foreground tracking-tight">Account security</h2>
                  <p className="text-muted-foreground text-[10px] font-semibold mt-0.5">Protect your medical profile and patient data integrity</p>
                </div>
              </div>

              {/* Password Change */}
              <div className="bg-card/40 backdrop-blur-3xl border border-border rounded-xl p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-6">
                  <div className="p-1.5 bg-indigo-500/10 rounded-lg">
                    <Shield className="h-3.5 w-3.5 text-indigo-600" />
                  </div>
                  <h3 className="text-xs font-bold text-foreground">Credential management</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-semibold text-muted-foreground ml-1">Current password</label>
                    <input
                      type="password"
                      value={accountSettings.currentPassword}
                      onChange={(e) => setAccountSettings(prev => ({
                        ...prev, currentPassword: e.target.value
                      }))}
                      className="w-full px-3 py-2 bg-muted/40 border border-border rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-xs text-foreground placeholder:text-muted-foreground/40 font-medium"
                      placeholder="••••••••"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-semibold text-muted-foreground ml-1">New password</label>
                    <input
                      type="password"
                      value={accountSettings.newPassword}
                      onChange={(e) => setAccountSettings(prev => ({
                        ...prev, newPassword: e.target.value
                      }))}
                      className="w-full px-3 py-2 bg-muted/40 border border-border rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-xs text-foreground placeholder:text-muted-foreground/40 font-medium"
                      placeholder="Min 8 chars"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-semibold text-muted-foreground ml-1">Confirm password</label>
                    <input
                      type="password"
                      value={accountSettings.confirmPassword}
                      onChange={(e) => setAccountSettings(prev => ({
                        ...prev, confirmPassword: e.target.value
                      }))}
                      className="w-full px-3 py-2 bg-muted/40 border border-border rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-xs text-foreground placeholder:text-muted-foreground/40 font-medium"
                      placeholder="••••••••"
                    />
                  </div>
                </div>
                <div className="mt-6 flex justify-end">
                  <button
                    onClick={changePassword}
                    disabled={loading}
                    className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-bold text-[11px] hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-50"
                  >
                    {loading ? 'Processing...' : 'Update password'}
                  </button>
                </div>
              </div>

              {/* Two-Factor Authentication */}
              <div className="bg-card/40 backdrop-blur-3xl border border-border rounded-xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-emerald-500/10 rounded-lg">
                      <Shield className="h-3.5 w-3.5 text-emerald-600" />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-foreground">Multi-factor authentication</h3>
                      <p className="text-[10px] text-muted-foreground font-medium mt-0.5">Add an extra layer of security to your clinical login</p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-[10px] font-bold ${accountSettings.twoFactorEnabled
                    ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                    : 'bg-red-500/10 text-red-600 border border-red-500/20'
                    }`}>
                    {accountSettings.twoFactorEnabled ? 'Secure' : 'At risk'}
                  </span>
                </div>

                {accountSettings.twoFactorEnabled ? (
                  <div className="space-y-6">
                    {accountSettings.backupCodes.length > 0 && (
                      <div className="bg-indigo-500/5 border border-indigo-500/10 p-5 rounded-xl backdrop-blur-xl">
                        <div className="flex items-center gap-2 mb-4">
                          <AlertCircle className="h-4 w-4 text-indigo-600" />
                          <h4 className="text-[10px] font-bold text-indigo-600">Emergency recovery codes</h4>
                        </div>
                        <p className="text-[10px] text-muted-foreground font-medium mb-4">Keep these in a safe location. They allow access if your primary 2FA method is lost.</p>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          {accountSettings.backupCodes.map((code, index) => (
                            <code key={index} className="bg-muted px-2 py-1.5 rounded-lg border border-border text-foreground font-mono text-xs text-center">{code}</code>
                          ))}
                        </div>
                      </div>
                    )}
                    <div className="flex justify-end">
                      <button
                        onClick={disableTwoFactor}
                        disabled={loading}
                        className="bg-red-500/10 text-red-600 hover:bg-red-600 hover:text-white px-5 py-2 rounded-lg font-bold text-[11px] transition-all active:scale-95 border border-red-500/20"
                      >
                        {loading ? 'Deactivating...' : 'Deactivate MFA'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-center py-4">
                    <button
                      onClick={enableTwoFactor}
                      disabled={loading}
                      className="bg-emerald-600 text-white px-8 py-2.5 rounded-lg font-bold text-[11px] hover:bg-emerald-700 transition-all active:scale-95"
                    >
                      {loading ? 'Activating...' : 'Setup multi-factor auth'}
                    </button>
                  </div>
                )}
              </div>

              {/* Session Management */}
              <div className="bg-card/40 backdrop-blur-3xl border border-border rounded-xl p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-6">
                  <div className="p-1.5 bg-indigo-500/10 rounded-lg">
                    <Settings className="h-3.5 w-3.5 text-indigo-600" />
                  </div>
                  <h3 className="text-xs font-bold text-foreground">Session governance</h3>
                </div>
                <div className="max-w-md space-y-1.5">
                  <label className="block text-[10px] font-semibold text-muted-foreground ml-1">Automated logout timeout</label>
                  <select
                    value={accountSettings.sessionTimeout}
                    onChange={(e) => setAccountSettings(prev => ({
                      ...prev, sessionTimeout: e.target.value
                    }))}
                    className="w-full px-3 py-2 bg-muted/40 border border-border rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-xs text-foreground font-medium appearance-none"
                  >
                    <option value="15">15 minutes of inactivity</option>
                    <option value="30">30 minutes of inactivity</option>
                    <option value="60">1 hour of inactivity</option>
                    <option value="120">2 hours of inactivity</option>
                    <option value="480">8 hours (Full shift)</option>
                  </select>
                  <p className="text-[9px] text-muted-foreground font-medium mt-2 px-1 italic leading-tight">HIPAA compliance recommends shorter session timeouts in shared medical environments.</p>
                </div>
              </div>

              {/* Danger Zone */}
              <div className="bg-red-500/5 border border-red-500/10 p-6 rounded-xl backdrop-blur-3xl">
                <div className="flex items-center gap-2 mb-6">
                  <div className="p-1.5 bg-red-500/10 rounded-lg">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                  </div>
                  <h3 className="text-xs font-bold text-red-900 dark:text-red-400">Critical actions</h3>
                </div>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="max-w-md">
                    <h4 className="text-[11px] font-bold text-red-950 dark:text-red-300 mb-1">Irreversible account deletion</h4>
                    <p className="text-[10px] text-red-700 dark:text-red-500/70 font-medium leading-relaxed">
                      Permanently terminate your clinical profile, patient records access, and all associated healthcare data. This operation is physically irreversible once completed.
                    </p>
                  </div>
                  <button
                    onClick={() => setShowDeleteModal(true)}
                    className="bg-red-600 text-white px-6 py-2 rounded-lg font-bold text-[11px] hover:bg-red-700 transition-all active:scale-95 whitespace-nowrap"
                  >
                    Delete credentials
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Billing & Payment Tab */}
          {activeTab === 'billing' && (
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-500/10 rounded-xl">
                  <CreditCard className="h-5 w-5 text-indigo-600" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-foreground tracking-tight">Billing & payment settings</h2>
                  <p className="text-muted-foreground text-[10px] font-semibold mt-0.5">Manage your professional subscription and payment protocols</p>
                </div>
              </div>

              {/* Billing Information */}
              <div className="bg-card/40 backdrop-blur-3xl border border-border rounded-xl p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-6">
                  <div className="p-1.5 bg-indigo-500/10 rounded-lg">
                    <FileText className="h-3.5 w-3.5 text-indigo-600" />
                  </div>
                  <h3 className="text-xs font-bold text-foreground">Administrative details</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-semibold text-muted-foreground ml-1">Invoice dispatch email</label>
                    <input
                      type="email"
                      value={billingSettings.invoiceEmail}
                      onChange={(e) => setBillingSettings(prev => ({
                        ...prev, invoiceEmail: e.target.value
                      }))}
                      className="w-full px-3 py-2 bg-muted/40 border border-border rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-xs text-foreground font-medium"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-semibold text-muted-foreground ml-1">Professional tax identification (TID)</label>
                    <input
                      type="text"
                      value={billingSettings.taxId}
                      onChange={(e) => setBillingSettings(prev => ({
                        ...prev, taxId: e.target.value
                      }))}
                      className="w-full px-3 py-2 bg-muted/40 border border-border rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-xs text-foreground font-medium"
                      placeholder="Format: XX-XXXXXXX"
                    />
                  </div>
                </div>
              </div>

              {/* Billing Address */}
              <div className="bg-card/40 backdrop-blur-3xl border border-border rounded-xl p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-6">
                  <div className="p-1.5 bg-indigo-500/10 rounded-lg">
                    <MapPin className="h-3.5 w-3.5 text-indigo-600" />
                  </div>
                  <h3 className="text-xs font-bold text-foreground">Official billing address</h3>
                </div>
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-semibold text-muted-foreground ml-1">Street / practice location</label>
                    <input
                      type="text"
                      value={billingSettings.billingAddress.street}
                      onChange={(e) => setBillingSettings(prev => ({
                        ...prev, billingAddress: { ...prev.billingAddress, street: e.target.value }
                      }))}
                      className="w-full px-3 py-2 bg-muted/40 border border-border rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-xs text-foreground font-medium"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-semibold text-muted-foreground ml-1">City</label>
                      <input
                        type="text"
                        value={billingSettings.billingAddress.city}
                        onChange={(e) => setBillingSettings(prev => ({
                          ...prev, billingAddress: { ...prev.billingAddress, city: e.target.value }
                        }))}
                        className="w-full px-3 py-2 bg-muted/40 border border-border rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-xs text-foreground font-medium"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-semibold text-muted-foreground ml-1">State / province</label>
                      <input
                        type="text"
                        value={billingSettings.billingAddress.state}
                        onChange={(e) => setBillingSettings(prev => ({
                          ...prev, billingAddress: { ...prev.billingAddress, state: e.target.value }
                        }))}
                        className="w-full px-3 py-2 bg-muted/40 border border-border rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-xs text-foreground font-medium"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-semibold text-muted-foreground ml-1">ZIP / postal code</label>
                      <input
                        type="text"
                        value={billingSettings.billingAddress.zipCode}
                        onChange={(e) => setBillingSettings(prev => ({
                          ...prev, billingAddress: { ...prev.billingAddress, zipCode: e.target.value }
                        }))}
                        className="w-full px-3 py-2 bg-muted/40 border border-border rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-xs text-foreground font-medium"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Methods */}
              <div className="bg-card/40 backdrop-blur-3xl border border-border rounded-xl p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-6">
                  <div className="p-1.5 bg-indigo-500/10 rounded-lg">
                    <CreditCard className="h-3.5 w-3.5 text-indigo-600" />
                  </div>
                  <h3 className="text-xs font-bold text-foreground">Authorized payment methods</h3>
                </div>
                <div className="space-y-4">
                  {billingSettings.paymentMethods.length === 0 ? (
                    <div className="text-center py-8 bg-muted/10 border-2 border-dashed border-border rounded-xl">
                      <p className="text-[11px] text-muted-foreground font-medium mb-4">No payment methods registered</p>
                      <button className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-bold text-[11px] hover:bg-indigo-700 transition-all active:scale-95">
                        Add new card
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {billingSettings.paymentMethods.map((method, index) => (
                        <div key={index} className="flex items-center justify-between bg-card border border-border p-4 rounded-xl hover:shadow-sm transition-all group">
                          <div className="flex items-center space-x-3">
                            <div className="p-2 bg-indigo-500/5 rounded-lg">
                              <CreditCard className="h-5 w-5 text-indigo-600" />
                            </div>
                            <div>
                              <p className="font-mono text-foreground font-bold tracking-wider text-xs">•••• {method.last4}</p>
                              <p className="text-[10px] text-muted-foreground font-bold mt-0.5">Expiry: {method.expiry}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-3">
                            {method.isDefault && (
                              <span className="bg-indigo-500/10 text-indigo-600 px-2.5 py-0.5 rounded-full text-[10px] font-bold border border-indigo-500/20">
                                Primary
                              </span>
                            )}
                            <button className="text-red-500 hover:text-red-600 p-1.5 opacity-0 group-hover:opacity-100 transition-all rounded-lg hover:bg-red-500/5">
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                      <button className="flex items-center justify-center gap-2 border-2 border-dashed border-border rounded-xl p-4 text-muted-foreground hover:text-indigo-600 hover:border-indigo-600/30 hover:bg-indigo-500/5 transition-all group active:scale-[0.98]">
                        <Plus className="h-4 w-4 group-hover:scale-110 transition-all" />
                        <span className="text-[10px] font-bold">Add professional method</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Auto-pay Settings */}
              <div className="bg-emerald-500/5 border border-emerald-500/10 p-5 rounded-xl backdrop-blur-3xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-500/10 rounded-xl">
                      <Settings className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-emerald-950 dark:text-emerald-400">Automatic settlement</h4>
                      <p className="text-[10px] text-emerald-700 dark:text-emerald-500/70 font-medium">Automatically process professional invoices on due dates</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={billingSettings.autoPayEnabled}
                      onChange={(e) => setBillingSettings(prev => ({
                        ...prev, autoPayEnabled: e.target.checked
                      }))}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-muted/50 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-[20px] after:w-[20px] after:transition-all peer-checked:bg-emerald-600"></div>
                  </label>
                </div>
              </div>

              <div className="mt-8 flex justify-end">
                <button
                  onClick={updateBillingSettings}
                  disabled={loading}
                  className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-bold text-[11px] hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-50"
                >
                  {loading ? 'Synchronizing...' : 'Save administrative changes'}
                </button>
              </div>
            </div>
          )}

          {/* Preferences Tab */}
          {activeTab === 'preferences' && (
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-500/10 rounded-xl">
                  <Globe className="h-5 w-5 text-indigo-600" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-foreground tracking-tight">General preferences</h2>
                  <p className="text-muted-foreground text-[10px] font-semibold mt-0.5">Configure your clinical environment and accessibility settings</p>
                </div>
              </div>

              <div className="bg-card/40 backdrop-blur-3xl border border-border rounded-xl p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-6">
                  <div className="p-1.5 bg-indigo-500/10 rounded-lg">
                    <Globe className="h-3.5 w-3.5 text-indigo-600" />
                  </div>
                  <h3 className="text-xs font-bold text-foreground">Localization & time</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-semibold text-muted-foreground ml-1">Interface language</label>
                    <select className="w-full px-3 py-2 bg-muted/40 border border-border rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-xs text-foreground font-medium appearance-none">
                      <option>English (United States)</option>
                      <option>Spanish (Castilian)</option>
                      <option>French (Standard)</option>
                      <option>German (Standard)</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-semibold text-muted-foreground ml-1">Clinical timezone</label>
                    <select className="w-full px-3 py-2 bg-muted/40 border border-border rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-xs text-foreground font-medium appearance-none">
                      <option>UTC-5 (Eastern Time)</option>
                      <option>UTC-8 (Pacific Time)</option>
                      <option>UTC+0 (GMT)</option>
                      <option>UTC+1 (Central European Time)</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="bg-card/40 backdrop-blur-3xl border border-border rounded-xl p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-6">
                  <div className="p-1.5 bg-indigo-500/10 rounded-lg">
                    <Shield className="h-3.5 w-3.5 text-indigo-600" />
                  </div>
                  <h3 className="text-xs font-bold text-foreground">Accessibility & display</h3>
                </div>
                <div className="space-y-2">
                  {[
                    { label: 'High contrast mode', desc: 'Enhanced visibility for clinical data elements' },
                    { label: 'Screen reader optimization', desc: 'Optimized ARIA labels for assistive technology' },
                    { label: 'Reduced motion', desc: 'Minimize animations during critical operations' }
                  ].map((pref) => (
                    <div key={pref.label} className="flex items-center justify-between py-3 border-b border-border last:border-0 transition-colors hover:bg-muted/5 px-2 rounded-lg">
                      <div>
                        <h4 className="text-[11px] font-bold text-foreground">{pref.label}</h4>
                        <p className="text-[10px] text-muted-foreground font-medium mt-0.5">{pref.desc}</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" />
                        <div className="w-11 h-6 bg-muted/50 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-[20px] after:w-[20px] after:transition-all peer-checked:bg-indigo-600"></div>
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 flex items-center justify-center z-[9999] p-6">
          <div className="absolute inset-0 bg-background/60 backdrop-blur-sm transition-all" onClick={() => setShowDeleteModal(false)}></div>
          <div className="bg-card border border-red-500/20 w-full max-w-sm rounded-xl p-8 shadow-2xl relative z-10 overflow-hidden text-card-foreground animate-in zoom-in-95 duration-200">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 to-orange-500"></div>
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-red-500/10 rounded-lg">
                <Trash2 className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-foreground tracking-tight">Terminate credentials</h3>
                <p className="text-[10px] text-red-600 font-bold uppercase tracking-wider mt-0.5">High-stakes irreversible operation</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-red-500/5 border border-red-500/10 rounded-lg p-4">
                <p className="text-xs text-red-900 dark:text-red-400 font-medium leading-relaxed">
                  Warning: Deleting your account will permanently remove all medical data, practice configurations, and platform access. This cannot be undone.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-muted-foreground ml-1">
                  Type <span className="text-red-600">DELETE</span> to confirm
                </label>
                <input
                  type="text"
                  value={deleteConfirmation}
                  onChange={(e) => setDeleteConfirmation(e.target.value)}
                  className="w-full px-3 py-2 bg-muted/40 border border-border rounded-lg focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all text-xs text-foreground font-bold tracking-widest placeholder:text-muted-foreground/30"
                  placeholder="CONFIRMATION KEY"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setDeleteConfirmation('');
                  }}
                  className="flex-1 px-4 py-2 bg-muted text-foreground rounded-lg hover:bg-muted/80 transition-all font-bold text-[11px]"
                >
                  Abstain
                </button>
                <button
                  onClick={deleteAccount}
                  disabled={deleteConfirmation !== 'DELETE' || loading}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all font-bold text-[11px] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Terminating...' : 'Terminate now'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default SettingsTab;
