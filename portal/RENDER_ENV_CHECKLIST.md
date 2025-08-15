# Render Environment Variables Checklist

## Critical Environment Variables to Verify

Please ensure ALL of these environment variables are set in your Render dashboard at:
https://dashboard.render.com → Select "cadgrouptools" → Environment tab

### Required Variables

1. **NEXTAUTH_URL**
   - Value: `https://cadgrouptools.onrender.com`
   - ⚠️ NO trailing slash
   - This MUST match your deployment URL exactly

2. **NEXTAUTH_SECRET**
   - Generate with: `openssl rand -base64 32`
   - Or use the existing one from IMPORTANT_RENDER_SETUP.txt

3. **MONGODB_URI**
   - Your MongoDB connection string
   - Should already be set, but verify it's present
   - Format: `mongodb+srv://username:password@cluster.mongodb.net`

4. **DB_NAME**
   - Value: `cadtools` (or your database name)
   - This is appended to MONGODB_URI for the connection

5. **NODE_ENV**
   - Value: `production`
   - Already set in render.yaml but verify

6. **PORT**
   - Value: `10000`
   - Already set in render.yaml but verify

### Optional Variables (if using these features)

7. **S3 Variables** (for file uploads):
   - S3_REGION
   - S3_BUCKET_NAME
   - S3_ACCESS_KEY_ID
   - S3_SECRET_ACCESS_KEY
   - S3_ENDPOINT
   - S3_PUBLIC_READ

8. **Google Cloud Vision** (for OCR):
   - GOOGLE_PROJECT_ID
   - GOOGLE_APPLICATION_CREDENTIALS

9. **SendGrid** (for emails):
   - SENDGRID_API_KEY
   - SENDGRID_FROM_EMAIL
   - SENDGRID_FROM_NAME

## How to Add/Update Variables in Render

1. Go to https://dashboard.render.com
2. Select your service "cadgrouptools"
3. Click on "Environment" tab
4. Add or update each variable
5. Click "Save Changes"
6. The service will automatically redeploy

## Verification Steps After Deployment

1. Wait for deployment to complete (check Logs tab)
2. Visit https://cadgrouptools.onrender.com
3. Try to sign in with your credentials
4. Navigate to /proposals page
5. Check that proposals load correctly
6. Test creating/editing proposals

## Troubleshooting

If issues persist after setting environment variables:

1. Check Render logs for errors:
   - Go to Logs tab in Render dashboard
   - Look for connection errors or authentication failures

2. Verify MongoDB connection:
   - Check that MONGODB_URI is correct
   - Ensure database user has proper permissions
   - Check IP whitelist in MongoDB Atlas (should allow 0.0.0.0/0 for Render)

3. Clear browser cache and cookies:
   - Sometimes old session data can cause issues
   - Try incognito/private browsing mode

4. Check build logs:
   - Ensure the build completed without errors
   - Look for any missing dependencies

## Recent Fixes Applied

- ✅ Created missing `/proposals/[id]/edit` page
- ✅ Standardized MongoDB connection to use single method
- ✅ Fixed proposals page to use actual API instead of mock data
- ✅ Resolved database connection conflicts
- ✅ All changes pushed to GitHub and will auto-deploy

## Contact for Issues

If problems persist after verifying all environment variables, check:
- Render service logs
- Browser console for client-side errors
- Network tab for failed API requests