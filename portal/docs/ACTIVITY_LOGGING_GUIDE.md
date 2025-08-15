# Activity Logging System Documentation

## Overview

The Activity Logging System provides comprehensive tracking of all user activities within the CADGroup Tools portal. It automatically logs user actions, API requests, and system events with detailed metadata for security auditing, compliance, and analytics.

## Features

- **Automatic Activity Tracking**: Logs all CRUD operations, authentication events, and file operations
- **Performance Monitoring**: Tracks response times and system performance metrics
- **Security Auditing**: Records IP addresses, user agents, and failed authentication attempts
- **Change Tracking**: Maintains before/after snapshots for update operations
- **Efficient Batch Processing**: Uses write queues to minimize performance impact
- **Advanced Querying**: Supports filtering, pagination, and full-text search
- **Analytics Dashboard**: Provides statistics and trends analysis
- **Data Export**: Supports CSV and JSON export formats

## Architecture

### Components

1. **ActivityLog Model** (`/src/models/ActivityLog.ts`)
   - MongoDB schema with optimized indexes
   - Comprehensive field structure for detailed logging
   - Text indexes for search functionality

2. **Activity Logger Service** (`/src/services/activityLogger.ts`)
   - Singleton pattern for consistent logging
   - Batch processing with configurable intervals
   - Automatic IP and user agent parsing

3. **Middleware** (`/src/middleware/activityLogger.ts`)
   - Route-level activity logging
   - Automatic context extraction
   - Error handling and recovery

4. **API Endpoints**
   - `/api/admin/activity-logs` - Query and manage logs
   - `/api/admin/activity-logs/stats` - Analytics and statistics
   - `/api/admin/activity-logs/export` - Export functionality

## Usage

### Basic Integration

#### Method 1: Using Middleware Wrapper

```typescript
import { withActivityLogging, contextExtractors } from '@/utils/withActivityLogging';

export const GET = withActivityLogging(
  async (request: NextRequest) => {
    // Your route logic here
    return NextResponse.json({ data: 'response' });
  },
  contextExtractors.client // Use predefined context extractor
);
```

#### Method 2: Manual Logging

```typescript
import { activityLogger } from '@/services/activityLogger';

// In your API route
await activityLogger.logActivity(
  request,
  {
    actionType: 'create',
    resourceType: 'client',
    resourceId: client._id,
    resourceName: client.name,
    metadata: { /* additional data */ }
  },
  {
    success: true,
    statusCode: 201,
    responseTime: Date.now() - startTime
  }
);
```

### Authentication Logging

The system automatically logs authentication events in the auth configuration:

```typescript
// Successful login
await activityLogger.logSystemActivity(
  user,
  {
    actionType: 'login',
    resourceType: 'auth',
    method: 'POST',
    endpoint: '/api/auth/signin'
  },
  { success: true, statusCode: 200 }
);
```

### Change Tracking

For update operations, include before/after snapshots:

```typescript
await activityLogger.logActivity(
  request,
  {
    actionType: 'update',
    resourceType: 'client',
    resourceId: id,
    changes: {
      before: originalDocument,
      after: updatedDocument
    }
  },
  { success: true, statusCode: 200 }
);
```

## API Reference

### GET /api/admin/activity-logs

Query activity logs with filtering and pagination.

**Query Parameters:**
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (max: 100, default: 50)
- `startDate` (string): Filter by start date
- `endDate` (string): Filter by end date
- `userId` (string): Filter by user ID
- `userEmail` (string): Filter by user email (partial match)
- `actionType` (string): Filter by action type
- `resourceType` (string): Filter by resource type
- `resourceId` (string): Filter by resource ID
- `success` (boolean): Filter by success status
- `userRole` (string): Filter by user role
- `ipAddress` (string): Filter by IP address
- `method` (string): Filter by HTTP method
- `search` (string): Full-text search
- `sortBy` (string): Sort field (default: timestamp)
- `sortOrder` (string): Sort order (asc/desc, default: desc)

**Response:**
```json
{
  "logs": [...],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 500,
    "totalPages": 10,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

### GET /api/admin/activity-logs/stats

Get activity statistics and analytics.

**Query Parameters:**
- `startDate` (string): Start date for statistics
- `endDate` (string): End date for statistics
- `userId` (string): Filter statistics by user

**Response:**
```json
{
  "overview": {
    "totalActivities": 1000,
    "successRate": "95.50",
    "totalSuccess": 955,
    "totalFailure": 45
  },
  "performance": {
    "averageResponseTime": 150,
    "minResponseTime": 10,
    "maxResponseTime": 2000
  },
  "distributions": {
    "actionTypes": [...],
    "resourceTypes": [...]
  },
  "userActivity": {
    "topUsers": [...],
    "mostActive": [...]
  },
  "trends": {
    "hourly": [...],
    "daily": [...]
  },
  "recentErrors": [...]
}
```

### POST /api/admin/activity-logs/export

Export activity logs in CSV or JSON format.

**Request Body:**
```json
{
  "format": "csv",
  "startDate": "2024-01-01",
  "endDate": "2024-12-31",
  "userId": "optional",
  "actionType": "optional",
  "resourceType": "optional",
  "success": true,
  "limit": 10000
}
```

**Response:**
- CSV format: Returns file download
- JSON format: Returns structured JSON data

### DELETE /api/admin/activity-logs

Delete old activity logs.

**Request Body:**
```json
{
  "olderThanDays": 90
}
```

## Database Indexes

The system creates the following indexes for optimal performance:

1. **Single Field Indexes:**
   - `userId` - User-specific queries
   - `userEmail` - Email-based filtering
   - `userRole` - Role-based filtering
   - `actionType` - Action type filtering
   - `resourceType` - Resource type filtering
   - `resourceId` - Resource-specific queries
   - `endpoint` - Endpoint analysis
   - `ipAddress` - IP-based queries
   - `timestamp` - Time-based sorting
   - `success` - Success/failure filtering

2. **Compound Indexes:**
   - `{userId: 1, timestamp: -1}` - User activity timeline
   - `{resourceType: 1, resourceId: 1, timestamp: -1}` - Resource history
   - `{actionType: 1, timestamp: -1}` - Action type analysis
   - `{success: 1, timestamp: -1}` - Error tracking
   - `{userRole: 1, actionType: 1, timestamp: -1}` - Role-based analytics

3. **Text Index:**
   - Full-text search on: `userName`, `userEmail`, `resourceName`, `endpoint`

## Performance Considerations

### Batch Processing

The logger uses a write queue with configurable batch size:

```typescript
private batchSize = 10;        // Logs per batch
private flushInterval = 5000;  // Flush interval (5 seconds)
```

### Response Time Tracking

All logged activities include response time measurements:

```typescript
const startTime = Date.now();
// ... operation ...
const responseTime = Date.now() - startTime;
```

### Memory Management

- Automatic queue flushing when size exceeds threshold
- Graceful error handling without blocking main operations
- Optional TTL indexes for automatic log cleanup

## Security Features

1. **Admin-Only Access**: All activity log endpoints require admin role
2. **IP Tracking**: Automatic IP extraction from headers
3. **Failed Authentication Logging**: Tracks invalid login attempts
4. **Sensitive Data Handling**: Passwords never logged
5. **Change Auditing**: Complete before/after snapshots for updates

## Testing

Run the test script to validate the system:

```bash
# Generate sample data
node scripts/test-activity-logging.js --generate

# Run tests
node scripts/test-activity-logging.js --test

# Clean up test data
node scripts/test-activity-logging.js --cleanup
```

## Maintenance

### Log Retention

Configure automatic cleanup with TTL index (optional):

```typescript
// In ActivityLog model - uncomment to enable
ActivityLogSchema.index(
  { timestamp: 1 }, 
  { expireAfterSeconds: 7776000 } // 90 days
);
```

### Manual Cleanup

Use the DELETE endpoint to remove old logs:

```bash
curl -X DELETE /api/admin/activity-logs \
  -H "Content-Type: application/json" \
  -d '{"olderThanDays": 90}'
```

## Best Practices

1. **Always Log Critical Operations**: User management, authentication, data exports
2. **Include Metadata**: Add relevant context for better analysis
3. **Track Changes**: For updates, include before/after states
4. **Handle Errors Gracefully**: Logging failures shouldn't break operations
5. **Regular Monitoring**: Review logs for suspicious activities
6. **Export Regular Backups**: Use export API for compliance records

## Troubleshooting

### Logs Not Appearing

1. Check MongoDB connection
2. Verify user session exists
3. Check batch processor is running
4. Review console for error messages

### Performance Issues

1. Ensure indexes are created
2. Adjust batch size and flush interval
3. Implement log retention policy
4. Monitor MongoDB performance

### Missing Data

1. Verify middleware is properly applied
2. Check context extractors are correct
3. Ensure async operations complete
4. Review error logs

## Integration Examples

See `/src/examples/enhanced-routes-with-logging.ts` for complete implementation examples including:

- Simple GET with logging
- POST with resource details
- UPDATE with change tracking
- DELETE with soft delete
- Bulk operations
- File uploads

## Support

For issues or questions about the Activity Logging System:
1. Check this documentation
2. Review example implementations
3. Check MongoDB logs
4. Contact system administrator