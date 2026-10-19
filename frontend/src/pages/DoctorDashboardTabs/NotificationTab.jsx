import React, { useState, useEffect, useCallback, useMemo, memo } from "react";
import { Bell, Calendar, CreditCard, MessageCircle, Mail, Users, Settings, Check, X, Trash2, Filter, Search, Clock, AlertCircle, CheckCircle, Info, ChevronLeft, ChevronRight } from "lucide-react";
import { API_URLS } from '../../config/api';
import { authFetch } from '../../lib/authToken';
import { debounce } from "../../utils/performance";

const NotificationTab = memo(({ onCountChange }) => {
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

            const response = await authFetch(`${API_URLS.NOTIFICATIONS.LIST}?${params}`, {
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

            const response = await authFetch(API_URLS.NOTIFICATIONS.STATS, {
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
            const response = await authFetch(API_URLS.NOTIFICATIONS.MARK_READ(notificationId), {
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
            const response = await authFetch(API_URLS.NOTIFICATIONS.MARK_UNREAD(notificationId), {
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
            const response = await authFetch(API_URLS.NOTIFICATIONS.MARK_ALL_READ, {
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
            const response = await authFetch(API_URLS.NOTIFICATIONS.DELETE(notificationId), {
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
            const response = await authFetch(API_URLS.NOTIFICATIONS.DELETE_MULTIPLE, {
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

    const getNotificationStyle = (type) => {
        switch (type) {
            case 'appointment': return {
                icon: <Calendar className="h-5 w-5" />,
                bg: 'bg-blue-500/10',
                text: 'text-blue-600',
                border: 'border-blue-500/10'
            };
            case 'billing': return {
                icon: <CreditCard className="h-5 w-5" />,
                bg: 'bg-emerald-500/10',
                text: 'text-emerald-600',
                border: 'border-emerald-500/10'
            };
            case 'chat': return {
                icon: <MessageCircle className="h-5 w-5" />,
                bg: 'bg-purple-500/10',
                text: 'text-purple-600',
                border: 'border-purple-500/10'
            };
            case 'email': return {
                icon: <Mail className="h-5 w-5" />,
                bg: 'bg-orange-500/10',
                text: 'text-orange-600',
                border: 'border-orange-500/10'
            };
            case 'patients': return {
                icon: <Users className="h-5 w-5" />,
                bg: 'bg-indigo-500/10',
                text: 'text-indigo-600',
                border: 'border-indigo-500/10'
            };
            case 'system': return {
                icon: <Settings className="h-5 w-5" />,
                bg: 'bg-gray-500/10',
                text: 'text-gray-600',
                border: 'border-gray-500/10'
            };
            default: return {
                icon: <Bell className="h-5 w-5" />,
                bg: 'bg-indigo-500/10',
                text: 'text-indigo-600',
                border: 'border-indigo-500/10'
            };
        }
    };

    const getPriorityBadge = (priority) => {
        switch (priority) {
            case 'high': return (
                <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500/10 border border-red-500/20 text-red-600">
                    <AlertCircle className="h-2.5 w-2.5" />
                    <span className="text-[9px] font-bold">High priority</span>
                </div>
            );
            case 'medium': return (
                <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-600">
                    <Info className="h-2.5 w-2.5" />
                    <span className="text-[9px] font-bold">Medium</span>
                </div>
            );
            case 'low': return (
                <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600">
                    <CheckCircle className="h-2.5 w-2.5" />
                    <span className="text-[9px] font-bold">Low</span>
                </div>
            );
            default: return null;
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
                    <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                    <p className="text-[10px] font-semibold text-muted-foreground animate-pulse">Loading notifications...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-500/10 rounded-xl">
                    <Bell className="h-5 w-5 text-indigo-600" />
                </div>
                <div>
                    <div className="flex items-center gap-2">
                        <h1 className="text-xl font-bold text-foreground tracking-tight">Notifications</h1>
                        {unreadCount > 0 && (
                            <span className="px-2 py-0.5 bg-red-500 text-white text-[9px] font-bold rounded-full shadow-sm">
                                {unreadCount} new
                            </span>
                        )}
                    </div>
                    <p className="text-muted-foreground text-[10px] font-semibold mt-0.5">
                        Track clinical alerts, messages, and administrative updates
                    </p>
                </div>
            </div>

            {/* Controls */}
            <div className="bg-card border border-border rounded-xl p-4 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl -mr-16 -mt-16"></div>

                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between relative z-10">
                    {/* Search and Filter */}
                    <div className="flex flex-col sm:flex-row gap-3 flex-1 w-full">
                        <div className="relative group flex-1">
                            <Search className="h-3.5 w-3.5 absolute left-3.5 top-1/2 transform -translate-y-1/2 text-muted-foreground group-focus-within:text-indigo-600 transition-colors" />
                            <input
                                type="text"
                                placeholder="Search all notifications..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-3 py-2 bg-muted/40 border border-border rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-xs font-medium text-foreground placeholder:text-muted-foreground/60"
                            />
                        </div>

                        <div className="relative group w-full sm:w-48">
                            <Filter className="h-3.5 w-3.5 absolute left-3.5 top-1/2 transform -translate-y-1/2 text-muted-foreground group-focus-within:text-indigo-600 transition-colors" />
                            <select
                                value={filter}
                                onChange={(e) => setFilter(e.target.value)}
                                className="w-full pl-10 pr-8 py-2 bg-muted/40 border border-border rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-xs font-bold text-foreground appearance-none cursor-pointer"
                            >
                                <option value="all">All channels</option>
                                <option value="appointment">Appointments</option>
                                <option value="billing">Billing & finance</option>
                                <option value="chat">Messages</option>
                                <option value="patients">Clinical updates</option>
                                <option value="system">System alerts</option>
                            </select>
                            <div className="absolute right-3.5 top-1/2 transform -translate-y-1/2 pointer-events-none">
                                <div className="w-0 h-0 border-l-[3px] border-l-transparent border-r-[3px] border-r-transparent border-t-[3px] border-t-muted-foreground"></div>
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <button
                            onClick={markAllAsRead}
                            disabled={unreadCount === 0}
                            className="flex-1 sm:flex-none px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-bold text-xs shadow-sm active:scale-95 flex items-center justify-center gap-2"
                        >
                            <Check className="h-3.5 w-3.5" />
                            Mark read
                        </button>
                        <button
                            onClick={deleteSelected}
                            disabled={selectedNotifications.length === 0}
                            className={`flex-1 sm:flex-none px-4 py-2 rounded-lg transition-all font-bold text-xs flex items-center justify-center gap-2 ${selectedNotifications.length > 0
                                    ? 'bg-red-600 text-white shadow-sm hover:bg-red-700 active:scale-95'
                                    : 'bg-muted text-muted-foreground cursor-not-allowed border border-border'
                                }`}
                        >
                            <Trash2 className="h-3.5 w-3.5" />
                            Delete ({selectedNotifications.length})
                        </button>
                    </div>
                </div>
            </div>

            {/* Notifications List */}
            <div className="space-y-4">
                {filteredNotifications.length === 0 ? (
                    <div className="bg-card border border-border rounded-xl p-12 text-center shadow-sm">
                        <div className="bg-muted/30 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Bell className="h-8 w-8 text-muted-foreground/40" />
                        </div>
                        <h3 className="text-base font-bold text-foreground tracking-tight mb-1">No active notifications</h3>
                        <p className="text-muted-foreground font-medium text-xs">
                            {filter === 'all'
                                ? "You're all caught up! No new alerts effectively."
                                : `No notifications found in the ${filter} channel.`
                            }
                        </p>
                    </div>
                ) : (
                    <div className="grid gap-3">
                        {filteredNotifications.map((notification) => {
                            const style = getNotificationStyle(notification.type);

                            return (
                                <div
                                    key={notification.id}
                                    className={`relative group p-4 rounded-xl border transition-all duration-300 hover:scale-[1.005] hover:shadow-md ${!notification.read
                                            ? 'bg-card border-l-4 border-l-indigo-500 border-y-border border-r-border shadow-sm'
                                            : 'bg-card/60 border-border hover:bg-card/80 opacity-80 hover:opacity-100'
                                        }`}
                                >
                                    <div className="flex items-start gap-4">
                                        <div className="flex items-center h-full pt-1">
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
                                                className="w-3.5 h-3.5 rounded border-border text-indigo-600 focus:ring-indigo-500/20 bg-muted/40 cursor-pointer"
                                            />
                                        </div>

                                        <div className={`p-2.5 rounded-xl ${style.bg} ${style.text} transition-colors`}>
                                            {style.icon}
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 mb-1.5">
                                                <div className="space-y-0.5">
                                                    <div className="flex items-center gap-2.5 flex-wrap">
                                                        <h4 className={`text-[13px] font-bold tracking-tight ${!notification.read ? 'text-foreground' : 'text-muted-foreground'}`}>
                                                            {notification.title}
                                                        </h4>
                                                        {getPriorityBadge(notification.priority)}
                                                        {!notification.read && (
                                                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-pulse"></span>
                                                        )}
                                                    </div>
                                                </div>
                                                <span className="text-[9px] font-bold text-muted-foreground flex items-center gap-1 bg-muted/30 px-2 py-0.5 rounded-md border border-border/50 whitespace-nowrap">
                                                    <Clock className="h-3 w-3" />
                                                    {formatTimestamp(notification.created_at)}
                                                </span>
                                            </div>

                                            <p className={`text-xs leading-relaxed mb-3 ${!notification.read ? 'text-foreground/80 font-medium' : 'text-muted-foreground'}`}>
                                                {notification.message}
                                            </p>

                                            <div className="flex items-center justify-between border-t border-border/50 pt-2.5">
                                                <div className="flex items-center gap-2">
                                                    {notification.actionable && (
                                                        <span className="px-2 py-0.5 bg-indigo-500/5 text-indigo-600 border border-indigo-500/10 rounded-md text-[8px] font-bold tracking-tight flex items-center gap-1">
                                                            Action required
                                                        </span>
                                                    )}
                                                </div>

                                                <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            notification.read ? markAsUnread(notification.id) : markAsRead(notification.id);
                                                        }}
                                                        className="p-1.5 hover:bg-muted rounded-lg transition-all text-muted-foreground hover:text-foreground active:scale-95"
                                                        title={notification.read ? 'Mark as unread' : 'Mark as read'}
                                                    >
                                                        {notification.read ?
                                                            <Mail className="h-3.5 w-3.5" /> :
                                                            <Check className="h-3.5 w-3.5" />
                                                        }
                                                    </button>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            deleteNotification(notification.id);
                                                        }}
                                                        className="p-1.5 hover:bg-red-500/10 rounded-lg transition-all text-muted-foreground hover:text-red-600 active:scale-95"
                                                        title="Delete"
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
                <div className="bg-card border border-border rounded-xl p-3 flex items-center justify-between shadow-sm">
                    <button
                        onClick={() => loadNotifications(pagination.currentPage - 1)}
                        disabled={!pagination.hasPrev}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-bold text-muted-foreground hover:text-foreground hover:bg-muted/50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                    >
                        <ChevronLeft className="h-3.5 w-3.5" />
                        Previous
                    </button>

                    <span className="text-[10px] font-bold text-muted-foreground bg-muted/30 px-3 py-1.5 rounded-md border border-border">
                        Page <span className="text-foreground">{pagination.currentPage}</span> of {pagination.totalPages}
                    </span>

                    <button
                        onClick={() => loadNotifications(pagination.currentPage + 1)}
                        disabled={!pagination.hasNext}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-bold text-muted-foreground hover:text-foreground hover:bg-muted/50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                    >
                        Next
                        <ChevronRight className="h-3.5 w-3.5" />
                    </button>
                </div>
            )}
        </div>
    );
});

export default NotificationTab;
