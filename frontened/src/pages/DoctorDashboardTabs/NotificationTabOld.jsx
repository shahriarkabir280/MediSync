import React, { useState, useEffect } from "react";
import { Bell, Calendar, CreditCard, MessageCircle, Mail, Users, Settings, Check, X, Trash2, Filter, Search, Clock, AlertCircle, CheckCircle, Info } from "lucide-react";
import { useAuth } from '../../contexts/AuthContext';
import { API_URLS } from '../../config/api';

const NotificationTab = () => {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');  
    const [selectedNotifications, setSelectedNotifications] = useState([]);
    const [showSettings, setShowSettings] = useState(false);
    const [stats, setStats] = useState({
        total: 0,
        unread: 0,
        read: 0,
        high_priority: 0,
        medium_priority: 0,
        low_priority: 0
    });
    const [pagination, setPagination] = useState({
        currentPage: 1,
        totalPages: 1,
        total: 0,
        limit: 20
    });
    const [notificationSettings, setNotificationSettings] = useState({
        appointments: { email: true, push: true, sms: false },
        billing: { email: true, push: true, sms: true },
        chat: { email: false, push: true, sms: false },
        email: { email: true, push: false, sms: false },
        patients: { email: true, push: true, sms: false },
        system: { email: true, push: true, sms: false }
    });

    // Sample notification data - replace with API call
    const sampleNotifications = [
        {
            id: 1,
            type: 'appointment',
            title: 'New Appointment Scheduled',
            message: 'John Doe has scheduled an appointment for tomorrow at 2:00 PM',
            timestamp: new Date(Date.now() - 5 * 60 * 1000),
            read: false,
            priority: 'high',
            actionable: true,
            data: { patientName: 'John Doe', appointmentTime: '2:00 PM' }
        },
        {
            id: 2,
            type: 'billing',
            title: 'Payment Received',
            message: 'Payment of $150 received from Sarah Johnson for consultation',
            timestamp: new Date(Date.now() - 30 * 60 * 1000),
            read: false,
            priority: 'medium',
            actionable: false,
            data: { amount: 150, patientName: 'Sarah Johnson' }
        },
        {
            id: 3,
            type: 'chat',
            title: 'New Message',
            message: 'You have a new message from Dr. Smith regarding patient consultation',
            timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
            read: true,
            priority: 'medium',
            actionable: true,
            data: { senderName: 'Dr. Smith' }
        },
        {
            id: 4,
            type: 'email',
            title: 'New Email',
            message: 'Important: Lab results for patient Michael Brown are ready',
            timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
            read: false,
            priority: 'high',
            actionable: true,
            data: { subject: 'Lab Results Ready', from: 'lab@hospital.com' }
        },
        {
            id: 5,
            type: 'patients',
            title: 'Patient Registration',
            message: 'New patient Emma Wilson has registered and completed medical history',
            timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
            read: true,
            priority: 'low',
            actionable: true,
            data: { patientName: 'Emma Wilson' }
        },
        {
            id: 6,
            type: 'system',
            title: 'System Update',
            message: 'CareConnect will be undergoing maintenance tonight from 2:00 AM to 4:00 AM',
            timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
            read: true,
            priority: 'low',
            actionable: false,
            data: { maintenanceTime: '2:00 AM to 4:00 AM' }
        },
        {
            id: 7,
            type: 'billing',
            title: 'Invoice Overdue',
            message: 'Invoice #INV-2024-001 for Robert Davis is 7 days overdue',
            timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
            read: false,
            priority: 'high',
            actionable: true,
            data: { invoiceId: 'INV-2024-001', patientName: 'Robert Davis', daysOverdue: 7 }
        }
    ];

    useEffect(() => {
        // Simulate API call
        setTimeout(() => {
            setNotifications(sampleNotifications);
            setLoading(false);
        }, 1000);
    }, []);

    // Mark notification as read
    const markAsRead = async (notificationId) => {
        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch(API_URLS.NOTIFICATIONS.MARK_READ(notificationId), {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                // Update local state
                setNotifications(prev => 
                    prev.map(notif => 
                        notif.id === notificationId 
                            ? { ...notif, read: true, read_at: new Date().toISOString() }
                            : notif
                    )
                );
                
                // Update stats
                setStats(prev => ({
                    ...prev,
                    unread: Math.max(0, prev.unread - 1),
                    read: prev.read + 1
                }));
            }
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    };

    // Mark notification as unread
    const markAsUnread = async (notificationId) => {
        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch(API_URLS.NOTIFICATIONS.MARK_UNREAD(notificationId), {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                // Update local state
                setNotifications(prev => 
                    prev.map(notif => 
                        notif.id === notificationId 
                            ? { ...notif, read: false, read_at: null }
                            : notif
                    )
                );
                
                // Update stats
                setStats(prev => ({
                    ...prev,
                    unread: prev.unread + 1,
                    read: Math.max(0, prev.read - 1)
                }));
            }
        } catch (error) {
            console.error('Error marking notification as unread:', error);
        }
    };

    // Mark all as read
    const markAllAsRead = async () => {
        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch(API_URLS.NOTIFICATIONS.MARK_ALL_READ, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                // Reload notifications to get updated state
                await loadNotifications();
                await loadStats();
            }
        } catch (error) {
            console.error('Error marking all notifications as read:', error);
        }
    };

    // Delete notification
    const deleteNotification = async (notificationId) => {
        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch(API_URLS.NOTIFICATIONS.DELETE(notificationId), {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                // Remove from local state
                setNotifications(prev => prev.filter(notif => notif.id !== notificationId));
                
                // Update stats
                const deletedNotif = notifications.find(n => n.id === notificationId);
                if (deletedNotif) {
                    setStats(prev => ({
                        ...prev,
                        total: Math.max(0, prev.total - 1),
                        unread: deletedNotif.read ? prev.unread : Math.max(0, prev.unread - 1),
                        read: deletedNotif.read ? Math.max(0, prev.read - 1) : prev.read
                    }));
                }
            }
        } catch (error) {
            console.error('Error deleting notification:', error);
        }
    };

    // Delete selected notifications
    const deleteSelected = async () => {
        if (selectedNotifications.length === 0) return;
        
        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch(API_URLS.NOTIFICATIONS.DELETE_MULTIPLE, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ notificationIds: selectedNotifications })
            });

            if (response.ok) {
                // Remove from local state
                setNotifications(prev => 
                    prev.filter(notif => !selectedNotifications.includes(notif.id))
                );
                
                // Clear selection
                setSelectedNotifications([]);
                
                // Reload stats
                await loadStats();
            }
        } catch (error) {
            console.error('Error deleting selected notifications:', error);
        }
    };
        const iconProps = { className: "h-5 w-5" };
        switch (type) {
            case 'appointment': return <Calendar {...iconProps} className="h-5 w-5 text-blue-600" />;
            case 'billing': return <CreditCard {...iconProps} className="h-5 w-5 text-green-600" />;
            case 'chat': return <MessageCircle {...iconProps} className="h-5 w-5 text-purple-600" />;
            case 'email': return <Mail {...iconProps} className="h-5 w-5 text-red-600" />;
            case 'patients': return <Users {...iconProps} className="h-5 w-5 text-orange-600" />;
            case 'system': return <Settings {...iconProps} className="h-5 w-5 text-gray-600" />;
            default: return <Bell {...iconProps} className="h-5 w-5 text-gray-600" />;
        }
    };

    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'high': return 'bg-red-100 border-red-200';
            case 'medium': return 'bg-yellow-100 border-yellow-200';
            case 'low': return 'bg-gray-100 border-gray-200';
            default: return 'bg-gray-100 border-gray-200';
        }
    };

    const formatTimestamp = (timestamp) => {
        const now = new Date();
        const diff = now - timestamp;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        return `${days}d ago`;
    };

    const markAsRead = (notificationId) => {
        setNotifications(notifications.map(n => 
            n.id === notificationId ? { ...n, read: true } : n
        ));
    };

    const markAllAsRead = () => {
        setNotifications(notifications.map(n => ({ ...n, read: true })));
    };

    const deleteNotification = (notificationId) => {
        setNotifications(notifications.filter(n => n.id !== notificationId));
        setSelectedNotifications(selectedNotifications.filter(id => id !== notificationId));
    };

    const deleteSelected = () => {
        setNotifications(notifications.filter(n => !selectedNotifications.includes(n.id)));
        setSelectedNotifications([]);
    };

    const toggleSelectNotification = (notificationId) => {
        setSelectedNotifications(prev => 
            prev.includes(notificationId) 
                ? prev.filter(id => id !== notificationId)
                : [...prev, notificationId]
        );
    };

    const selectAll = () => {
        setSelectedNotifications(filteredNotifications.map(n => n.id));
    };

    const filteredNotifications = notifications.filter(notification => {
        const matchesFilter = filter === 'all' || 
            (filter === 'unread' && !notification.read) ||
            (filter === 'read' && notification.read) ||
            notification.type === filter;
        
        const matchesSearch = searchQuery === '' || 
            notification.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            notification.message.toLowerCase().includes(searchQuery.toLowerCase());

        return matchesFilter && matchesSearch;
    });

    const unreadCount = notifications.filter(n => !n.read).length;
    const filterOptions = [
        { value: 'all', label: 'All', count: notifications.length },
        { value: 'unread', label: 'Unread', count: unreadCount },
        { value: 'read', label: 'Read', count: notifications.length - unreadCount },
        { value: 'appointment', label: 'Appointments', count: notifications.filter(n => n.type === 'appointment').length },
        { value: 'billing', label: 'Billing', count: notifications.filter(n => n.type === 'billing').length },
        { value: 'chat', label: 'Messages', count: notifications.filter(n => n.type === 'chat').length },
        { value: 'email', label: 'Emails', count: notifications.filter(n => n.type === 'email').length },
        { value: 'patients', label: 'Patients', count: notifications.filter(n => n.type === 'patients').length },
        { value: 'system', label: 'System', count: notifications.filter(n => n.type === 'system').length }
    ];

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Loading notifications...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-foreground mb-2">Notifications</h1>
                <p className="text-muted-foreground">
                    Stay updated with appointments, messages, billing, and more.
                    {unreadCount > 0 && (
                        <span className="ml-2 px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">
                            {unreadCount} unread
                        </span>
                    )}
                </p>
            </div>

            {/* Controls */}
            <div className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                    {/* Search and Filter */}
                    <div className="flex flex-col sm:flex-row gap-2 flex-1">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                            <input
                                type="text"
                                placeholder="Search notifications..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                        <select
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            {filterOptions.map(option => (
                                <option key={option.value} value={option.value}>
                                    {option.label} ({option.count})
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                        {selectedNotifications.length > 0 && (
                            <button
                                onClick={deleteSelected}
                                className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-1"
                            >
                                <Trash2 className="h-4 w-4" />
                                Delete ({selectedNotifications.length})
                            </button>
                        )}
                        {unreadCount > 0 && (
                            <button
                                onClick={markAllAsRead}
                                className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-1"
                            >
                                <Check className="h-4 w-4" />
                                Mark All Read
                            </button>
                        )}
                        <button
                            onClick={() => setShowSettings(!showSettings)}
                            className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-1"
                        >
                            <Settings className="h-4 w-4" />
                            Settings
                        </button>
                    </div>
                </div>

                {/* Bulk Actions */}
                {filteredNotifications.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                            <label className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={selectedNotifications.length === filteredNotifications.length}
                                    onChange={() => {
                                        if (selectedNotifications.length === filteredNotifications.length) {
                                            setSelectedNotifications([]);
                                        } else {
                                            selectAll();
                                        }
                                    }}
                                    className="rounded border-gray-300"
                                />
                                Select all {filteredNotifications.length} notifications
                            </label>
                        </div>
                    </div>
                )}
            </div>

            {/* Notification Settings */}
            {showSettings && (
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold mb-4">Notification Preferences</h3>
                    <div className="space-y-4">
                        {Object.entries(notificationSettings).map(([category, settings]) => (
                            <div key={category} className="border border-gray-200 rounded-lg p-4">
                                <h4 className="font-medium mb-3 capitalize flex items-center gap-2">
                                    {getNotificationIcon(category)}
                                    {category === 'patients' ? 'Patient Updates' : category}
                                </h4>
                                <div className="grid grid-cols-3 gap-4">
                                    {Object.entries(settings).map(([method, enabled]) => (
                                        <label key={method} className="flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                checked={enabled}
                                                onChange={(e) => {
                                                    setNotificationSettings({
                                                        ...notificationSettings,
                                                        [category]: {
                                                            ...notificationSettings[category],
                                                            [method]: e.target.checked
                                                        }
                                                    });
                                                }}
                                                className="rounded border-gray-300"
                                            />
                                            <span className="text-sm capitalize">{method}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Notifications List */}
            <div className="space-y-2">
                {filteredNotifications.length === 0 ? (
                    <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
                        <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No notifications found</h3>
                        <p className="text-gray-600">
                            {searchQuery ? 'Try adjusting your search terms or filters.' : 'You\'re all caught up!'}
                        </p>
                    </div>
                ) : (
                    filteredNotifications.map((notification) => (
                        <div
                            key={notification.id}
                            className={`bg-white border rounded-lg p-4 hover:shadow-md transition-shadow ${
                                !notification.read ? 'border-l-4 border-l-blue-500 bg-blue-50' : 'border-gray-200'
                            } ${getPriorityColor(notification.priority)}`}
                        >
                            <div className="flex items-start gap-3">
                                <input
                                    type="checkbox"
                                    checked={selectedNotifications.includes(notification.id)}
                                    onChange={() => toggleSelectNotification(notification.id)}
                                    className="mt-1 rounded border-gray-300"
                                />
                                <div className="flex-shrink-0 mt-1">
                                    {getNotificationIcon(notification.type)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <h4 className={`text-sm font-medium ${!notification.read ? 'text-gray-900' : 'text-gray-700'}`}>
                                                {notification.title}
                                                {!notification.read && (
                                                    <span className="ml-2 w-2 h-2 bg-blue-600 rounded-full inline-block"></span>
                                                )}
                                            </h4>
                                            <p className={`text-sm mt-1 ${!notification.read ? 'text-gray-700' : 'text-gray-600'}`}>
                                                {notification.message}
                                            </p>
                                            <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                                                <span className="flex items-center gap-1">
                                                    <Clock className="h-3 w-3" />
                                                    {formatTimestamp(notification.timestamp)}
                                                </span>
                                                {notification.priority === 'high' && (
                                                    <span className="flex items-center gap-1 text-red-600">
                                                        <AlertCircle className="h-3 w-3" />
                                                        High Priority
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 ml-4">
                                            {notification.actionable && (
                                                <button
                                                    onClick={() => {/* Handle action */}}
                                                    className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                                                >
                                                    View
                                                </button>
                                            )}
                                            {!notification.read && (
                                                <button
                                                    onClick={() => markAsRead(notification.id)}
                                                    className="px-3 py-1 text-xs border border-gray-300 rounded hover:bg-gray-50"
                                                    title="Mark as read"
                                                >
                                                    <Check className="h-3 w-3" />
                                                </button>
                                            )}
                                            <button
                                                onClick={() => deleteNotification(notification.id)}
                                                className="px-3 py-1 text-xs text-red-600 border border-red-300 rounded hover:bg-red-50"
                                                title="Delete notification"
                                            >
                                                <Trash2 className="h-3 w-3" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default NotificationTab;