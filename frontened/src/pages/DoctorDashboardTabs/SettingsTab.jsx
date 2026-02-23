import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { API_URLS } from '../../config/api';
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
        const notifyResponse = await fetch(API_URLS.DOCTORS.NOTIFICATIONS, {
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
        const billingResponse = await fetch(API_URLS.BILLING.SETTINGS, {
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

      const response = await fetch(API_URLS.DOCTORS.NOTIFICATIONS, {
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

  const testNotification = async (type, method) => {
    try {
      const token = localStorage.getItem('authToken');

      const response = await fetch(API_URLS.DOCTORS.TEST_NOTIFICATION, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ type, method })
      });

      if (response.ok) {
        showSuccessMessage(`Test ${method} notification sent successfully`);
      } else {
        throw new Error('Failed to send test notification');
      }
    } catch (error) {
      showErrorMessage('Failed to send test notification');
      console.error('Test notification error:', error);
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

      const response = await fetch(API_URLS.AUTH.CHANGE_PASSWORD, {
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

      const response = await fetch(API_URLS.AUTH.ENABLE_2FA, {
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
    } catch (error) {
      showErrorMessage('Failed to enable two-factor authentication');
    } finally {
      setLoading(false);
    }
  };

  const disableTwoFactor = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');

      const response = await fetch(API_URLS.AUTH.DISABLE_2FA, {
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
    } catch (error) {
      showErrorMessage('Failed to disable two-factor authentication');
    } finally {
      setLoading(false);
    }
  };

  const updateBillingSettings = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');

      const response = await fetch(API_URLS.BILLING.SETTINGS, {
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
    } catch (error) {
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

      const response = await fetch(API_URLS.DOCTORS.DELETE_ACCOUNT, {
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
    } catch (error) {
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
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black text-foreground mb-2 tracking-tighter">Settings</h1>
        <p className="text-muted-foreground text-[11px] font-black uppercase tracking-[0.3em]">Manage your premium account preferences and security configurations</p>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 px-6 py-4 rounded-2xl font-black text-[11px] uppercase tracking-wider backdrop-blur-xl">
          {success}
        </div>
      )}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-600 px-6 py-4 rounded-2xl font-black text-[11px] uppercase tracking-wider backdrop-blur-xl">
          {error}
        </div>
      )}

      {/* Tab Navigation */}
      <div className="bg-card/60 backdrop-blur-3xl border border-border rounded-[2.5rem] overflow-hidden shadow-2xl">
        <div className="flex flex-wrap border-b border-border p-2">
          {tabs.map((tab) => {
            const IconComponent = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-3 px-8 py-4 text-[11px] font-black uppercase tracking-[0.2em] transition-all rounded-2xl ${isActive
                  ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-500/30'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  }`}
              >
                <IconComponent className={`h-4 w-4 ${isActive ? 'text-white' : 'text-indigo-500'}`} />
                {tab.name}
              </button>
            );
          })}
        </div>

        <div className="p-10">
          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <div className="space-y-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-indigo-500/10 rounded-2xl">
                    <Bell className="h-6 w-6 text-indigo-600" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-foreground tracking-tighter">Notification Settings</h2>
                    <p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest mt-1">Manage how you receive critical medical alerts</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  {!isEditingNotifications ? (
                    <button
                      onClick={startEditingNotifications}
                      className="px-8 py-3 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700 transition-all font-black text-[11px] uppercase tracking-[0.2em] shadow-xl shadow-indigo-500/20 active:scale-95"
                    >
                      Edit Settings
                    </button>
                  ) : (
                    <div className="flex gap-3">
                      <button
                        onClick={cancelEditingNotifications}
                        className="px-8 py-3 bg-muted text-foreground rounded-2xl hover:bg-muted/80 transition-all font-black text-[11px] uppercase tracking-[0.2em] active:scale-95 border border-border"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={updateNotificationSettings}
                        disabled={loading || !notificationChanges}
                        className="px-8 py-3 bg-emerald-600 text-white rounded-2xl hover:bg-emerald-700 transition-all font-black text-[11px] uppercase tracking-[0.2em] shadow-xl shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
                      >
                        {loading ? 'Saving...' : 'Save Changes'}
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Edit mode indicator */}
              {isEditingNotifications && (
                <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-3xl p-6 backdrop-blur-3xl">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-indigo-500/20 rounded-xl">
                      <Settings className="h-5 w-5 text-indigo-600 animate-spin-slow" />
                    </div>
                    <div>
                      <span className="text-xs text-indigo-600 font-black uppercase tracking-[0.2em]">
                        Configuration Mode Active
                      </span>
                      <p className="text-muted-foreground text-[11px] font-medium tracking-wide mt-1">
                        Make your changes and click "Save Changes" to apply them to your profile
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Global Controls */}
              <div className="bg-orange-500/5 border border-orange-500/10 rounded-3xl p-6 backdrop-blur-3xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-orange-500/10 rounded-2xl">
                      <AlertCircle className="h-6 w-6 text-orange-600" />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-orange-950 dark:text-orange-400 uppercase tracking-[0.2em]">Global Notification Control</h4>
                      <p className="text-[11px] text-orange-700 dark:text-orange-500/70 font-medium tracking-wide">Temporarily mute all incoming dashboard alerts</p>
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
                    <div className={`w-14 h-7 bg-muted/50 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:rounded-full after:h-[20px] after:w-[20px] after:transition-all peer-checked:bg-orange-600 ${!isEditingNotifications ? 'opacity-30 cursor-not-allowed' : 'shadow-lg'}`}></div>
                  </label>
                </div>
              </div>

              {/* Notification Categories */}
              <div className="grid gap-6">
                {/* Appointments */}
                <div className="bg-muted/20 border border-border rounded-[2rem] p-8 hover:bg-muted/30 transition-all group">
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-indigo-500/10 rounded-2xl group-hover:bg-indigo-500 group-hover:text-white transition-all">
                        <Calendar className="h-6 w-6 text-indigo-600 group-hover:text-white" />
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-foreground uppercase tracking-[0.2em]">Appointments</h4>
                        <p className="text-[11px] text-muted-foreground font-medium tracking-wide">New appointments, status changes, and clinical reminders</p>
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
                      <div className="w-14 h-7 bg-muted/50 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:rounded-full after:h-[20px] after:w-[20px] after:transition-all peer-checked:bg-indigo-600"></div>
                    </label>
                  </div>
                  {(isEditingNotifications ? editedNotificationSettings?.appointments?.enabled : notificationSettings.appointments.enabled) && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 ml-8">
                      {['Email', 'Push', 'SMS'].map((method) => (
                        <label key={method} className="flex items-center gap-4 cursor-pointer group/label">
                          <input
                            type="checkbox"
                            checked={isEditingNotifications ? editedNotificationSettings?.appointments?.[method.toLowerCase()] : notificationSettings.appointments[method.toLowerCase()]}
                            onChange={(e) => isEditingNotifications && updateEditedNotificationSetting(`appointments.${method.toLowerCase()}`, e.target.checked)}
                            disabled={!isEditingNotifications}
                            className="w-5 h-5 rounded-lg border-border text-indigo-600 focus:ring-indigo-500/20 bg-muted/30"
                          />
                          <span className="text-[11px] font-black uppercase tracking-widest text-muted-foreground group-hover/label:text-foreground transition-colors">{method}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>

                {/* Billing */}
                <div className="bg-muted/20 border border-border rounded-[2rem] p-8 hover:bg-muted/30 transition-all group">
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-emerald-500/10 rounded-2xl group-hover:bg-emerald-500 group-hover:text-white transition-all">
                        <CreditCard className="h-6 w-6 text-emerald-600 group-hover:text-white" />
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-foreground uppercase tracking-[0.2em]">Billing & Payments</h4>
                        <p className="text-[11px] text-muted-foreground font-medium tracking-wide">Payment alerts, invoice updates, and subscription changes</p>
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
                      <div className={`w-14 h-7 bg-muted/50 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:rounded-full after:h-[20px] after:w-[20px] after:transition-all peer-checked:bg-emerald-600 ${!isEditingNotifications ? 'opacity-30 cursor-not-allowed' : ''}`}></div>
                    </label>
                  </div>
                  {getCurrentNotificationSetting('billing.enabled') && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 ml-8">
                      {['Email', 'Push', 'SMS'].map((method) => (
                        <label key={method} className="flex items-center gap-4 cursor-pointer group/label">
                          <input
                            type="checkbox"
                            checked={getCurrentNotificationSetting(`billing.${method.toLowerCase()}`)}
                            onChange={(e) => handleNotificationChange(`billing.${method.toLowerCase()}`, e.target.checked)}
                            disabled={!isEditingNotifications}
                            className="w-5 h-5 rounded-lg border-border text-emerald-600 focus:ring-emerald-500/20 bg-muted/30"
                          />
                          <span className="text-[11px] font-black uppercase tracking-widest text-muted-foreground group-hover/label:text-foreground transition-colors">{method}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>

                {/* Chat/Messages */}
                <div className="bg-muted/20 border border-border rounded-[2rem] p-8 hover:bg-muted/30 transition-all group">
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-indigo-500/10 rounded-2xl group-hover:bg-indigo-500 group-hover:text-white transition-all">
                        <MessageCircle className="h-6 w-6 text-indigo-600 group-hover:text-white" />
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-foreground uppercase tracking-[0.2em]">Messages & Chat</h4>
                        <p className="text-[11px] text-muted-foreground font-medium tracking-wide">New messages from colleagues, staff, and direct patient interaction</p>
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
                      <div className={`w-14 h-7 bg-muted/50 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:rounded-full after:h-[20px] after:w-[20px] after:transition-all peer-checked:bg-indigo-600 ${!isEditingNotifications ? 'opacity-30 cursor-not-allowed' : ''}`}></div>
                    </label>
                  </div>
                  {getCurrentNotificationSetting('chat.enabled') && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 ml-8">
                      {['Email', 'Push', 'SMS'].map((method) => (
                        <label key={method} className="flex items-center gap-4 cursor-pointer group/label">
                          <input
                            type="checkbox"
                            checked={getCurrentNotificationSetting(`chat.${method.toLowerCase()}`)}
                            onChange={(e) => handleNotificationChange(`chat.${method.toLowerCase()}`, e.target.checked)}
                            disabled={!isEditingNotifications}
                            className="w-5 h-5 rounded-lg border-border text-indigo-600 focus:ring-indigo-500/20 bg-muted/30"
                          />
                          <span className="text-[11px] font-black uppercase tracking-widest text-muted-foreground group-hover/label:text-foreground transition-colors">{method}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>

                {/* Patients */}
                <div className="bg-muted/20 border border-border rounded-[2rem] p-8 hover:bg-muted/30 transition-all group">
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-indigo-500/10 rounded-2xl group-hover:bg-indigo-500 group-hover:text-white transition-all">
                        <Users className="h-6 w-6 text-indigo-600 group-hover:text-white" />
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-foreground uppercase tracking-[0.2em]">Patient Updates</h4>
                        <p className="text-[11px] text-muted-foreground font-medium tracking-wide">New registrations, medical records updates, and file shares</p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={getCurrentNotificationSetting('patients.enabled')}
                        onChange={(e) => handleNotificationChange('patients.enabled', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className={`w-14 h-7 bg-muted/50 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:rounded-full after:h-[20px] after:w-[20px] after:transition-all peer-checked:bg-indigo-600 ${!isEditingNotifications ? 'opacity-30 cursor-not-allowed' : ''}`}></div>
                    </label>
                  </div>
                  {getCurrentNotificationSetting('patients.enabled') && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 ml-8">
                      {['Email', 'Push', 'SMS'].map((method) => (
                        <label key={method} className="flex items-center gap-4 cursor-pointer group/label">
                          <input
                            type="checkbox"
                            checked={getCurrentNotificationSetting(`patients.${method.toLowerCase()}`)}
                            onChange={(e) => handleNotificationChange(`patients.${method.toLowerCase()}`, e.target.checked)}
                            disabled={!isEditingNotifications}
                            className="w-5 h-5 rounded-lg border-border text-indigo-600 focus:ring-indigo-500/20 bg-muted/30"
                          />
                          <span className="text-[11px] font-black uppercase tracking-widest text-muted-foreground group-hover/label:text-foreground transition-colors">{method}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>

                {/* System Notifications */}
                <div className="bg-muted/20 border border-border rounded-[2rem] p-8 hover:bg-muted/30 transition-all group">
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-muted rounded-2xl group-hover:bg-foreground group-hover:text-background transition-all">
                        <Settings className="h-6 w-6 text-foreground group-hover:text-background" />
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-foreground uppercase tracking-[0.2em]">System Notifications</h4>
                        <p className="text-[11px] text-muted-foreground font-medium tracking-wide">Maintenance schedules, platform updates, and security announcements</p>
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
                      <div className={`w-14 h-7 bg-muted/50 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:rounded-full after:h-[20px] after:w-[20px] after:transition-all peer-checked:bg-foreground ${!isEditingNotifications ? 'opacity-30 cursor-not-allowed' : ''}`}></div>
                    </label>
                  </div>
                  {getCurrentNotificationSetting('system.enabled') && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 ml-8">
                      {['Email', 'Push', 'SMS'].map((method) => (
                        <label key={method} className="flex items-center gap-4 cursor-pointer group/label">
                          <input
                            type="checkbox"
                            checked={getCurrentNotificationSetting(`system.${method.toLowerCase()}`)}
                            onChange={(e) => handleNotificationChange(`system.${method.toLowerCase()}`, e.target.checked)}
                            disabled={!isEditingNotifications}
                            className="w-5 h-5 rounded-lg border-border text-foreground focus:ring-foreground/20 bg-muted/30"
                          />
                          <span className="text-[11px] font-black uppercase tracking-widest text-muted-foreground group-hover/label:text-foreground transition-colors">{method}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Notification Frequency */}
              <div className="bg-muted/20 border border-border rounded-[2rem] p-8">
                <h4 className="text-sm font-black text-foreground uppercase tracking-[0.2em] mb-6">Notification Frequency</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    { val: 'immediate', label: 'Immediate', desc: 'Alerts as they happen' },
                    { val: 'hourly', label: 'Hourly Digest', desc: 'Bundled alerts every hour' },
                    { val: 'daily', label: 'Daily Summary', desc: 'End-of-day summary' }
                  ].map((freq) => (
                    <label key={freq.val} className={`p-6 bg-card border rounded-2xl transition-all cursor-pointer group ${getCurrentNotificationSetting('frequency') === freq.val
                      ? 'border-indigo-600 ring-2 ring-indigo-600/10'
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
                      <h5 className="text-[11px] font-black uppercase tracking-widest text-foreground mb-1">{freq.label}</h5>
                      <p className="text-[10px] text-muted-foreground font-medium tracking-wide">{freq.desc}</p>
                    </label>
                  ))}
                </div>
              </div>

              {/* Quiet Hours */}
              <div className="bg-muted/20 border border-border rounded-[2rem] p-8">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h4 className="text-sm font-black text-foreground uppercase tracking-[0.2em]">Quiet Hours</h4>
                    <p className="text-[11px] text-muted-foreground font-medium tracking-wide mt-1">Silence notifications during specific periods of the day</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={getCurrentNotificationSetting('quietHours.enabled')}
                      onChange={(e) => handleNotificationChange('quietHours.enabled', e.target.checked)}
                      disabled={!isEditingNotifications}
                      className="sr-only peer"
                    />
                    <div className="w-14 h-7 bg-muted/50 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:rounded-full after:h-[20px] after:w-[20px] after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </div>
                {getCurrentNotificationSetting('quietHours.enabled') && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 ml-4">
                    <div className="space-y-3">
                      <label className="block text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Daily Start Time</label>
                      <input
                        type="time"
                        value={getCurrentNotificationSetting('quietHours.startTime')}
                        onChange={(e) => handleNotificationChange('quietHours.startTime', e.target.value)}
                        disabled={!isEditingNotifications}
                        className="w-full px-6 py-4 bg-muted/40 border border-border rounded-2xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-foreground font-medium"
                      />
                    </div>
                    <div className="space-y-3">
                      <label className="block text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Daily End Time</label>
                      <input
                        type="time"
                        value={getCurrentNotificationSetting('quietHours.endTime')}
                        onChange={(e) => handleNotificationChange('quietHours.endTime', e.target.value)}
                        disabled={!isEditingNotifications}
                        className="w-full px-6 py-4 bg-muted/40 border border-border rounded-2xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-foreground font-medium"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Account Security Tab */}
          {activeTab === 'account' && (
            <div className="space-y-10">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-indigo-500/10 rounded-2xl">
                  <Shield className="h-6 w-6 text-indigo-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-foreground tracking-tighter">Account Security</h2>
                  <p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest mt-1">Protect your medical profile and patient data integrity</p>
                </div>
              </div>

              {/* Password Change */}
              <div className="bg-card/40 backdrop-blur-3xl border border-border rounded-[2.5rem] p-10 shadow-xl">
                <div className="flex items-center gap-3 mb-8">
                  <div className="p-2 bg-indigo-500/10 rounded-xl">
                    <Shield className="h-4 w-4 text-indigo-600" />
                  </div>
                  <h3 className="text-sm font-black text-foreground uppercase tracking-[0.2em]">Credential Management</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div className="space-y-3">
                    <label className="block text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Current Password</label>
                    <input
                      type="password"
                      value={accountSettings.currentPassword}
                      onChange={(e) => setAccountSettings(prev => ({
                        ...prev, currentPassword: e.target.value
                      }))}
                      className="w-full px-6 py-4 bg-muted/40 border border-border rounded-2xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-foreground placeholder:text-muted-foreground/40 font-medium"
                      placeholder="••••••••"
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="block text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">New Password</label>
                    <input
                      type="password"
                      value={accountSettings.newPassword}
                      onChange={(e) => setAccountSettings(prev => ({
                        ...prev, newPassword: e.target.value
                      }))}
                      className="w-full px-6 py-4 bg-muted/40 border border-border rounded-2xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-foreground placeholder:text-muted-foreground/40 font-medium"
                      placeholder="Minimum 8 characters"
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="block text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Confirm Profile Password</label>
                    <input
                      type="password"
                      value={accountSettings.confirmPassword}
                      onChange={(e) => setAccountSettings(prev => ({
                        ...prev, confirmPassword: e.target.value
                      }))}
                      className="w-full px-6 py-4 bg-muted/40 border border-border rounded-2xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-foreground placeholder:text-muted-foreground/40 font-medium"
                      placeholder="••••••••"
                    />
                  </div>
                </div>
                <div className="mt-10 flex justify-end">
                  <button
                    onClick={changePassword}
                    disabled={loading}
                    className="bg-indigo-600 text-white px-10 py-4 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] shadow-xl shadow-indigo-500/30 hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-50"
                  >
                    {loading ? 'Processing...' : 'Update Secure Password'}
                  </button>
                </div>
              </div>

              {/* Two-Factor Authentication */}
              <div className="bg-card/40 backdrop-blur-3xl border border-border rounded-[2.5rem] p-10 shadow-xl">
                <div className="flex items-center justify-between mb-10">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-500/10 rounded-xl">
                      <Shield className="h-4 w-4 text-emerald-600" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-foreground uppercase tracking-[0.2em]">Multi-Factor Authentication</h3>
                      <p className="text-[11px] text-muted-foreground font-medium tracking-wide mt-1">Add an extra layer of security to your clinical login</p>
                    </div>
                  </div>
                  <span className={`px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest ${accountSettings.twoFactorEnabled
                    ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                    : 'bg-red-500/10 text-red-600 border border-red-500/20'
                    }`}>
                    {accountSettings.twoFactorEnabled ? 'Highly Secure' : 'At Risk'}
                  </span>
                </div>

                {accountSettings.twoFactorEnabled ? (
                  <div className="space-y-8">
                    {accountSettings.backupCodes.length > 0 && (
                      <div className="bg-indigo-500/5 border border-indigo-500/10 p-8 rounded-[2rem] backdrop-blur-xl">
                        <div className="flex items-center gap-3 mb-6">
                          <AlertCircle className="h-5 w-5 text-indigo-600" />
                          <h4 className="text-[11px] font-black text-indigo-600 uppercase tracking-widest">Emergency Recovery Codes</h4>
                        </div>
                        <p className="text-[11px] text-muted-foreground font-medium tracking-wide mb-6">Keep these codes in a paper-based secure location. They allow access if your primary 2FA method is lost.</p>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          {accountSettings.backupCodes.map((code, index) => (
                            <code key={index} className="bg-muted px-4 py-3 rounded-xl border border-border text-foreground font-mono text-sm text-center">{code}</code>
                          ))}
                        </div>
                      </div>
                    )}
                    <div className="flex justify-end">
                      <button
                        onClick={disableTwoFactor}
                        disabled={loading}
                        className="bg-red-500/10 text-red-600 hover:bg-red-600 hover:text-white px-8 py-4 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] transition-all active:scale-95 border border-red-500/20"
                      >
                        {loading ? 'Deactivating...' : 'Deactivate MFA'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-center py-6">
                    <button
                      onClick={enableTwoFactor}
                      disabled={loading}
                      className="bg-emerald-600 text-white px-10 py-4 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] shadow-xl shadow-emerald-500/30 hover:bg-emerald-700 transition-all active:scale-95"
                    >
                      {loading ? 'Activating...' : 'Setup Multi-Factor Auth'}
                    </button>
                  </div>
                )}
              </div>

              {/* Session Management */}
              <div className="bg-card/40 backdrop-blur-3xl border border-border rounded-[2.5rem] p-10 shadow-xl">
                <div className="flex items-center gap-3 mb-8">
                  <div className="p-2 bg-indigo-500/10 rounded-xl">
                    <Settings className="h-4 w-4 text-indigo-600" />
                  </div>
                  <h3 className="text-sm font-black text-foreground uppercase tracking-[0.2em]">Session Governance</h3>
                </div>
                <div className="max-w-md space-y-3">
                  <label className="block text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Automated Logout Timeout</label>
                  <select
                    value={accountSettings.sessionTimeout}
                    onChange={(e) => setAccountSettings(prev => ({
                      ...prev, sessionTimeout: e.target.value
                    }))}
                    className="w-full px-6 py-4 bg-muted/40 border border-border rounded-2xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-foreground font-medium"
                  >
                    <option value="15">15 Minutes of Inactivity</option>
                    <option value="30">30 Minutes of Inactivity</option>
                    <option value="60">1 Hour of Inactivity</option>
                    <option value="120">2 Hours of Inactivity</option>
                    <option value="480">8 Hours (Full Shift)</option>
                  </select>
                  <p className="text-[10px] text-muted-foreground font-medium tracking-wide mt-3 px-1 italic">HIPAA compliance recommends shorter session timeouts in shared medical environments.</p>
                </div>
              </div>

              {/* Danger Zone */}
              <div className="bg-red-500/5 border border-red-500/10 p-10 rounded-[2.5rem] backdrop-blur-3xl">
                <div className="flex items-center gap-3 mb-8">
                  <div className="p-2 bg-red-500/10 rounded-xl">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                  </div>
                  <h3 className="text-sm font-black text-red-900 dark:text-red-400 uppercase tracking-[0.2em]">Critical Actions</h3>
                </div>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                  <div className="max-w-lg">
                    <h4 className="text-sm font-black text-red-950 dark:text-red-300 uppercase tracking-widest mb-2">Irreversible Account Deletion</h4>
                    <p className="text-[11px] text-red-700 dark:text-red-500/70 font-medium tracking-wide leading-relaxed">
                      Permanently terminate your clinical profile, patient records access, and all associated healthcare data. This operation is encrypted and physically irreversible once completed.
                    </p>
                  </div>
                  <button
                    onClick={() => setShowDeleteModal(true)}
                    className="bg-red-600 text-white px-10 py-4 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] shadow-xl shadow-red-500/30 hover:bg-red-700 transition-all active:scale-95 whitespace-nowrap"
                  >
                    Delete My Credentials
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Billing & Payment Tab */}
          {activeTab === 'billing' && (
            <div className="space-y-10">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-indigo-500/10 rounded-2xl">
                  <CreditCard className="h-6 w-6 text-indigo-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-foreground tracking-tighter">Billing & Payment Settings</h2>
                  <p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest mt-1">Manage your professional subscription and payment protocols</p>
                </div>
              </div>

              {/* Billing Information */}
              <div className="bg-card/40 backdrop-blur-3xl border border-border rounded-[2.5rem] p-10 shadow-xl">
                <div className="flex items-center gap-3 mb-8">
                  <div className="p-2 bg-indigo-500/10 rounded-xl">
                    <FileText className="h-4 w-4 text-indigo-600" />
                  </div>
                  <h3 className="text-sm font-black text-foreground uppercase tracking-[0.2em]">Administrative Details</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <label className="block text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Primary Invoice Dispatch Email</label>
                    <input
                      type="email"
                      value={billingSettings.invoiceEmail}
                      onChange={(e) => setBillingSettings(prev => ({
                        ...prev, invoiceEmail: e.target.value
                      }))}
                      className="w-full px-6 py-4 bg-muted/40 border border-border rounded-2xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-foreground font-medium"
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="block text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Professional Tax Identification (TID)</label>
                    <input
                      type="text"
                      value={billingSettings.taxId}
                      onChange={(e) => setBillingSettings(prev => ({
                        ...prev, taxId: e.target.value
                      }))}
                      className="w-full px-6 py-4 bg-muted/40 border border-border rounded-2xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-foreground font-medium"
                      placeholder="Format: XX-XXXXXXX"
                    />
                  </div>
                </div>
              </div>

              {/* Billing Address */}
              <div className="bg-card/40 backdrop-blur-3xl border border-border rounded-[2.5rem] p-10 shadow-xl">
                <div className="flex items-center gap-3 mb-8">
                  <div className="p-2 bg-indigo-500/10 rounded-xl">
                    <MapPin className="h-4 w-4 text-indigo-600" />
                  </div>
                  <h3 className="text-sm font-black text-foreground uppercase tracking-[0.2em]">Official Billing Address</h3>
                </div>
                <div className="space-y-6">
                  <div className="space-y-3">
                    <label className="block text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Street / Practice Location</label>
                    <input
                      type="text"
                      value={billingSettings.billingAddress.street}
                      onChange={(e) => setBillingSettings(prev => ({
                        ...prev, billingAddress: { ...prev.billingAddress, street: e.target.value }
                      }))}
                      className="w-full px-6 py-4 bg-muted/40 border border-border rounded-2xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-foreground font-medium"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="space-y-3">
                      <label className="block text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">City</label>
                      <input
                        type="text"
                        value={billingSettings.billingAddress.city}
                        onChange={(e) => setBillingSettings(prev => ({
                          ...prev, billingAddress: { ...prev.billingAddress, city: e.target.value }
                        }))}
                        className="w-full px-6 py-4 bg-muted/40 border border-border rounded-2xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-foreground font-medium"
                      />
                    </div>
                    <div className="space-y-3">
                      <label className="block text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">State / Province</label>
                      <input
                        type="text"
                        value={billingSettings.billingAddress.state}
                        onChange={(e) => setBillingSettings(prev => ({
                          ...prev, billingAddress: { ...prev.billingAddress, state: e.target.value }
                        }))}
                        className="w-full px-6 py-4 bg-muted/40 border border-border rounded-2xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-foreground font-medium"
                      />
                    </div>
                    <div className="space-y-3">
                      <label className="block text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">ZIP / Postal Code</label>
                      <input
                        type="text"
                        value={billingSettings.billingAddress.zipCode}
                        onChange={(e) => setBillingSettings(prev => ({
                          ...prev, billingAddress: { ...prev.billingAddress, zipCode: e.target.value }
                        }))}
                        className="w-full px-6 py-4 bg-muted/40 border border-border rounded-2xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-foreground font-medium"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Methods */}
              <div className="bg-card/40 backdrop-blur-3xl border border-border rounded-[2.5rem] p-10 shadow-xl">
                <div className="flex items-center gap-3 mb-8">
                  <div className="p-2 bg-indigo-500/10 rounded-xl">
                    <CreditCard className="h-4 w-4 text-indigo-600" />
                  </div>
                  <h3 className="text-sm font-black text-foreground uppercase tracking-[0.2em]">Authorized Payment Methods</h3>
                </div>
                <div className="space-y-6">
                  {billingSettings.paymentMethods.length === 0 ? (
                    <div className="text-center py-12 bg-muted/20 border-2 border-dashed border-border rounded-3xl">
                      <p className="text-muted-foreground font-medium mb-6">No clinical payment methods registered</p>
                      <button className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black text-[11px] uppercase tracking-[0.15em] shadow-xl shadow-indigo-500/20 hover:bg-indigo-700 transition-all active:scale-95">
                        Initialize New Card
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {billingSettings.paymentMethods.map((method, index) => (
                        <div key={index} className="flex items-center justify-between bg-card border border-border p-6 rounded-[1.5rem] shadow-sm hover:shadow-md transition-all group">
                          <div className="flex items-center space-x-4">
                            <div className="p-3 bg-muted rounded-xl bg-indigo-500/5">
                              <CreditCard className="h-6 w-6 text-indigo-600" />
                            </div>
                            <div>
                              <p className="font-mono text-foreground font-black tracking-widest text-sm">•••• {method.last4}</p>
                              <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest mt-1">Expiry: {method.expiry}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-4">
                            {method.isDefault && (
                              <span className="bg-indigo-500/10 text-indigo-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-indigo-500/20">
                                Primary
                              </span>
                            )}
                            <button className="text-red-500 hover:text-red-600 p-2 opacity-0 group-hover:opacity-100 transition-all rounded-lg hover:bg-red-500/5">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                      <button className="flex items-center justify-center gap-3 border-2 border-dashed border-border rounded-[1.5rem] p-6 text-muted-foreground hover:text-indigo-600 hover:border-indigo-600/30 hover:bg-indigo-500/5 transition-all group active:scale-[0.98]">
                        <Plus className="h-5 w-5 group-hover:scale-110 transition-all font-black" />
                        <span className="text-[11px] font-black uppercase tracking-widest">Add Professional Method</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Auto-pay Settings */}
              <div className="bg-emerald-500/5 border border-emerald-500/10 p-10 rounded-[2.5rem] backdrop-blur-3xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-emerald-500/10 rounded-2xl">
                      <Settings className="h-6 w-6 text-emerald-600" />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-emerald-950 dark:text-emerald-400 uppercase tracking-[0.2em]">Automatic Settlement</h4>
                      <p className="text-[11px] text-emerald-700 dark:text-emerald-500/70 font-medium tracking-wide">Automatically process professional invoices on due dates</p>
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
                    <div className="w-14 h-7 bg-muted/50 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:rounded-full after:h-[20px] after:w-[20px] after:transition-all peer-checked:bg-emerald-600 shadow-lg"></div>
                  </label>
                </div>
              </div>

              <div className="mt-10 flex justify-end">
                <button
                  onClick={updateBillingSettings}
                  disabled={loading}
                  className="bg-indigo-600 text-white px-10 py-4 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] shadow-xl shadow-indigo-500/30 hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-50"
                >
                  {loading ? 'Synchronizing...' : 'Save Administrative Changes'}
                </button>
              </div>
            </div>
          )}

          {/* Preferences Tab */}
          {activeTab === 'preferences' && (
            <div className="space-y-10">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-indigo-500/10 rounded-2xl">
                  <Globe className="h-6 w-6 text-indigo-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-foreground tracking-tighter">General Preferences</h2>
                  <p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest mt-1">Configure your clinical environment and accessibility settings</p>
                </div>
              </div>

              <div className="bg-card/40 backdrop-blur-3xl border border-border rounded-[2.5rem] p-10 shadow-xl">
                <div className="flex items-center gap-3 mb-8">
                  <div className="p-2 bg-indigo-500/10 rounded-xl">
                    <Globe className="h-4 w-4 text-indigo-600" />
                  </div>
                  <h3 className="text-sm font-black text-foreground uppercase tracking-[0.2em]">Localization & Time</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <label className="block text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Interface Language</label>
                    <select className="w-full px-6 py-4 bg-muted/40 border border-border rounded-2xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-foreground font-medium appearance-none">
                      <option>English (United States)</option>
                      <option>Spanish (Castilian)</option>
                      <option>French (Standard)</option>
                      <option>German (Standard)</option>
                    </select>
                  </div>
                  <div className="space-y-3">
                    <label className="block text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Clinical Timezone</label>
                    <select className="w-full px-6 py-4 bg-muted/40 border border-border rounded-2xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-foreground font-medium appearance-none">
                      <option>UTC-5 (Eastern Time)</option>
                      <option>UTC-8 (Pacific Time)</option>
                      <option>UTC+0 (GMT)</option>
                      <option>UTC+1 (Central European Time)</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="bg-card/40 backdrop-blur-3xl border border-border rounded-[2.5rem] p-10 shadow-xl">
                <div className="flex items-center gap-3 mb-8">
                  <div className="p-2 bg-indigo-500/10 rounded-xl">
                    <Shield className="h-4 w-4 text-indigo-600" />
                  </div>
                  <h3 className="text-sm font-black text-foreground uppercase tracking-[0.2em]">Accessibility & Display</h3>
                </div>
                <div className="space-y-6">
                  {[
                    { label: 'High Contrast Mode', desc: 'Enhanced visibility for clinical data elements' },
                    { label: 'Screen Reader Optimization', desc: 'Optimized ARIA labels for assistive technology' },
                    { label: 'Reduced Motion', desc: 'Minimize animations during critical operations' }
                  ].map((pref) => (
                    <div key={pref.label} className="flex items-center justify-between py-4 border-b border-border last:border-0">
                      <div>
                        <h4 className="text-[11px] font-black text-foreground uppercase tracking-widest">{pref.label}</h4>
                        <p className="text-[10px] text-muted-foreground font-medium tracking-wide mt-1">{pref.desc}</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" />
                        <div className="w-14 h-7 bg-muted/50 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:rounded-full after:h-[20px] after:w-[20px] after:transition-all peer-checked:bg-indigo-600 shadow-sm"></div>
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
        <div className="fixed inset-0 flex items-center justify-center z-50 p-6">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setShowDeleteModal(false)}></div>
          <div className="bg-card border border-red-500/20 w-full max-w-lg rounded-[2.5rem] p-12 shadow-2xl relative z-10 overflow-hidden text-card-foreground">
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-red-500 to-orange-500"></div>
            <div className="flex items-center gap-4 mb-8">
              <div className="p-3 bg-red-500/10 rounded-2xl">
                <Trash2 className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-2xl font-black text-foreground tracking-tighter uppercase tracking-widest">Terminate Credentials</h3>
                <p className="text-[10px] text-red-600 font-black uppercase tracking-widest mt-1">High-Stakes Irreversible Operation</p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-red-500/5 border border-red-500/10 rounded-2xl p-6">
                <p className="text-sm text-red-900 dark:text-red-400 font-medium leading-relaxed">
                  Warning: Deleting your account will permanently remove all associated medical data, practice configurations, and platform access. This cannot be undone.
                </p>
              </div>

              <div className="space-y-3">
                <label className="block text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">
                  Type <span className="text-red-600 font-black">DELETE</span> to confirm
                </label>
                <input
                  type="text"
                  value={deleteConfirmation}
                  onChange={(e) => setDeleteConfirmation(e.target.value)}
                  className="w-full px-6 py-4 bg-muted/40 border border-border rounded-2xl focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all text-foreground font-black tracking-[0.2em] placeholder:text-muted-foreground/30"
                  placeholder="CONFIRMATION KEY"
                />
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setDeleteConfirmation('');
                  }}
                  className="flex-1 px-8 py-4 bg-muted text-foreground rounded-2xl hover:bg-muted/80 transition-all font-black text-[11px] uppercase tracking-[0.2em]"
                >
                  Abstain
                </button>
                <button
                  onClick={deleteAccount}
                  disabled={deleteConfirmation !== 'DELETE' || loading}
                  className="flex-1 px-8 py-4 bg-red-600 text-white rounded-2xl hover:bg-red-700 transition-all font-black text-[11px] uppercase tracking-[0.2em] shadow-xl shadow-red-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Terminating...' : 'Terminate Now'}
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
