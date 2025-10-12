// src/hooks/useNotifications.js
import { useEffect, useMemo, useState, useCallback } from 'react';
import { toast } from 'react-toastify';
import { useUser } from '../context/useUser';
import { SERVER_BASE_URL } from '../utils/product';

const getAuthToken = () => localStorage.getItem('token') || sessionStorage.getItem('token');

export default function useNotifications() {
  const { isAuthenticated } = useUser();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);

  const refetch = useCallback(async () => {
    const token = getAuthToken();
    if (!isAuthenticated || !token) return;
    
    setLoading(true);
    try {
      const res = await fetch(`${SERVER_BASE_URL}/api/notifications/my`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to fetch notifications');
      
      console.log('Fetched notifications:', data.notifications); // Debug log
      setNotifications(Array.isArray(data.notifications) ? data.notifications : []);
    } catch (err) {
      console.error('Notifications error:', err);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    refetch();
    
    // Poll for new notifications every 30 seconds
    const interval = setInterval(refetch, 30000);
    return () => clearInterval(interval);
  }, [refetch]);

  const unreadCount = useMemo(() => notifications.filter(n => !n.read).length, [notifications]);

  const markAsRead = async (id) => {
    try {
      const token = getAuthToken();
      const res = await fetch(`${SERVER_BASE_URL}/api/notifications/${id}/read`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to mark as read');
      setNotifications(prev => prev.map(n => (n._id === id ? { ...n, read: true } : n)));
    } catch (err) {
      console.error('Mark as read error:', err);
      toast.error(err.message || 'Failed to update notification');
    }
  };

  const markAllAsRead = async () => {
    try {
      const token = getAuthToken();
      const res = await fetch(`${SERVER_BASE_URL}/api/notifications/read-all`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) throw new Error('Failed to mark all as read');
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (err) {
      console.error('Mark all as read error:', err);
      toast.error(err.message || 'Failed to update notifications');
    }
  };

  return { notifications, unreadCount, loading, refetch, markAsRead, markAllAsRead };
}
