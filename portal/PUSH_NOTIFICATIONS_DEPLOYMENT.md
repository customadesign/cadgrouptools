# Push Notifications Deployment Guide for CADGroup Tools Portal

## Production URL: https://cadgrouptools.onrender.com/

This guide provides comprehensive instructions for deploying the push notification system to production on Render.com.

## 1. Environment Variables Configuration

### Required Variables for Push Notifications

Add these environment variables in your Render dashboard:

```bash
# VAPID Keys for Web Push (REQUIRED)
NEXT_PUBLIC_VAPID_PUBLIC_KEY=<your-public-key>
VAPID_PRIVATE_KEY=<your-private-key>
VAPID_SUBJECT=mailto:admin@cadgroupmgt.com

# MongoDB Configuration (REQUIRED)
MONGODB_URI=<your-mongodb-connection-string>
DB_NAME=cadtools

# NextAuth Configuration (REQUIRED)
NEXTAUTH_URL=https://cadgrouptools.onrender.com
NEXTAUTH_SECRET=<generate-secure-secret>

# Optional Email Fallback (SendGrid)
SENDGRID_API_KEY=<your-sendgrid-api-key>
SENDGRID_FROM_EMAIL=notifications@cadgroupmgt.com
SENDGRID_FROM_NAME=CADGroup Tools Portal
```

### Generate VAPID Keys

Run this script locally to generate VAPID keys:

```bash
node scripts/generate-vapid-keys.js
```

Or use this standalone script:

```javascript
const webpush = require('web-push');
const vapidKeys = webpush.generateVAPIDKeys();
console.log('Public Key:', vapidKeys.publicKey);
console.log('Private Key:', vapidKeys.privateKey);
```

## 2. Service Worker Configuration

The service worker is already configured at `/public/sw.js` with:

### Caching Strategy

```javascript
// Current implementation uses no-cache strategy for real-time notifications
// For production, consider implementing cache-first with network fallback:

const CACHE_NAME = 'cadgroup-tools-v1';
const urlsToCache = [
  '/',
  '/dashboard',
  '/icon-192x192.png',
  '/badge-72x72.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});
```

### Update Mechanism

The service worker automatically updates when:
- The sw.js file changes
- Using skipWaiting() and clients.claim() for immediate activation

## 3. HTTPS Requirements

Push notifications REQUIRE HTTPS in production. Render provides this automatically.

### Verify HTTPS is Working:
1. Check that your site loads with https://
2. Check browser console for mixed content warnings
3. Verify service worker registration in DevTools > Application

### CORS Headers Configuration

The API routes already include proper CORS headers. For additional security:

```typescript
// In your API routes
const headers = {
  'Access-Control-Allow-Origin': 'https://cadgrouptools.onrender.com',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Credentials': 'true'
};
```

## 4. Database Indexes for Performance

Create these indexes in MongoDB for optimal push notification performance:

```javascript
// Connect to your MongoDB and run:
db.pushsubscriptions.createIndex({ userId: 1, isActive: 1 });
db.pushsubscriptions.createIndex({ "subscription.endpoint": 1 });
db.pushsubscriptions.createIndex({ lastUsed: 1 });
db.pushsubscriptions.createIndex({ createdAt: 1 });

db.notificationhistory.createIndex({ createdAt: -1 });
db.notificationhistory.createIndex({ sentTo: 1 });
db.notificationhistory.createIndex({ type: 1 });
db.notificationhistory.createIndex({ sentBy: 1 });
```

## 5. Monitoring and Debugging

### Enable Logging

Set these environment variables for production debugging:

```bash
# Add to Render environment
DEBUG=push:*
LOG_LEVEL=info
```

### Monitor Push Delivery

Access the notification history endpoint:
```
GET /api/notifications/history
```

### Check Failed Notifications

Monitor the NotificationHistory collection for failures:

```javascript
// Query for failed notifications
db.notificationhistory.find({ 
  failureCount: { $gt: 0 } 
}).sort({ createdAt: -1 });
```

### Browser Console Debugging

```javascript
// Check service worker status
navigator.serviceWorker.ready.then(registration => {
  console.log('SW Ready:', registration);
  console.log('Push Manager:', registration.pushManager);
});

// Check push permission
console.log('Notification Permission:', Notification.permission);
```

## 6. Rate Limiting Configuration

Implement rate limiting to prevent notification spam:

```typescript
// Add to your notification sending API
import rateLimit from 'express-rate-limit';

const notificationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each user to 10 notifications per window
  message: 'Too many notifications sent, please try again later'
});

// Apply to routes
app.use('/api/notifications/send', notificationLimiter);
```

### Per-User Daily Limits

```javascript
// Track daily notification count per user
const dailyLimit = 50;
const userNotificationCount = await NotificationHistory.countDocuments({
  sentTo: userId,
  createdAt: { $gte: new Date().setHours(0,0,0,0) }
});

if (userNotificationCount >= dailyLimit) {
  throw new Error('Daily notification limit reached');
}
```

## 7. Email Fallback Configuration

Configure SendGrid as a fallback when push notifications fail:

```typescript
// In pushNotificationService.ts
async function sendWithFallback(userId, notification) {
  try {
    const result = await sendPushNotification(userId, notification);
    if (result.failureCount > 0) {
      await sendEmailNotification(userId, notification);
    }
  } catch (error) {
    console.error('Push failed, sending email:', error);
    await sendEmailNotification(userId, notification);
  }
}
```

### Email Template

```html
<!-- Email notification template -->
<div style="font-family: Arial, sans-serif; max-width: 600px;">
  <h2>{{title}}</h2>
  <p>{{body}}</p>
  <a href="https://cadgrouptools.onrender.com/dashboard" 
     style="background: #1890ff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">
    View in Portal
  </a>
</div>
```

## 8. Testing Strategy

### Pre-Production Testing

1. **Local Testing with HTTPS:**
```bash
# Generate local certificates
openssl req -nodes -new -x509 -keyout localhost.key -out localhost.cert
# Run with HTTPS
HTTPS=true SSL_CRT_FILE=localhost.cert SSL_KEY_FILE=localhost.key npm run dev
```

2. **Test Notification Subscription:**
```javascript
// Test script
const testSubscription = async () => {
  const response = await fetch('/api/notifications/subscribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ subscription: testSubscriptionObject })
  });
  console.log('Subscription result:', await response.json());
};
```

3. **Load Testing:**
```bash
# Use artillery for load testing
npm install -g artillery
artillery quick --count 50 --num 10 https://cadgrouptools.onrender.com/api/notifications/send
```

### Production Testing Checklist

- [ ] Service worker registers successfully
- [ ] Push permission prompt appears
- [ ] Subscription saves to database
- [ ] Test notification received
- [ ] Notification click opens correct page
- [ ] Notifications work on mobile devices
- [ ] Failed notifications trigger email fallback
- [ ] Rate limiting prevents spam
- [ ] Notification history tracks all sends

## 9. Render.com Specific Configuration

### Update render.yaml

```yaml
services:
  - type: web
    name: cadgroup-tools-portal
    runtime: node
    plan: starter # Upgrade from free for production
    buildCommand: npm ci && npm run build
    startCommand: npm start
    healthCheckPath: /api/health
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 10000
      - key: NEXT_PUBLIC_VAPID_PUBLIC_KEY
        sync: false
      - key: VAPID_PRIVATE_KEY
        sync: false
      - key: VAPID_SUBJECT
        value: mailto:admin@cadgroupmgt.com
      # Add notification-specific vars
      - key: NOTIFICATION_BATCH_SIZE
        value: 100
      - key: NOTIFICATION_RETRY_ATTEMPTS
        value: 3
      - key: NOTIFICATION_TIMEOUT_MS
        value: 5000
```

### Health Check Endpoint

Create a health check that verifies push notification system:

```typescript
// /api/health/push/route.ts
export async function GET() {
  try {
    // Check MongoDB connection
    await connectToDatabase();
    
    // Check VAPID keys are configured
    if (!process.env.VAPID_PRIVATE_KEY) {
      throw new Error('VAPID keys not configured');
    }
    
    // Check subscription count
    const activeSubscriptions = await PushSubscription.countDocuments({ 
      isActive: true 
    });
    
    return NextResponse.json({
      status: 'healthy',
      activeSubscriptions,
      vapidConfigured: true,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json({
      status: 'unhealthy',
      error: error.message
    }, { status: 500 });
  }
}
```

## 10. Deployment Steps

### Initial Deployment

1. **Set Environment Variables in Render Dashboard**
   - Navigate to Environment tab
   - Add all required variables listed above
   - Save changes

2. **Deploy the Application**
```bash
git add .
git commit -m "Configure push notifications for production"
git push origin main
```

3. **Verify Deployment**
```bash
# Run verification script
node scripts/verify-deployment.js
```

4. **Initialize Database Indexes**
```bash
# Connect to production MongoDB and run index creation commands
```

5. **Test Push Notifications**
   - Visit https://cadgrouptools.onrender.com
   - Enable notifications when prompted
   - Send test notification from admin panel

### Monitoring Dashboard

Create a monitoring page at `/admin/notifications`:

```typescript
// Shows:
// - Active subscription count
// - Recent notification history
// - Failed notification details
// - Delivery success rate
// - Average delivery time
```

## 11. Troubleshooting

### Common Issues and Solutions

1. **Service Worker Not Registering**
   - Check HTTPS is enabled
   - Clear browser cache
   - Check console for errors

2. **Notifications Not Received**
   - Verify VAPID keys are correct
   - Check browser notification permissions
   - Verify subscription is active in database

3. **High Failure Rate**
   - Check for expired subscriptions
   - Verify network connectivity
   - Review rate limits

4. **MongoDB Performance Issues**
   - Ensure indexes are created
   - Check connection pool settings
   - Monitor query performance

### Debug Mode

Enable debug mode for detailed logging:

```javascript
// In your service worker
const DEBUG = true;

if (DEBUG) {
  console.log('Push event data:', event.data);
  console.log('Notification options:', options);
}
```

## 12. Security Considerations

1. **VAPID Key Security**
   - Never expose private key in client code
   - Rotate keys periodically
   - Use environment variables only

2. **Rate Limiting**
   - Implement per-user limits
   - Add IP-based rate limiting
   - Monitor for abuse patterns

3. **Permission Management**
   - Only admins can send to all users
   - Verify user permissions for targeted sends
   - Log all notification sends

4. **Data Privacy**
   - Don't include sensitive data in notifications
   - Encrypt notification payloads if needed
   - Implement notification expiry

## Maintenance

### Regular Tasks

- **Weekly:** Review failed notifications
- **Monthly:** Clean up inactive subscriptions
- **Quarterly:** Review and optimize indexes
- **Yearly:** Rotate VAPID keys

### Backup Strategy

```bash
# Backup notification data
mongodump --uri="$MONGODB_URI" --collection=pushsubscriptions --out=backup/
mongodump --uri="$MONGODB_URI" --collection=notificationhistory --out=backup/
```

## Support

For issues or questions:
- Check logs in Render dashboard
- Review MongoDB logs
- Contact: admin@cadgroupmgt.com

---

Last Updated: December 2024
Version: 1.0.0