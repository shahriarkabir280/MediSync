import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { API_URLS } from '../../config/api';
import { Bell, Shield, CreditCard, Settings, Calendar, MessageCircle, Mail, Users, AlertCircle } from 'lucide-react';

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

      // Load general settings
      try {
        const generalResponse = await fetch(API_URLS.DOCTORS.SETTINGS_AUTH, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (generalResponse.ok) {
          const generalData = await generalResponse.json();
          // Handle general settings if needed
        }
      } catch (generalError) {
        console.log('General settings not available yet:', generalError.message);
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
        body: JSON.stringify(notificationSettings)
      });

      if (response.ok) {
        showSuccessMessage('Notification settings updated successfully');
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
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Settings</h1>
        <p className="text-muted-foreground">Manage your account preferences and configurations.</p>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg">
          {success}
        </div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Tab Navigation */}
      <div className="bg-white border border-gray-200 rounded-lg">
        <div className="flex flex-wrap border-b border-gray-200">
          {tabs.map((tab) => {
            const IconComponent = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600 bg-blue-50'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                <IconComponent className="mr-2 h-4 w-4 inline" />
                {tab.name}
              </button>
            );
          })}
        </div>

        <div className="p-6">
          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Notification Settings</h2>
                <div className="flex items-center gap-2">
                  <Bell className="h-5 w-5 text-gray-400" />
                  <span className="text-sm text-gray-600">Manage how you receive notifications</span>
                </div>
              </div>
              
              {/* Global Controls */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <AlertCircle className="h-5 w-5 text-yellow-600" />
                    <div>
                      <h4 className="font-medium text-yellow-800">Global Notification Control</h4>
                      <p className="text-sm text-yellow-700">Temporarily mute all notifications</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notificationSettings.globalMute}
                      onChange={(e) => setNotificationSettings(prev => ({
                        ...prev, globalMute: e.target.checked
                      }))}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-yellow-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-yellow-600"></div>
                  </label>
                </div>
              </div>

              {/* Notification Categories */}
              <div className="grid gap-4">
                {/* Appointments */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <Calendar className="h-5 w-5 text-blue-600" />
                      <div>
                        <h4 className="font-medium">Appointments</h4>
                        <p className="text-sm text-gray-600">New appointments, changes, reminders</p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notificationSettings.appointments.enabled}
                        onChange={(e) => setNotificationSettings(prev => ({
                          ...prev, 
                          appointments: { ...prev.appointments, enabled: e.target.checked }
                        }))}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                  {notificationSettings.appointments.enabled && (
                    <div className="grid grid-cols-3 gap-4 ml-8">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={notificationSettings.appointments.email}
                          onChange={(e) => setNotificationSettings(prev => ({
                            ...prev,
                            appointments: { ...prev.appointments, email: e.target.checked }
                          }))}
                          className="rounded border-gray-300"
                        />
                        <span className="text-sm">Email</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={notificationSettings.appointments.push}
                          onChange={(e) => setNotificationSettings(prev => ({
                            ...prev,
                            appointments: { ...prev.appointments, push: e.target.checked }
                          }))}
                          className="rounded border-gray-300"
                        />
                        <span className="text-sm">Push</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={notificationSettings.appointments.sms}
                          onChange={(e) => setNotificationSettings(prev => ({
                            ...prev,
                            appointments: { ...prev.appointments, sms: e.target.checked }
                          }))}
                          className="rounded border-gray-300"
                        />
                        <span className="text-sm">SMS</span>
                      </label>
                    </div>
                  )}
                </div>

                {/* Billing */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <CreditCard className="h-5 w-5 text-green-600" />
                      <div>
                        <h4 className="font-medium">Billing & Payments</h4>
                        <p className="text-sm text-gray-600">Payment alerts, invoice updates</p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notificationSettings.billing.enabled}
                        onChange={(e) => setNotificationSettings(prev => ({
                          ...prev, 
                          billing: { ...prev.billing, enabled: e.target.checked }
                        }))}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                    </label>
                  </div>
                  {notificationSettings.billing.enabled && (
                    <div className="grid grid-cols-3 gap-4 ml-8">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={notificationSettings.billing.email}
                          onChange={(e) => setNotificationSettings(prev => ({
                            ...prev,
                            billing: { ...prev.billing, email: e.target.checked }
                          }))}
                          className="rounded border-gray-300"
                        />
                        <span className="text-sm">Email</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={notificationSettings.billing.push}
                          onChange={(e) => setNotificationSettings(prev => ({
                            ...prev,
                            billing: { ...prev.billing, push: e.target.checked }
                          }))}
                          className="rounded border-gray-300"
                        />
                        <span className="text-sm">Push</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={notificationSettings.billing.sms}
                          onChange={(e) => setNotificationSettings(prev => ({
                            ...prev,
                            billing: { ...prev.billing, sms: e.target.checked }
                          }))}
                          className="rounded border-gray-300"
                        />
                        <span className="text-sm">SMS</span>
                      </label>
                    </div>
                  )}
                </div>

                {/* Chat/Messages */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <MessageCircle className="h-5 w-5 text-purple-600" />
                      <div>
                        <h4 className="font-medium">Messages & Chat</h4>
                        <p className="text-sm text-gray-600">New messages from colleagues and patients</p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notificationSettings.chat.enabled}
                        onChange={(e) => setNotificationSettings(prev => ({
                          ...prev, 
                          chat: { ...prev.chat, enabled: e.target.checked }
                        }))}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                    </label>
                  </div>
                  {notificationSettings.chat.enabled && (
                    <div className="grid grid-cols-3 gap-4 ml-8">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={notificationSettings.chat.email}
                          onChange={(e) => setNotificationSettings(prev => ({
                            ...prev,
                            chat: { ...prev.chat, email: e.target.checked }
                          }))}
                          className="rounded border-gray-300"
                        />
                        <span className="text-sm">Email</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={notificationSettings.chat.push}
                          onChange={(e) => setNotificationSettings(prev => ({
                            ...prev,
                            chat: { ...prev.chat, push: e.target.checked }
                          }))}
                          className="rounded border-gray-300"
                        />
                        <span className="text-sm">Push</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={notificationSettings.chat.sms}
                          onChange={(e) => setNotificationSettings(prev => ({
                            ...prev,
                            chat: { ...prev.chat, sms: e.target.checked }
                          }))}
                          className="rounded border-gray-300"
                        />
                        <span className="text-sm">SMS</span>
                      </label>
                    </div>
                  )}
                </div>

                {/* Patients */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <Users className="h-5 w-5 text-orange-600" />
                      <div>
                        <h4 className="font-medium">Patient Updates</h4>
                        <p className="text-sm text-gray-600">New registrations, medical records</p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notificationSettings.patients.enabled}
                        onChange={(e) => setNotificationSettings(prev => ({
                          ...prev, 
                          patients: { ...prev.patients, enabled: e.target.checked }
                        }))}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-600"></div>
                    </label>
                  </div>
                  {notificationSettings.patients.enabled && (
                    <div className="grid grid-cols-3 gap-4 ml-8">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={notificationSettings.patients.email}
                          onChange={(e) => setNotificationSettings(prev => ({
                            ...prev,
                            patients: { ...prev.patients, email: e.target.checked }
                          }))}
                          className="rounded border-gray-300"
                        />
                        <span className="text-sm">Email</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={notificationSettings.patients.push}
                          onChange={(e) => setNotificationSettings(prev => ({
                            ...prev,
                            patients: { ...prev.patients, push: e.target.checked }
                          }))}
                          className="rounded border-gray-300"
                        />
                        <span className="text-sm">Push</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={notificationSettings.patients.sms}
                          onChange={(e) => setNotificationSettings(prev => ({
                            ...prev,
                            patients: { ...prev.patients, sms: e.target.checked }
                          }))}
                          className="rounded border-gray-300"
                        />
                        <span className="text-sm">SMS</span>
                      </label>
                    </div>
                  )}
                </div>

                {/* System Notifications */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <Settings className="h-5 w-5 text-gray-600" />
                      <div>
                        <h4 className="font-medium">System Notifications</h4>
                        <p className="text-sm text-gray-600">Maintenance, updates, announcements</p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notificationSettings.system.enabled}
                        onChange={(e) => setNotificationSettings(prev => ({
                          ...prev, 
                          system: { ...prev.system, enabled: e.target.checked }
                        }))}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-gray-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gray-600"></div>
                    </label>
                  </div>
                  {notificationSettings.system.enabled && (
                    <div className="grid grid-cols-3 gap-4 ml-8">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={notificationSettings.system.email}
                          onChange={(e) => setNotificationSettings(prev => ({
                            ...prev,
                            system: { ...prev.system, email: e.target.checked }
                          }))}
                          className="rounded border-gray-300"
                        />
                        <span className="text-sm">Email</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={notificationSettings.system.push}
                          onChange={(e) => setNotificationSettings(prev => ({
                            ...prev,
                            system: { ...prev.system, push: e.target.checked }
                          }))}
                          className="rounded border-gray-300"
                        />
                        <span className="text-sm">Push</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={notificationSettings.system.sms}
                          onChange={(e) => setNotificationSettings(prev => ({
                            ...prev,
                            system: { ...prev.system, sms: e.target.checked }
                          }))}
                          className="rounded border-gray-300"
                        />
                        <span className="text-sm">SMS</span>
                      </label>
                    </div>
                  )}
                </div>
              </div>

              {/* Notification Frequency */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium mb-3">Notification Frequency</h4>
                <div className="space-y-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="frequency"
                      value="immediate"
                      checked={notificationSettings.frequency === 'immediate'}
                      onChange={(e) => setNotificationSettings(prev => ({
                        ...prev, frequency: e.target.value
                      }))}
                      className="text-blue-600"
                    />
                    <span className="text-sm">Immediate - Get notifications as they happen</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="frequency"
                      value="hourly"
                      checked={notificationSettings.frequency === 'hourly'}
                      onChange={(e) => setNotificationSettings(prev => ({
                        ...prev, frequency: e.target.value
                      }))}
                      className="text-blue-600"
                    />
                    <span className="text-sm">Hourly digest - Bundled notifications every hour</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="frequency"
                      value="daily"
                      checked={notificationSettings.frequency === 'daily'}
                      onChange={(e) => setNotificationSettings(prev => ({
                        ...prev, frequency: e.target.value
                      }))}
                      className="text-blue-600"
                    />
                    <span className="text-sm">Daily summary - Once per day summary</span>
                  </label>
                </div>
              </div>

              {/* Quiet Hours */}
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="font-medium">Quiet Hours</h4>
                    <p className="text-sm text-gray-600">Limit notifications during specific hours</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notificationSettings.quietHours.enabled}
                      onChange={(e) => setNotificationSettings(prev => ({
                        ...prev, 
                        quietHours: { ...prev.quietHours, enabled: e.target.checked }
                      }))}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
                {notificationSettings.quietHours.enabled && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">From</label>
                      <input
                        type="time"
                        value={notificationSettings.quietHours.startTime}
                        onChange={(e) => setNotificationSettings(prev => ({
                          ...prev,
                          quietHours: { ...prev.quietHours, startTime: e.target.value }
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">To</label>
                      <input
                        type="time"
                        value={notificationSettings.quietHours.endTime}
                        onChange={(e) => setNotificationSettings(prev => ({
                          ...prev,
                          quietHours: { ...prev.quietHours, endTime: e.target.value }
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                )}
              </div>

              <button
                onClick={updateNotificationSettings}
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                {loading ? 'Updating...' : 'Save Notification Settings'}
              </button>
            </div>
          )}

          {/* Account Security Tab */}
          {activeTab === 'account' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold">Account Security</h2>
              
              {/* Password Change */}
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-lg font-medium mb-4">Change Password</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Current Password</label>
                    <input
                      type="password"
                      value={accountSettings.currentPassword}
                      onChange={(e) => setAccountSettings(prev => ({
                        ...prev, currentPassword: e.target.value
                      }))}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">New Password</label>
                    <input
                      type="password"
                      value={accountSettings.newPassword}
                      onChange={(e) => setAccountSettings(prev => ({
                        ...prev, newPassword: e.target.value
                      }))}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Confirm New Password</label>
                    <input
                      type="password"
                      value={accountSettings.confirmPassword}
                      onChange={(e) => setAccountSettings(prev => ({
                        ...prev, confirmPassword: e.target.value
                      }))}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <button
                    onClick={changePassword}
                    disabled={loading}
                    className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-medium transition-colors disabled:opacity-50"
                  >
                    {loading ? 'Changing...' : 'Change Password'}
                  </button>
                </div>
              </div>

              {/* Two-Factor Authentication */}
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-lg font-medium mb-4">Two-Factor Authentication</h3>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="font-medium">2FA Status</p>
                    <p className="text-sm text-gray-600">
                      {accountSettings.twoFactorEnabled ? 'Enabled - Your account is secure' : 'Disabled - Enable for better security'}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    accountSettings.twoFactorEnabled 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {accountSettings.twoFactorEnabled ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
                
                {accountSettings.twoFactorEnabled ? (
                  <div className="space-y-4">
                    {accountSettings.backupCodes.length > 0 && (
                      <div className="bg-yellow-50 p-4 rounded-lg">
                        <h4 className="font-medium text-yellow-800 mb-2">Backup Codes</h4>
                        <p className="text-sm text-yellow-700 mb-2">Save these codes in a safe place:</p>
                        <div className="grid grid-cols-2 gap-2 font-mono text-sm">
                          {accountSettings.backupCodes.map((code, index) => (
                            <code key={index} className="bg-white p-2 rounded border">{code}</code>
                          ))}
                        </div>
                      </div>
                    )}
                    <button
                      onClick={disableTwoFactor}
                      disabled={loading}
                      className="bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg font-medium transition-colors disabled:opacity-50"
                    >
                      {loading ? 'Disabling...' : 'Disable 2FA'}
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={enableTwoFactor}
                    disabled={loading}
                    className="bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg font-medium transition-colors disabled:opacity-50"
                  >
                    {loading ? 'Enabling...' : 'Enable 2FA'}
                  </button>
                )}
              </div>

              {/* Session Management */}
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-lg font-medium mb-4">Session Management</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Session Timeout (minutes)</label>
                    <select
                      value={accountSettings.sessionTimeout}
                      onChange={(e) => setAccountSettings(prev => ({
                        ...prev, sessionTimeout: e.target.value
                      }))}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="15">15 minutes</option>
                      <option value="30">30 minutes</option>
                      <option value="60">1 hour</option>
                      <option value="120">2 hours</option>
                      <option value="480">8 hours</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Danger Zone */}
              <div className="bg-red-50 border border-red-200 p-6 rounded-lg">
                <h3 className="text-lg font-medium text-red-800 mb-4">Danger Zone</h3>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-red-700">Delete Account</h4>
                    <p className="text-sm text-red-600 mb-3">
                      This will permanently delete your account and all associated data. This action cannot be undone.
                    </p>
                    <button
                      onClick={() => setShowDeleteModal(true)}
                      className="bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg font-medium transition-colors"
                    >
                      Delete Account
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Billing & Payment Tab */}
          {activeTab === 'billing' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold">Billing & Payment Settings</h2>
              
              {/* Billing Information */}
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-lg font-medium mb-4">Billing Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Invoice Email</label>
                    <input
                      type="email"
                      value={billingSettings.invoiceEmail}
                      onChange={(e) => setBillingSettings(prev => ({
                        ...prev, invoiceEmail: e.target.value
                      }))}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Tax ID</label>
                    <input
                      type="text"
                      value={billingSettings.taxId}
                      onChange={(e) => setBillingSettings(prev => ({
                        ...prev, taxId: e.target.value
                      }))}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter your tax ID"
                    />
                  </div>
                </div>
              </div>

              {/* Billing Address */}
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-lg font-medium mb-4">Billing Address</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Street Address</label>
                    <input
                      type="text"
                      value={billingSettings.billingAddress.street}
                      onChange={(e) => setBillingSettings(prev => ({
                        ...prev, billingAddress: { ...prev.billingAddress, street: e.target.value }
                      }))}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">City</label>
                      <input
                        type="text"
                        value={billingSettings.billingAddress.city}
                        onChange={(e) => setBillingSettings(prev => ({
                          ...prev, billingAddress: { ...prev.billingAddress, city: e.target.value }
                        }))}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">State</label>
                      <input
                        type="text"
                        value={billingSettings.billingAddress.state}
                        onChange={(e) => setBillingSettings(prev => ({
                          ...prev, billingAddress: { ...prev.billingAddress, state: e.target.value }
                        }))}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">ZIP Code</label>
                      <input
                        type="text"
                        value={billingSettings.billingAddress.zipCode}
                        onChange={(e) => setBillingSettings(prev => ({
                          ...prev, billingAddress: { ...prev.billingAddress, zipCode: e.target.value }
                        }))}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Methods */}
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-lg font-medium mb-4">Payment Methods</h3>
                <div className="space-y-4">
                  {billingSettings.paymentMethods.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <p className="mb-4">No payment methods added yet</p>
                      <button className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-medium transition-colors">
                        Add Payment Method
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {billingSettings.paymentMethods.map((method, index) => (
                        <div key={index} className="flex items-center justify-between bg-white p-4 rounded-lg border">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-6 bg-gray-200 rounded"></div>
                            <div>
                              <p className="font-medium">•••• •••• •••• {method.last4}</p>
                              <p className="text-sm text-gray-500">Expires {method.expiry}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            {method.isDefault && (
                              <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-medium">
                                Default
                              </span>
                            )}
                            <button className="text-red-600 hover:text-red-700">Remove</button>
                          </div>
                        </div>
                      ))}
                      <button className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 py-2 px-4 rounded-lg font-medium transition-colors">
                        Add Another Payment Method
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Auto-pay Settings */}
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-lg font-medium mb-4">Auto-pay Settings</h3>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Enable Auto-pay</p>
                    <p className="text-sm text-gray-600">Automatically pay invoices when due</p>
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
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>

              <button
                onClick={updateBillingSettings}
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                {loading ? 'Updating...' : 'Save Billing Settings'}
              </button>
            </div>
          )}

          {/* Preferences Tab */}
          {activeTab === 'preferences' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold">General Preferences</h2>
              
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-lg font-medium mb-4">Language & Region</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Language</label>
                    <select className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                      <option>English</option>
                      <option>Spanish</option>
                      <option>French</option>
                      <option>German</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Timezone</label>
                    <select className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                      <option>UTC-5 (Eastern Time)</option>
                      <option>UTC-8 (Pacific Time)</option>
                      <option>UTC+0 (GMT)</option>
                      <option>UTC+1 (Central European Time)</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-lg font-medium mb-4">Theme Settings</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Dark Mode</p>
                      <p className="text-sm text-gray-600">Toggle between light and dark themes</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-red-600 mb-4">Delete Account</h3>
            <p className="text-gray-600 mb-4">
              This action cannot be undone. All your data will be permanently deleted.
            </p>
            <p className="text-sm text-gray-500 mb-4">
              Type <strong>DELETE</strong> to confirm:
            </p>
            <input
              type="text"
              value={deleteConfirmation}
              onChange={(e) => setDeleteConfirmation(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg mb-4 focus:ring-2 focus:ring-red-500 focus:border-red-500"
              placeholder="Type DELETE"
            />
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteConfirmation('');
                }}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 py-2 px-4 rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={deleteAccount}
                disabled={loading || deleteConfirmation !== 'DELETE'}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                {loading ? 'Deleting...' : 'Delete Account'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default SettingsTab;