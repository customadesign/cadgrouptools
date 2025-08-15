// Client-side push notification service
export class ClientPushNotificationService {
  private registration: ServiceWorkerRegistration | null = null;
  private subscription: PushSubscription | null = null;

  // Check if push notifications are supported
  isSupported(): boolean {
    return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
  }

  // Initialize service worker
  async initializeServiceWorker(): Promise<ServiceWorkerRegistration | null> {
    if (!this.isSupported()) {
      console.log('Push notifications are not supported in this browser');
      return null;
    }

    try {
      // Register service worker
      this.registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });
      console.log('Service Worker registered:', this.registration);

      // Wait for service worker to be ready
      await navigator.serviceWorker.ready;
      console.log('Service Worker is ready');

      return this.registration;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      return null;
    }
  }

  // Check notification permission status
  getPermissionStatus(): NotificationPermission {
    return Notification.permission;
  }

  // Request notification permission
  async requestPermission(): Promise<NotificationPermission> {
    if (!this.isSupported()) {
      throw new Error('Push notifications are not supported');
    }

    const permission = await Notification.requestPermission();
    console.log('Notification permission:', permission);
    return permission;
  }

  // Get VAPID public key from server
  async getVapidPublicKey(): Promise<string> {
    const response = await fetch('/api/notifications/vapid-key');
    if (!response.ok) {
      throw new Error('Failed to get VAPID public key');
    }
    const data = await response.json();
    return data.publicKey;
  }

  // Subscribe to push notifications
  async subscribe(): Promise<PushSubscription> {
    if (!this.registration) {
      await this.initializeServiceWorker();
    }

    if (!this.registration) {
      throw new Error('Service Worker not registered');
    }

    // Check permission
    const permission = await this.requestPermission();
    if (permission !== 'granted') {
      throw new Error('Notification permission not granted');
    }

    try {
      // Get VAPID public key
      const vapidPublicKey = await this.getVapidPublicKey();
      const convertedVapidKey = this.urlBase64ToUint8Array(vapidPublicKey);

      // Subscribe to push notifications
      this.subscription = await this.registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedVapidKey
      });

      console.log('Push subscription:', this.subscription);

      // Send subscription to server
      const response = await fetch('/api/notifications/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscription: this.subscription.toJSON(),
          userAgent: navigator.userAgent
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save subscription on server');
      }

      const result = await response.json();
      console.log('Subscription saved:', result);

      return this.subscription;
    } catch (error) {
      console.error('Failed to subscribe to push notifications:', error);
      throw error;
    }
  }

  // Unsubscribe from push notifications
  async unsubscribe(): Promise<void> {
    if (!this.subscription) {
      // Try to get existing subscription
      if (this.registration) {
        this.subscription = await this.registration.pushManager.getSubscription();
      }
    }

    if (this.subscription) {
      try {
        // Unsubscribe from push manager
        await this.subscription.unsubscribe();
        console.log('Unsubscribed from push notifications');

        // Notify server
        const endpoint = this.subscription.endpoint;
        await fetch(`/api/notifications/subscribe?endpoint=${encodeURIComponent(endpoint)}`, {
          method: 'DELETE',
        });

        this.subscription = null;
      } catch (error) {
        console.error('Failed to unsubscribe from push notifications:', error);
        throw error;
      }
    }
  }

  // Check if user is subscribed
  async isSubscribed(): Promise<boolean> {
    if (!this.registration) {
      await this.initializeServiceWorker();
    }

    if (!this.registration) {
      return false;
    }

    this.subscription = await this.registration.pushManager.getSubscription();
    return this.subscription !== null;
  }

  // Get current subscription
  async getSubscription(): Promise<PushSubscription | null> {
    if (!this.registration) {
      await this.initializeServiceWorker();
    }

    if (!this.registration) {
      return null;
    }

    this.subscription = await this.registration.pushManager.getSubscription();
    return this.subscription;
  }

  // Show a local notification (for testing)
  async showLocalNotification(title: string, body: string, options?: NotificationOptions): Promise<void> {
    if (!this.registration) {
      await this.initializeServiceWorker();
    }

    if (!this.registration) {
      throw new Error('Service Worker not registered');
    }

    const permission = this.getPermissionStatus();
    if (permission !== 'granted') {
      throw new Error('Notification permission not granted');
    }

    await this.registration.showNotification(title, {
      body,
      icon: '/icon-192x192.png',
      badge: '/badge-72x72.png',
      vibrate: [200, 100, 200],
      timestamp: Date.now(),
      ...options
    });
  }

  // Convert VAPID key
  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
      .replace(/\-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  // Update service worker
  async updateServiceWorker(): Promise<void> {
    if (!this.registration) {
      return;
    }

    try {
      await this.registration.update();
      console.log('Service Worker updated');
    } catch (error) {
      console.error('Failed to update Service Worker:', error);
    }
  }

  // Get all active subscriptions for the user
  async getUserSubscriptions(): Promise<any[]> {
    try {
      const response = await fetch('/api/notifications/subscribe');
      if (!response.ok) {
        throw new Error('Failed to fetch subscriptions');
      }
      const data = await response.json();
      return data.subscriptions || [];
    } catch (error) {
      console.error('Failed to fetch user subscriptions:', error);
      return [];
    }
  }

  // Get notification history
  async getNotificationHistory(limit: number = 50): Promise<any[]> {
    try {
      const response = await fetch(`/api/notifications/history?limit=${limit}`);
      if (!response.ok) {
        throw new Error('Failed to fetch notification history');
      }
      const data = await response.json();
      return data.history || [];
    } catch (error) {
      console.error('Failed to fetch notification history:', error);
      return [];
    }
  }

  // Send custom notification (admin only)
  async sendCustomNotification(
    targetUsers: 'all' | 'admins' | string[],
    title: string,
    body: string,
    options?: {
      requireInteraction?: boolean;
      actions?: Array<{ action: string; title: string }>;
      data?: Record<string, any>;
    }
  ): Promise<{ success: boolean; successCount?: number; failureCount?: number }> {
    try {
      const response = await fetch('/api/notifications/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          targetUsers,
          title,
          body,
          ...options
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to send notification');
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Failed to send custom notification:', error);
      return { success: false };
    }
  }
}

// Export singleton instance
const clientPushNotificationService = new ClientPushNotificationService();
export default clientPushNotificationService;