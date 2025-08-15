# Deployment Fixes for CADGroup Tools on Render

## Issue Summary
The accounting upload page at https://cadgrouptools.onrender.com/accounting/upload had non-functional delete and view operations due to:
1. Missing API endpoints for statements CRUD operations
2. Frontend using mock data instead of real API calls
3. No proper error handling for production environment

## Fixes Applied

### 1. Created Missing API Routes

#### `/api/statements/route.ts`
- **GET**: Fetch statements with pagination and filtering
- **POST**: Create new statement records
- **DELETE**: Bulk delete statements

#### `/api/statements/[id]/route.ts`
- **GET**: Fetch single statement with transactions
- **PATCH**: Update statement status and metadata
- **DELETE**: Delete individual statement with cleanup

### 2. Updated Frontend Components

#### `/app/accounting/upload/page.tsx`
- Replaced mock data with real API calls
- Added `fetchStatements()` function to load data from API
- Integrated statement creation with database
- Connected delete operations to API endpoints
- Added proper loading states and error handling
- Improved error messages for better user feedback

### 3. Created Deployment Verification Script

#### `/scripts/verify-deployment.js`
Run this script to verify your deployment:
```bash
node scripts/verify-deployment.js
```

The script checks:
- Required environment variables
- API endpoint availability
- Database connectivity
- CORS configuration

## Environment Variables Required

### Critical Variables (Must be set in Render)

1. **NEXTAUTH_URL**
   - Value: `https://cadgrouptools.onrender.com`
   - ⚠️ No trailing slash!

2. **NEXTAUTH_SECRET**
   - Generate with: `openssl rand -base64 32`
   - Or use existing from IMPORTANT_RENDER_SETUP.txt

3. **MONGODB_URI**
   - Your MongoDB Atlas connection string
   - Format: `mongodb+srv://username:password@cluster.mongodb.net`

4. **DB_NAME**
   - Value: `cadtools`

5. **NODE_ENV**
   - Value: `production`

6. **PORT**
   - Value: `10000`

### Optional Variables (For full functionality)

#### For File Storage (Choose one):

**Option A: Supabase (Recommended)**
- SUPABASE_URL
- SUPABASE_SERVICE_ROLE
- SUPABASE_BUCKET (default: `cadgroup-uploads`)

**Option B: AWS S3**
- S3_REGION
- S3_BUCKET_NAME
- S3_ACCESS_KEY_ID
- S3_SECRET_ACCESS_KEY
- S3_ENDPOINT (optional)
- S3_PUBLIC_READ (default: `true`)

#### For OCR Processing:
- GOOGLE_PROJECT_ID
- GOOGLE_APPLICATION_CREDENTIALS (path to service account JSON)

#### For Email:
- SENDGRID_API_KEY
- SENDGRID_FROM_EMAIL
- SENDGRID_FROM_NAME

## How to Apply These Fixes

### Step 1: Update Environment Variables in Render

1. Go to https://dashboard.render.com
2. Select your service "cadgrouptools"
3. Click "Environment" tab
4. Add/update each required variable
5. Click "Save Changes"

### Step 2: Deploy the Code Changes

The changes will auto-deploy if you have GitHub integration enabled. Otherwise:

```bash
# Commit the changes
git add .
git commit -m "Fix accounting upload page delete/view operations"
git push origin main
```

### Step 3: Verify Deployment

After deployment completes (check Render logs):

1. Visit https://cadgrouptools.onrender.com/accounting/upload
2. Test the following:
   - Page loads without errors
   - Existing statements are displayed (if any)
   - Upload a test file
   - Delete a statement
   - View statement details
   - Refresh button works

### Step 4: Monitor for Issues

Check the Render logs for any errors:
1. Go to Render dashboard
2. Select your service
3. Click "Logs" tab
4. Look for any error messages

## Common Issues and Solutions

### Issue: Delete button doesn't work
**Solution**: Ensure the statements API routes are deployed and MONGODB_URI is set correctly.

### Issue: "Failed to load statements" error
**Solution**: 
1. Check MongoDB connection string is correct
2. Verify database name matches DB_NAME env variable
3. Ensure MongoDB Atlas allows connections from 0.0.0.0/0

### Issue: OCR fails with "service unavailable"
**Solution**: OCR is optional. To enable:
1. Set up Google Cloud Vision credentials
2. Add GOOGLE_PROJECT_ID and GOOGLE_APPLICATION_CREDENTIALS
3. Or rely on Tesseract.js (works client-side, no config needed)

### Issue: File uploads fail
**Solution**: Configure either Supabase or S3:
1. For Supabase: Set SUPABASE_URL and SUPABASE_SERVICE_ROLE
2. For S3: Set all S3_* environment variables

## Testing Checklist

- [ ] Environment variables set in Render
- [ ] Application deploys without build errors
- [ ] Login works at /auth/signin
- [ ] Accounting upload page loads
- [ ] Can view existing statements
- [ ] Can upload new statements
- [ ] Can delete statements
- [ ] OCR processing works (if configured)
- [ ] View details modal shows correct data
- [ ] Refresh button updates the list

## Support

If issues persist after following these steps:

1. Run the verification script locally:
   ```bash
   DEPLOYMENT_URL=https://cadgrouptools.onrender.com node scripts/verify-deployment.js
   ```

2. Check browser console for client-side errors (F12 → Console tab)

3. Review Render logs for server-side errors

4. Ensure all code changes are committed and pushed to GitHub

5. Verify auto-deploy is enabled in Render (Settings → Build & Deploy → Auto-Deploy)

## Summary of Changes

- ✅ Created `/api/statements` routes for CRUD operations
- ✅ Updated upload page to use real API instead of mock data
- ✅ Added proper error handling and loading states
- ✅ Created deployment verification script
- ✅ Documented all required environment variables
- ✅ Provided comprehensive troubleshooting guide

The accounting upload page should now have fully functional delete and view operations in production.