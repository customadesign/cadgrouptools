// Service Worker for Push Notifications
// CADGroup Tools Portal

self.addEventListener('install', (event) => {
  console.log('Service Worker installed');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker activated');
  event.waitUntil(clients.claim());
});

// Handle push notifications
self.addEventListener('push', (event) => {
  console.log('Push notification received:', event);

  if (!event.data) {
    console.log('No data in push notification');
    return;
  }

  let notificationData;
  try {
    notificationData = event.data.json();
  } catch (error) {
    console.error('Error parsing push notification data:', error);
    notificationData = {
      title: 'CADGroup Tools Portal',
      body: event.data.text(),
    };
  }

  const { title, body, icon, badge, image, tag, requireInteraction, actions, data } = notificationData;

  const options = {
    body,
    icon: icon || '/icon-192x192.png',
    badge: badge || '/badge-72x72.png',
    image,
    tag: tag || 'cadgroup-notification',
    requireInteraction: requireInteraction || false,
    actions: actions || [],
    data: data || {},
    vibrate: [200, 100, 200],
    timestamp: Date.now(),
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event);
  event.notification.close();

  const { action } = event;
  const { data } = event.notification;

  let targetUrl = '/dashboard';

  // Handle different notification types and actions
  if (data && data.type) {
    switch (data.type) {
      case 'user_registration':
        targetUrl = '/admin/users';
        break;
      case 'report_complete':
        if (action === 'view' && data.reportId) {
          targetUrl = `/reports/${data.reportId}`;
        } else if (action === 'download' && data.reportId) {
          targetUrl = `/reports/${data.reportId}?download=true`;
        } else {
          targetUrl = '/reports';
        }
        break;
      case 'login_attempt':
        targetUrl = '/settings?tab=security';
        break;
      case 'system_alert':
        targetUrl = '/dashboard';
        break;
      case 'custom':
        targetUrl = data.url || '/dashboard';
        break;
      default:
        targetUrl = '/dashboard';
    }
  }

  // Handle custom actions
  if (action && data && data.actions) {
    const customAction = data.actions.find(a => a.action === action);
    if (customAction && customAction.url) {
      targetUrl = customAction.url;
    }
  }

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Check if there's already a window/tab open
      for (const client of clientList) {
        if (client.url.includes('cadgroupmgt.com') || client.url.includes('localhost')) {
          client.focus();
          client.navigate(targetUrl);
          return;
        }
      }
      // If no window/tab is open, open a new one
      return clients.openWindow(targetUrl);
    })
  );
});

// Handle notification close
self.addEventListener('notificationclose', (event) => {
  console.log('Notification closed:', event);
  // You can track notification dismissals here if needed
});

// Handle background sync for failed notifications
self.addEventListener('sync', (event) => {
  if (event.tag === 'retry-notifications') {
    console.log('Retrying failed notifications');
    // Implement retry logic here if needed
  }
});

// Handle service worker messages
self.addEventListener('message', (event) => {
  console.log('Service Worker received message:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});