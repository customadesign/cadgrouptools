# Comprehensive Real-Time User Activity Tracking Implementation

## Overview
This document outlines the comprehensive real-time user activity tracking system implemented for the CADGroup Management Tools Portal. The system tracks all user actions across the application and provides real-time analytics and audit trails.

## Implementation Components

### 1. Core Activity Logger Service
**Location:** `/src/services/activityLogger.ts`
- Singleton pattern implementation for centralized logging
- Batch processing for performance optimization
- Automatic IP address extraction
- User agent parsing for browser/OS detection
- Response time tracking
- Error capture and logging

### 2. Enhanced Activity Logger
**Location:** `/src/services/enhancedActivityLogger.ts`
- Session activity tracking
- User journey analysis
- Offline queue support
- Bulk activity logging
- Behavioral pattern analysis
- Device information parsing
- Location tracking capability

### 3. Activity Tracking Middleware
**Location:** `/src/middleware/activityTracking.ts`
- Automatic route configuration mapping
- Resource information extraction
- Changes tracking (before/after states)
- Method-based action type detection
- Skip logging configuration
- Client-side tracking functions

### 4. Database Schema
**Location:** `/src/models/ActivityLog.ts`
- Comprehensive activity log schema with indexes
- Support for multiple action types: login, logout, create, update, delete, view, upload, download, generate, export, import, error
- Resource types: user, client, proposal, report, file, transaction, statement, system, auth
- Performance metrics (response time)
- Location and device metadata
- Changes tracking for audit trails

## API Routes with Activity Tracking

### Tracked API Endpoints
All major API endpoints now include automatic activity tracking:

1. **Authentication Routes**
   - `/api/auth/register` - User registration
   - `/api/auth/[...nextauth]` - Login/logout events
   - Password resets and changes

2. **Client Management**
   - `/api/clients` - Create/list clients
   - `/api/clients/[id]` - Update/delete clients
   - `/api/clients/[id]/avatar` - Avatar uploads

3. **Proposals**
   - `/api/proposals` - Create/list proposals
   - `/api/proposals/[id]` - Update/delete proposals
   - `/api/proposals/[id]/generate` - PDF generation

4. **Transactions**
   - `/api/transactions` - Create/list transactions
   - `/api/transactions/[id]` - Update/delete transactions

5. **Statements**
   - `/api/statements` - Create/list statements
   - `/api/statements/[id]` - Update/delete statements

6. **File Operations**
   - `/api/uploads/presign` - File uploads
   - `/api/ocr` - OCR processing

7. **Admin Operations**
   - `/api/admin/users` - User management
   - `/api/admin/users/reset-password` - Password resets
   - `/api/admin/users/bulk` - Bulk operations

8. **Reports & Analytics**
   - `/api/admin/activity-logs` - View activity logs
   - `/api/admin/activity-logs/stats` - Activity statistics
   - `/api/admin/activity-logs/export` - Export logs
   - `/api/admin/activity-logs/realtime` - Real-time statistics

9. **Activity Tracking Routes**
   - `/api/activity/page-view` - Track page views
   - `/api/activity/interaction` - Track user interactions

## Client-Side Tracking

### Activity Tracker Component
**Location:** `/src/components/ActivityTracker.tsx`
- Automatic page view tracking
- Session start/end tracking
- Window focus/blur events
- Page visibility changes
- Error tracking
- Unhandled promise rejection capture

### React Hooks
**Location:** `/src/hooks/useActivityTracking.ts`
- `usePageTracking()` - Automatic page view tracking
- `useInteractionTracking()` - Manual interaction tracking
- Helper functions for common tracking scenarios:
  - `trackButtonClick()`
  - `trackFormSubmission()`
  - `trackSearch()`
  - `trackFileOperation()`
  - `trackReportGeneration()`
  - `trackError()`

## Reports Page Enhancements

### User Activity Tab Features
**Location:** `/src/app/reports/page.tsx`

1. **Real-Time Updates**
   - Auto-refresh toggle with configurable intervals (10s, 30s, 1m, 5m)
   - Live activity indicator
   - Last updated timestamp

2. **Advanced Filtering**
   - Search across all log fields
   - Filter by action type (login, create, update, delete, etc.)
   - Filter by resource type (client, proposal, transaction, etc.)
   - Filter by success/failure status
   - Date range selection

3. **Activity Statistics**
   - Total activities count
   - Success rate with progress indicator
   - Failed operations count
   - Average response time
   - Activity trends chart (hourly distribution)
   - Activity distribution pie chart
   - Most active users list
   - Recent errors list

4. **Data Export**
   - Export to CSV format
   - Export to JSON format
   - Configurable date ranges

5. **Detailed Activity Table**
   - Timestamp with tooltip
   - User information with avatar
   - Action type with color coding
   - Resource type and name
   - Success/failure status
   - Response time metrics
   - IP address tracking
   - Expandable details view

## Real-Time Analytics API

### Real-Time Statistics Endpoint
**Location:** `/api/admin/activity-logs/realtime`

Provides real-time analytics including:
- Summary statistics (total activities, unique users, success rate)
- Active users list with activity counts
- Top actions and resources
- Recent errors with details
- Timeline data (grouped by minute/hour/day)
- User activity summary by role
- System health score and recommendations

### Health Metrics
- Error rate monitoring
- Response time analysis
- Active user tracking
- Automatic health score calculation (0-100)
- Health status: healthy/degraded/unhealthy
- Actionable recommendations

## WebSocket Support (Future Enhancement)

### WebSocket Service
**Location:** `/src/services/activityWebSocket.ts`
- Real-time activity streaming
- User presence tracking
- Live statistics updates
- Connection management with auto-reconnect
- Event subscription system

## Usage Examples

### Adding Activity Tracking to a New API Route
```typescript
import { withActivityTracking } from '@/middleware/activityTracking';

export const GET = withActivityTracking(async (request: NextRequest) => {
  // Your API logic here
  return NextResponse.json({ data: 'response' });
});
```

### Tracking Client-Side Interactions
```typescript
import { trackButtonClick, trackFormSubmission } from '@/hooks/useActivityTracking';

// Track button click
<Button onClick={() => {
  trackButtonClick('export-report', { format: 'pdf' });
  handleExport();
}}>
  Export PDF
</Button>

// Track form submission
<Form onFinish={(values) => {
  trackFormSubmission('client-create', values);
  handleSubmit(values);
}}>
```

### Using the Activity Tracker Component
Add to your root layout:
```typescript
import ActivityTracker from '@/components/ActivityTracker';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <ActivityTracker />
        {children}
      </body>
    </html>
  );
}
```

## Performance Considerations

1. **Batch Processing**
   - Activities are queued and processed in batches
   - Default batch size: 10 activities
   - Flush interval: 5 seconds

2. **Database Indexes**
   - Compound indexes for common queries
   - Text indexes for search functionality
   - TTL indexes for automatic cleanup (optional)

3. **Caching**
   - Response caching for statistics
   - Client-side caching for offline support

4. **Rate Limiting**
   - Built-in rate limiting for activity logging
   - Prevents excessive logging from single users

## Security & Privacy

1. **Data Sanitization**
   - Sensitive data is excluded from logs
   - Passwords are never logged
   - PII is minimized in activity logs

2. **Access Control**
   - Only admins can view activity logs
   - User-specific filtering for non-admins
   - Role-based access to statistics

3. **Data Retention**
   - Optional TTL indexes for automatic cleanup
   - Configurable retention periods
   - Export functionality for archival

## Monitoring & Alerts

The system provides:
- Real-time error tracking
- Performance degradation detection
- Unusual activity pattern detection
- Failed login attempt monitoring
- System health monitoring

## Future Enhancements

1. **Machine Learning Integration**
   - Anomaly detection
   - User behavior prediction
   - Automated threat detection

2. **Advanced Analytics**
   - Funnel analysis
   - Cohort analysis
   - A/B testing support

3. **Integration Capabilities**
   - Webhook notifications
   - Third-party analytics tools
   - SIEM integration

## Troubleshooting

### Common Issues

1. **Activities not being logged**
   - Check MongoDB connection
   - Verify user session exists
   - Check middleware is properly applied

2. **Performance issues**
   - Adjust batch size in activityLogger
   - Enable database indexes
   - Implement TTL for old logs

3. **Missing client-side tracking**
   - Ensure ActivityTracker is mounted
   - Check network requests in browser
   - Verify API endpoints are accessible

## Conclusion

The comprehensive activity tracking system provides complete visibility into user actions, enabling:
- Real-time monitoring of system usage
- Detailed audit trails for compliance
- Performance optimization insights
- Security incident investigation
- User behavior analysis

All significant user actions are now tracked automatically, providing administrators with a complete audit trail and real-time insights into system activity.