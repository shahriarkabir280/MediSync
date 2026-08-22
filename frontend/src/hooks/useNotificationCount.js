import { useState, useEffect, useRef } from 'react';
import { API_URLS } from '../config/api';

export const useNotificationCount = () => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const intervalRef = useRef(null);

  const fetchUnreadCount = async () => {
    try {
      const token = localStorage.getItem('authToken');
      
      if (!token) {
        setUnreadCount(0);
        setLoading(false);
        return;
      }

      const response = await fetch(API_URLS.NOTIFICATIONS.STATS, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUnreadCount(data.data?.unread || 0);
        setError(null);
      } else if (response.status === 401) {
        // Token expired or invalid
        setUnreadCount(0);
        setError('Authentication required');
      } else {
        setError('Failed to fetch notification count');
        setUnreadCount(0);
      }
    } catch (err) {
      setError('Error fetching notification count');
      setUnreadCount(0);
      console.error('Error fetching notification count:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUnreadCount();
    
    // Set up polling interval
    intervalRef.current = setInterval(fetchUnreadCount, 30000);

    // Listen for visibility changes to refresh when tab becomes active
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchUnreadCount();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Method to manually refresh count (useful after marking notifications as read)
  const refreshCount = () => {
    fetchUnreadCount();
  };

  // Method to update count locally (for optimistic updates)
  const updateCount = (newCount) => {
    setUnreadCount(Math.max(0, newCount));
  };

  return {
    unreadCount,
    loading,
    error,
    refreshCount,
    updateCount
  };
};