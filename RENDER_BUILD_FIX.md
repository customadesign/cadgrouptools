# Render Build Fix Guide

## Problem

The build is failing with `npm ci` sync errors. This happens because `npm ci` is very strict about lockfile/package.json matching.

## Solution

You need to change the Render build command from `npm ci && npm run build` to `npm install && npm run build`.

## Steps to Fix

### Option 1: Via Render Dashboard (Recommended)

1. Go to: https://dashboard.render.com/web/srv-d2dibgje5dus7382l99g/settings
2. Scroll to "Build Command"
3. Change from: `npm ci && npm run build`
4. Change to: `npm install && npm run build`
5. Click "Save Changes"
6. Render will automatically trigger a new deploy

### Option 2: Via render.yaml (Alternative)

Update the `render.yaml` file in the repository:

```yaml
services:
  - type: web
    name: cadgrouptools
    runtime: node
    region: oregon
    plan: starter
    branch: main
    rootDir: portal
    buildCommand: npm install && npm run build  # Changed from npm ci
    startCommand: npm start
    envVars:
      # ... existing env vars ...
```

Then commit and push:

```bash
git add render.yaml
git commit -m "fix: Change build command to npm install for flexibility"
git push origin main
```

## Why This Happens

`npm ci`:
- Requires EXACT match between package.json and package-lock.json
- Fails if any transitive dependency version changes
- More strict but faster in CI/CD environments

`npm install`:
- More flexible with version resolution
- Updates lockfile if needed
- Better for projects with frequent dependency updates

## After Fix

Once the build command is changed:

1. Render will automatically deploy
2. Build should succeed
3. All new features will be available

## Environment Variables to Set

After build succeeds, set these in Render dashboard:

```bash
MANUS_API_KEY=sk-84mJtNODf1nezQJLbmbOmoKhe4aQVb2GZCbCjdkioPsIAFXwSbL_K_qrjop3dcDD_9n67thIrNoxy-YStjm3k3qX8bHx
MANUS_BASE_URL=https://api.manus.ai/v1
MANUS_WEBHOOK_SECRET=<generate-random-32-char-string>

GHL_API_KEY=pit-b1a70f52-ef61-4e6e-a439-22d836a23563
GHL_LOCATION_ID=62kZ0CQqMotRWvdIjMZS
GHL_WEBHOOK_SECRET=<generate-random-32-char-string>

ANTHROPIC_API_KEY=<your-key>
MURPHY_HOURLY_RATE=35
```

## Register Webhooks

After successful deployment:

```bash
cd portal
node scripts/register-webhooks.js
```

## Verify Deployment

Test the new endpoints:

```bash
curl https://cadgrouptools.onrender.com/api/health
curl https://cadgrouptools.onrender.com/api/webhooks/manus
curl https://cadgrouptools.onrender.com/api/webhooks/ghl
```

Both webhook endpoints should return 405 Method Not Allowed (this is correct).

## Next Steps

1. Change build command in Render dashboard
2. Wait for successful deployment
3. Configure environment variables
4. Register webhooks
5. Test workflows

