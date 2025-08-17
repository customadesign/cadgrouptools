import { useEffect, useState, useCallback, useRef } from 'react';
import { useSession } from 'next-auth/react';
import io, { Socket } from 'socket.io-client';

export interface Notification {
  id: string;
  type: 'user_registration' | 'statement_upload' | 'proposal_creation' | 'system' | 'info';
  title: string;
  message: string;
  data?: Record<string, any>;
  priority: 'low' | 'medium' | 'high';
  actionUrl?: string;
  createdAt: string;
  read?: boolean;
}

export interface UseNotificationsOptions {
  autoConnect?: boolean;
  reconnectionAttempts?: number;
  reconnectionDelay?: number;
}

export function useNotifications(options: UseNotificationsOptions = {}) {
  const { data: session } = useSession();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  const {
    autoConnect = true,
    reconnectionAttempts = 5,
    reconnectionDelay = 1000,
  } = options;

  // Initialize socket connection
  useEffect(() => {
    if (!session?.user || !autoConnect) return;

    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || '';
    
    const newSocket = io(socketUrl, {
      auth: {
        token: session.user.accessToken || '',
      },
      transports: ['websocket', 'polling'],
      reconnectionAttempts,
      reconnectionDelay,
    });

    socketRef.current = newSocket;

    // Connection event handlers
    newSocket.on('connect', () => {
      console.log('Connected to notification server');
      setIsConnected(true);
      
      // Request initial unread count
      newSocket.emit('notification:unread-count');
    });

    newSocket.on('disconnect', () => {
      console.log('Disconnected from notification server');
      setIsConnected(false);
    });

    newSocket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      setIsConnected(false);
    });

    // Notification event handlers
    newSocket.on('notification:new', (notification: Notification) => {
      console.log('New notification received:', notification);
      setNotifications(prev => [notification, ...prev]);
      
      // Show browser notification if permission granted
      if (Notification.permission === 'granted') {
        new Notification(notification.title, {
          body: notification.message,
          icon: '/icon-192x192.png',
          badge: '/badge-72x72.png',
          tag: notification.id,
          data: notification,
        });
      }
    });

    newSocket.on('notification:unread-count', (count: number) => {
      setUnreadCount(count);
    });

    newSocket.on('notification:read', (notificationId: string) => {
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      );
    });

    newSocket.on('notification:all-read', () => {
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    });

    newSocket.on('notification:deleted', (notificationId: string) => {
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
    });

    // Real-time event handlers for dashboard updates
    newSocket.on('event:user-registered', (data) => {
      console.log('User registered event:', data);
      // You can dispatch custom events or update global state here
      window.dispatchEvent(new CustomEvent('user-registered', { detail: data }));
    });

    newSocket.on('event:statement-uploaded', (data) => {
      console.log('Statement uploaded event:', data);
      window.dispatchEvent(new CustomEvent('statement-uploaded', { detail: data }));
    });

    newSocket.on('event:proposal-created', (data) => {
      console.log('Proposal created event:', data);
      window.dispatchEvent(new CustomEvent('proposal-created', { detail: data }));
    });

    setSocket(newSocket);

    // Cleanup on unmount
    return () => {
      newSocket.disconnect();
      socketRef.current = null;
    };
  }, [session, autoConnect, reconnectionAttempts, reconnectionDelay]);

  // Fetch notifications from API
  const fetchNotifications = useCallback(async (
    page: number = 1,
    limit: number = 20,
    unreadOnly: boolean = false
  ) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        unreadOnly: unreadOnly.toString(),
      });

      const response = await fetch(`/api/notifications?${params}`);
      if (!response.ok) throw new Error('Failed to fetch notifications');

      const data = await response.json();
      
      if (page === 1) {
        setNotifications(data.notifications);
      } else {
        setNotifications(prev => [...prev, ...data.notifications]);
      }

      return data;
    } catch (error) {
      console.error('Error fetching notifications:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      const response = await fetch('/api/notifications/read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId }),
      });

      if (!response.ok) throw new Error('Failed to mark as read');

      const data = await response.json();
      return data.success;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return false;
    }
  }, []);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    try {
      const response = await fetch('/api/notifications/read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAll: true }),
      });

      if (!response.ok) throw new Error('Failed to mark all as read');

      const data = await response.json();
      return data.success;
    } catch (error) {
      console.error('Error marking all as read:', error);
      return false;
    }
  }, []);

  // Delete notification
  const deleteNotification = useCallback(async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/delete?id=${notificationId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete notification');

      const data = await response.json();
      return data.success;
    } catch (error) {
      console.error('Error deleting notification:', error);
      return false;
    }
  }, []);

  // Request browser notification permission
  const requestPermission = useCallback(async () => {
    if (!('Notification' in window)) {
      console.warn('This browser does not support notifications');
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }

    return false;
  }, []);

  // Manually connect/disconnect socket
  const connect = useCallback(() => {
    if (socketRef.current && !socketRef.current.connected) {
      socketRef.current.connect();
    }
  }, []);

  const disconnect = useCallback(() => {
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.disconnect();
    }
  }, []);

  return {
    // State
    socket,
    isConnected,
    notifications,
    unreadCount,
    isLoading,
    
    // Methods
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    requestPermission,
    connect,
    disconnect,
  };
}