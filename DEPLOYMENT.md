# CAD Group Tools - Deployment Guide

## Latest Deployment

**Commit**: `d00e828` - Integrate Manus AI and GoHighLevel for automated proposal generation
**Status**: Build in Progress ⏳
**Deployed to**: https://cadgrouptools.onrender.com
**Deploy ID**: dep-d48nd5nfte5s73a7p1ug

## Required Environment Variables on Render

The following environment variables MUST be configured in Render dashboard before the new features will work:

### 1. Manus AI Configuration
```
MANUS_API_KEY=sk-84mJtNODf1nezQJLbmbOmoKhe4aQVb2GZCbCjdkioPsIAFXwSbL_K_qrjop3dcDD_9n67thIrNoxy-YStjm3k3qX8bHx
MANUS_BASE_URL=https://api.manus.ai/v1
MANUS_WEBHOOK_SECRET=<generate-random-string>
```

### 2. GoHighLevel Configuration
```
GHL_API_KEY=pit-b1a70f52-ef61-4e6e-a439-22d836a23563
GHL_LOCATION_ID=62kZ0CQqMotRWvdIjMZS
GHL_WEBHOOK_SECRET=<generate-random-string>
```

### 3. Claude SDK Configuration
```
ANTHROPIC_API_KEY=<your-anthropic-api-key>
```

### 4. Company Configuration
```
MURPHY_HOURLY_RATE=35
```

### Existing Variables (Verify These Are Set)
```
# SendGrid
EMAIL_SERVER_PASSWORD=<sendgrid-api-key>
EMAIL_FROM=noreply@cadgrouptools.com

# Supabase
SUPABASE_URL=<your-supabase-url>
SUPABASE_ANON_KEY=<your-key>
SUPABASE_SERVICE_ROLE=<your-key>
SUPABASE_BUCKET=cadgroupmgt

# MongoDB
DATABASE_URL=<mongodb-connection-string>
DB_NAME=cadgroupmgt

# NextAuth
NEXTAUTH_URL=https://cadgrouptools.onrender.com
NEXTAUTH_SECRET=<your-secret>
```

## Post-Deployment Configuration

### 1. Register Webhooks with Manus AI

After deployment completes, register the webhook:

```bash
curl -X POST https://api.manus.ai/v1/webhooks \
  -H "Authorization: Bearer $MANUS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://cadgrouptools.onrender.com/api/webhooks/manus",
    "events": ["task.completed", "task.failed", "task.processing"]
  }'
```

### 2. Register Webhooks with GoHighLevel

Register webhook for form submissions:

```bash
curl -X POST https://rest.gohighlevel.com/v1/webhooks \
  -H "Authorization: Bearer pit-b1a70f52-ef61-4e6e-a439-22d836a23563" \
  -H "Content-Type: application/json" \
  -d '{
    "locationId": "62kZ0CQqMotRWvdIjMZS",
    "url": "https://cadgrouptools.onrender.com/api/webhooks/ghl",
    "events": ["FormSubmitted"]
  }'
```

### 3. Test Webhook Endpoints

Test Manus webhook:
```bash
curl https://cadgrouptools.onrender.com/api/webhooks/manus
# Should return: {"error":"Method not allowed"}
```

Test GHL webhook:
```bash
curl https://cadgrouptools.onrender.com/api/webhooks/ghl
# Should return: {"error":"Method not allowed"}
```

## New Features Available After Deployment

### 1. Proposals Dashboard
- URL: https://cadgrouptools.onrender.com/proposals
- Features: Tab-based interface for Murphy and E-Systems proposals

### 2. Murphy Consulting Proposals
- List: https://cadgrouptools.onrender.com/proposals/murphy
- Automatically created from GoHighLevel form submissions
- View Manus AI processing status
- Download Google Slides
- Send proposals via email

### 3. E-Systems Management Proposals
- List: https://cadgrouptools.onrender.com/proposals/esystems
- Product-focused proposals
- Same features as Murphy proposals

### 4. Webhook Endpoints
- Manus: https://cadgrouptools.onrender.com/api/webhooks/manus
- GoHighLevel: https://cadgrouptools.onrender.com/api/webhooks/ghl

## Monitoring Deployment

Check deployment status:
- Dashboard: https://dashboard.render.com/web/srv-d2dibgje5dus7382l99g
- Logs: Available in Render dashboard
- Health check: https://cadgrouptools.onrender.com/api/health

## Troubleshooting

### If Build Fails
1. Check Render logs for specific errors
2. Verify all dependencies are in `package.json`
3. Ensure TypeScript compilation succeeds locally

### If Webhooks Don't Work
1. Verify environment variables are set correctly
2. Check webhook URLs are publicly accessible
3. Verify webhook secrets match between Render and external services
4. Check Render logs for webhook errors

### If Proposals Don't Generate
1. Verify Manus API key is valid
2. Check GoHighLevel webhook is registered correctly
3. Submit a test form and check logs
4. Verify MongoDB connection is working

## Testing Checklist

After deployment completes:
- [ ] Environment variables configured
- [ ] Webhooks registered with Manus AI
- [ ] Webhooks registered with GoHighLevel
- [ ] Test Murphy form submission
- [ ] Test E-Systems form submission
- [ ] Verify Manus task creation
- [ ] Check Google Slides generation
- [ ] Test email sending
- [ ] Monitor webhook logs

## Rollback Plan

If issues occur:
```bash
# Revert to previous deployment
cd "/Users/harrymurphy/Library/Mobile Documents/com~apple~CloudDocs/Coding Projects/Cadgroupmgt.com Internal Tools"
git revert HEAD
git push origin main
```

Or use Render dashboard to rollback to previous deploy.

## Next Steps

1. Monitor build completion
2. Configure environment variables
3. Register webhooks
4. Test workflows
5. Complete remaining features:
   - Accounting upload interface
   - Accounting analysis display
   - Claude chat widget

