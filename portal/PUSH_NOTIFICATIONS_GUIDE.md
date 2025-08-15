# Push Notification System Implementation Guide

## Overview
The CADGroup Tools Portal now includes a complete push notification system using Web Push API with VAPID keys. This system allows real-time browser notifications for important events.

## Features Implemented

### 1. Backend Infrastructure
- **MongoDB Schemas**: 
  - `PushSubscription`: Stores user push subscription data
  - `NotificationHistory`: Tracks all sent notifications
  
- **API Endpoints**:
  - `POST /api/notifications/subscribe`: Subscribe to push notifications
  - `DELETE /api/notifications/subscribe`: Unsubscribe from push notifications
  - `GET /api/notifications/subscribe`: Get user's active subscriptions
  - `GET /api/notifications/vapid-key`: Get VAPID public key
  - `POST /api/notifications/send`: Send custom notifications (admin only)
  - `GET /api/notifications/history`: Get notification history

### 2. Frontend Implementation
- **Service Worker** (`/public/sw.js`): Handles push events and notification display
- **Client Service**: Manages subscription/unsubscription and permission requests
- **Settings Page Integration**: Full UI for managing push notifications

### 3. Notification Triggers

The system automatically sends notifications for:

1. **New User Registrations** (to admins)
   - Triggered when a new user registers
   - Sent to all admin users

2. **Report Generation Completion**
   - Notifies users when their reports are ready
   - Includes action buttons to view or download

3. **Failed Login Attempts** (security alerts)
   - Alerts users of failed login attempts on their account
   - Shows IP, location, and device information

4. **System Alerts and Updates**
   - Broadcast important system messages to all users
   - Different severity levels (info, warning, error)

5. **Custom Notifications** (admin feature)
   - Admins can send custom notifications to specific users or groups
   - Available through the Settings page UI

## Setup Instructions

### 1. Generate VAPID Keys
Run the setup script to generate VAPID keys:
```bash
npm run generate-vapid-keys
# or
node scripts/generate-vapid-keys.js
```

### 2. Environment Variables
Ensure these are in your `.env.local`:
```env
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your-public-key
VAPID_PRIVATE_KEY=your-private-key
VAPID_SUBJECT=mailto:admin@cadgroupmgt.com
```

### 3. Enable Push Notifications
1. Navigate to Settings > Notifications
2. Click the toggle to enable push notifications
3. Accept the browser permission prompt
4. Test with the "Test Notification" button

## User Guide

### For Regular Users
1. Go to Settings > Notifications
2. Enable push notifications toggle
3. Grant permission when prompted
4. Manage notification preferences

### For Admins
1. Access additional features in Settings > Notifications
2. Send custom notifications to users
3. View notification history
4. Monitor delivery success rates

## Browser Support
Push notifications are supported in:
- Chrome/Edge (desktop & mobile)
- Firefox (desktop & mobile)
- Safari (with limitations)

Not supported in:
- Internet Explorer
- Incognito/Private browsing modes

## Security Features
- VAPID authentication ensures only your server can send notifications
- User-specific subscriptions prevent unauthorized notifications
- Failed login attempt alerts for security monitoring
- Encrypted subscription endpoints

## Troubleshooting

### Common Issues

1. **"Push notifications not supported"**
   - Use a modern browser (Chrome, Firefox, Edge)
   - Ensure you're using HTTPS in production

2. **Permission denied**
   - Check browser settings for notification permissions
   - Clear site data and try again

3. **Notifications not received**
   - Check service worker registration in DevTools
   - Verify VAPID keys are correctly configured
   - Check browser notification settings

### Debug Tools
- Browser DevTools > Application > Service Workers
- Browser DevTools > Application > Push Messaging
- Check `/api/notifications/history` for sent notifications

## API Integration Examples

### Send Custom Notification (Admin)
```javascript
const result = await fetch('/api/notifications/send', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    targetUsers: 'all', // or 'admins' or array of user IDs
    title: 'System Update',
    body: 'The system will undergo maintenance at 10 PM',
    requireInteraction: true
  })
});
```

### Programmatic Notification Triggers
```javascript
// In your backend code
import pushNotificationService from '@/services/pushNotificationService';

// Notify on report completion
await pushNotificationService.notifyReportComplete(
  userId,
  'Monthly Sales Report',
  reportId
);

// System alert
await pushNotificationService.sendSystemAlert(
  'Maintenance Notice',
  'System will be offline for 30 minutes',
  'warning'
);
```

## Maintenance

### Clean Up Inactive Subscriptions
Periodically clean up old/inactive subscriptions:
```javascript
const deletedCount = await pushNotificationService.cleanupInactiveSubscriptions(30);
```

### Monitor Delivery Rates
Check notification history regularly to monitor delivery success rates and identify issues.

## Future Enhancements
- [ ] Notification categories and user preferences
- [ ] Scheduled notifications
- [ ] Rich notifications with images
- [ ] Notification analytics dashboard
- [ ] Email fallback for failed push notifications

## Support
For issues or questions about the push notification system, contact the development team or check the notification history for debugging information.