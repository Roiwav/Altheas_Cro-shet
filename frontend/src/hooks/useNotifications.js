// src/hooks/useNotifications.js
import { useEffect, useMemo, useState, useCallback } from 'react';
import io from 'socket.io-client';
import { toast } from 'react-toastify';
import { useUser } from '../context/useUser';
import { SERVER_BASE_URL } from '../utils/product';

export default function useNotifications() {
  const { isAuthenticated } = useUser();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);

  const refetch = useCallback(async () => {
    const token = localStorage.getItem('token');
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
      setNotifications(Array.isArray(data.notifications) ? data.notifications : []);
    } catch (err) {
      console.error('Notifications error:', err);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  // Real-time: connect to Socket.IO and listen for new notifications
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!isAuthenticated || !token) return;
    const socket = io(SERVER_BASE_URL);

    socket.on('connect', () => {
      socket.emit('register', token);
    });
    // Swallow possible errors
    socket.on('register:error', () => {});
    socket.on('connect_error', () => {});
    socket.on('error', () => {});

    const handleNew = (notif) => {
      setNotifications((prev) => [notif, ...prev]);
    };
    socket.on('notification:new', handleNew);

    return () => {
      socket.off('notification:new', handleNew);
      socket.disconnect();
    };
  }, [isAuthenticated]);

  const unreadCount = useMemo(() => notifications.filter(n => !n.read).length, [notifications]);

  const markAsRead = async (id) => {
    try {
      const res = await fetch(`${SERVER_BASE_URL}/api/notifications/${id}/read`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
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
      const res = await fetch(`${SERVER_BASE_URL}/api/notifications/read-all`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
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
