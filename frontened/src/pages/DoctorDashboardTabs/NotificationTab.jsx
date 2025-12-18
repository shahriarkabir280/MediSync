import React, { useState, useEffect, useCallback, useMemo, memo } from "react";
import { Bell, Calendar, CreditCard, MessageCircle, Mail, Users, Settings, Check, X, Trash2, Filter, Search, Clock, AlertCircle, CheckCircle, Info } from "lucide-react";
import { useAuth } from '../../contexts/AuthContext';
import { API_URLS } from '../../config/api';
import { debounce } from "../../utils/performance";

const NotificationTab = memo(({ onCountChange }) => {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');  
    const [selectedNotifications, setSelectedNotifications] = useState([]);
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

    // Load notifications from API
    const loadNotifications = useCallback(async (page = 1, type = filter, search = searchQuery) => {
        try {
            setLoading(true);
            const token = localStorage.getItem('authToken');
            
            if (!token) {
                console.error('No auth token found');
                return;
            }

            // Build query parameters
            const params = new URLSearchParams({
                page: page.toString(),
                limit: '20'
            });
            
            if (type && type !== 'all') {
                params.append('type', type);
            }
            
            if (search) {
                params.append('search', search);
            }

            const response = await fetch(`${API_URLS.NOTIFICATIONS.LIST}?${params}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                setNotifications(data.data.notifications || []);
                setPagination(data.data.pagination || pagination);
                setStats(prev => ({ ...prev, unread: data.data.unreadCount || 0 }));
            } else {
                console.error('Failed to fetch notifications:', response.status);
                setNotifications([]);
            }
        } catch (error) {
            console.error('Error loading notifications:', error);
            setNotifications([]);
        } finally {
            setLoading(false);
        }
    }, [filter, searchQuery]);

    // Load notification statistics
    const loadStats = useCallback(async () => {
        try {
            const token = localStorage.getItem('authToken');
            
            if (!token) return;

            const response = await fetch(API_URLS.NOTIFICATIONS.STATS, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                setStats(data.data || stats);
            }
        } catch (error) {
            console.error('Error loading notification stats:', error);
        }
    }, []);

    // Debounced search
    const debouncedLoadNotifications = useMemo(
        () => debounce((page, type, search) => loadNotifications(page, type, search), 500),
        [loadNotifications]
    );

    useEffect(() => {
        if (searchQuery) {
            debouncedLoadNotifications(1, filter, searchQuery);
        } else {
            loadNotifications();
        }
        loadStats();
    }, []);

    useEffect(() => {
        loadNotifications(1, filter, searchQuery);
    }, [filter, searchQuery]);

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
                setNotifications(prev => 
                    prev.map(notif => 
                        notif.id === notificationId 
                            ? { ...notif, read: true, read_at: new Date().toISOString() }
                            : notif
                    )
                );
                
                setStats(prev => ({
                    ...prev,
                    unread: Math.max(0, prev.unread - 1),
                    read: prev.read + 1
                }));
                
                // Update count badge
                onCountChange && onCountChange();
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
                setNotifications(prev => 
                    prev.map(notif => 
                        notif.id === notificationId 
                            ? { ...notif, read: false, read_at: null }
                            : notif
                    )
                );
                
                setStats(prev => ({
                    ...prev,
                    unread: prev.unread + 1,
                    read: Math.max(0, prev.read - 1)
                }));
                
                // Update count badge
                onCountChange && onCountChange();
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
                await loadNotifications();
                await loadStats();
                
                // Update count badge
                onCountChange && onCountChange();
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
                setNotifications(prev => prev.filter(notif => notif.id !== notificationId));
                
                const deletedNotif = notifications.find(n => n.id === notificationId);
                if (deletedNotif) {
                    setStats(prev => ({
                        ...prev,
                        total: Math.max(0, prev.total - 1),
                        unread: deletedNotif.read ? prev.unread : Math.max(0, prev.unread - 1),
                        read: deletedNotif.read ? Math.max(0, prev.read - 1) : prev.read
                    }));
                    
                    // Update count badge
                    onCountChange && onCountChange();
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
                setNotifications(prev => 
                    prev.filter(notif => !selectedNotifications.includes(notif.id))
                );
                
                setSelectedNotifications([]);
                await loadStats();
                
                // Update count badge
                onCountChange && onCountChange();
            }
        } catch (error) {
            console.error('Error deleting selected notifications:', error);
        }
    };

    const getNotificationIcon = (type) => {
        const iconProps = { className: "h-5 w-5" };
        switch (type) {
            case 'appointment': return <Calendar {...iconProps} className="h-5 w-5 text-blue-600" />;
            case 'billing': return <CreditCard {...iconProps} className="h-5 w-5 text-green-600" />;
            case 'chat': return <MessageCircle {...iconProps} className="h-5 w-5 text-purple-600" />;
            case 'email': return <Mail {...iconProps} className="h-5 w-5 text-orange-600" />;
            case 'patients': return <Users {...iconProps} className="h-5 w-5 text-indigo-600" />;
            case 'system': return <Settings {...iconProps} className="h-5 w-5 text-gray-600" />;
            default: return <Bell {...iconProps} className="h-5 w-5 text-gray-600" />;
        }
    };

    const getPriorityIcon = (priority) => {
        switch (priority) {
            case 'high': return <AlertCircle className="h-4 w-4 text-red-600" />;
            case 'medium': return <Info className="h-4 w-4 text-yellow-600" />;
            case 'low': return <CheckCircle className="h-4 w-4 text-green-600" />;
            default: return <Info className="h-4 w-4 text-gray-600" />;
        }
    };

    const formatTimestamp = (timestamp) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diffInHours = Math.abs(now - date) / 36e5;

        if (diffInHours < 1) {
            const diffInMinutes = Math.floor(diffInHours * 60);
            return `${diffInMinutes} minute${diffInMinutes !== 1 ? 's' : ''} ago`;
        } else if (diffInHours < 24) {
            const hours = Math.floor(diffInHours);
            return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
        } else {
            const days = Math.floor(diffInHours / 24);
            return `${days} day${days !== 1 ? 's' : ''} ago`;
        }
    };

    const filteredNotifications = notifications.filter(notification => {
        const matchesType = filter === 'all' || notification.type === filter;
        const matchesSearch = !searchQuery || 
            notification.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            notification.message.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesType && matchesSearch;
    });

    const unreadCount = stats.unread || 0;

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
                    <div className="flex flex-col sm:flex-row gap-3 flex-1">
                        <div className="relative">
                            <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search notifications..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full sm:w-64"
                            />
                        </div>
                        
                        <div className="relative">
                            <Filter className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                            <select
                                value={filter}
                                onChange={(e) => setFilter(e.target.value)}
                                className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white w-full sm:w-48"
                            >
                                <option value="all">All Notifications</option>
                                <option value="appointment">Appointments</option>
                                <option value="billing">Billing</option>
                                <option value="chat">Messages</option>
                                <option value="patients">Patients</option>
                                <option value="system">System</option>
                            </select>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                        <button
                            onClick={markAllAsRead}
                            disabled={unreadCount === 0}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <Check className="h-4 w-4 mr-2 inline" />
                            Mark All Read
                        </button>
                        <button
                            onClick={deleteSelected}
                            disabled={selectedNotifications.length === 0}
                            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <Trash2 className="h-4 w-4 mr-2 inline" />
                            Delete Selected ({selectedNotifications.length})
                        </button>
                    </div>
                </div>
            </div>

            {/* Notifications List */}
            <div className="bg-white border border-gray-200 rounded-lg">
                {filteredNotifications.length === 0 ? (
                    <div className="p-8 text-center">
                        <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No notifications</h3>
                        <p className="text-gray-600">
                            {filter === 'all' ? 
                                "You don't have any notifications yet." :
                                `No ${filter} notifications found.`
                            }
                        </p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-200">
                        {filteredNotifications.map((notification) => (
                            <div
                                key={notification.id}
                                className={`p-4 hover:bg-gray-50 transition-colors ${
                                    !notification.read ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                                }`}
                            >
                                <div className="flex items-start gap-4">
                                    {/* Checkbox */}
                                    <input
                                        type="checkbox"
                                        checked={selectedNotifications.includes(notification.id)}
                                        onChange={(e) => {
                                            if (e.target.checked) {
                                                setSelectedNotifications(prev => [...prev, notification.id]);
                                            } else {
                                                setSelectedNotifications(prev => prev.filter(id => id !== notification.id));
                                            }
                                        }}
                                        className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    />

                                    {/* Icon */}
                                    <div className="flex-shrink-0 mt-1">
                                        {getNotificationIcon(notification.type)}
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h4 className={`font-medium ${!notification.read ? 'text-gray-900' : 'text-gray-700'}`}>
                                                        {notification.title}
                                                    </h4>
                                                    <div className="flex items-center gap-1">
                                                        {getPriorityIcon(notification.priority)}
                                                        <span className="text-xs text-gray-500 capitalize">
                                                            {notification.priority}
                                                        </span>
                                                    </div>
                                                </div>
                                                
                                                <p className={`text-sm ${!notification.read ? 'text-gray-700' : 'text-gray-600'} mb-2`}>
                                                    {notification.message}
                                                </p>
                                                
                                                <div className="flex items-center gap-4 text-xs text-gray-500">
                                                    <span className="flex items-center">
                                                        <Clock className="h-3 w-3 mr-1" />
                                                        {formatTimestamp(notification.created_at)}
                                                    </span>
                                                    {notification.actionable && (
                                                        <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full">
                                                            Action Required
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Actions */}
                                            <div className="flex items-center gap-1 ml-4">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        notification.read ? markAsUnread(notification.id) : markAsRead(notification.id);
                                                    }}
                                                    className="p-1 hover:bg-gray-100 rounded transition-colors"
                                                    title={notification.read ? 'Mark as unread' : 'Mark as read'}
                                                >
                                                    {notification.read ? 
                                                        <X className="h-4 w-4 text-gray-600" /> : 
                                                        <Check className="h-4 w-4 text-green-600" />
                                                    }
                                                </button>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        deleteNotification(notification.id);
                                                    }}
                                                    className="p-1 hover:bg-gray-100 rounded transition-colors"
                                                    title="Delete notification"
                                                >
                                                    <Trash2 className="h-4 w-4 text-red-600" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-600">
                            Showing {Math.min(pagination.total, ((pagination.currentPage - 1) * pagination.limit) + filteredNotifications.length)} of {pagination.total} notifications
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => loadNotifications(pagination.currentPage - 1)}
                                disabled={!pagination.hasPrev}
                                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                Previous
                            </button>
                            <span className="px-4 py-2 text-sm text-gray-600">
                                Page {pagination.currentPage} of {pagination.totalPages}
                            </span>
                            <button
                                onClick={() => loadNotifications(pagination.currentPage + 1)}
                                disabled={!pagination.hasNext}
                                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
});

export default NotificationTab;