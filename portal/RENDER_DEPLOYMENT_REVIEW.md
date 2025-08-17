# Render Deployment Configuration Review
## CADGroup Tools Portal - Statement Delete Fix

### Deployment URL
https://cadgrouptools.onrender.com

---

## 1. Environment Variables Configuration

### CRITICAL - Required for Delete Functionality

#### Supabase Storage Variables (MUST BE SET)
```
SUPABASE_URL=https://[your-project].supabase.co
SUPABASE_SERVICE_ROLE=[your-service-role-key]
SUPABASE_BUCKET=cadgroup-uploads
```

**IMPORTANT**: These variables are REQUIRED for the delete functionality to work properly. Without them:
- Files will NOT be deleted from Supabase storage
- Only database records will be removed
- This will cause orphaned files in storage

### Core Application Variables
```
NEXTAUTH_URL=https://cadgrouptools.onrender.com
NEXTAUTH_SECRET=[generated-secret]
MONGODB_URI=mongodb+srv://[connection-string]
DB_NAME=cadtools
NODE_ENV=production
PORT=10000
```

### Optional but Recommended
```
NEXT_PUBLIC_SUPABASE_URL=[same-as-SUPABASE_URL]
NEXT_PUBLIC_SUPABASE_ANON_KEY=[anon-key-if-needed]
```

---

## 2. Delete Functionality Implementation Review

### API Endpoint: `/api/statements/[id]` (DELETE Method)

#### Key Features Implemented:
1. **Supabase Storage Integration**
   - Imports `supabaseAdmin` client with service role permissions
   - Uses `STORAGE_BUCKET` constant for bucket name
   - Gracefully handles missing Supabase configuration

2. **File Deletion Process**
   - Populates `sourceFile` reference to get full file details
   - Checks if file is stored in Supabase (`storageProvider === 'supabase'`)
   - Attempts to delete file from Supabase storage
   - Continues with database deletion even if storage deletion fails
   - Comprehensive error logging for debugging

3. **Database Cleanup**
   - Deletes associated transactions
   - Deletes file record from MongoDB
   - Deletes statement record

#### Code Safety Features:
```typescript
// Null-safe Supabase client creation
export const supabaseAdmin = process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE
  ? createClient(...) 
  : null;

// Graceful handling of missing Supabase
if (fileDoc.storageProvider === 'supabase' && fileDoc.path && supabaseAdmin) {
  // Attempt deletion
}
```

---

## 3. Build and Deployment Settings

### Current Configuration (render.yaml)
```yaml
services:
  - type: web
    name: cadgroup-tools-portal
    runtime: node
    plan: free
    buildCommand: npm ci && npm run build
    startCommand: npm start
    healthCheckPath: /api/health/push
```

### Next.js Configuration (next.config.ts)
- TypeScript errors ignored during build (temporary)
- ESLint errors ignored during build (temporary)
- Image optimization disabled for Render
- Compression enabled
- Proper environment variable handling

---

## 4. CORS and Security Configuration

### Middleware Security Headers
```
Content-Security-Policy: Properly configured for Supabase
- connect-src includes https://*.supabase.co
- Allows necessary inline scripts and styles
- Restricts frame and object sources

X-Frame-Options: SAMEORIGIN
X-Content-Type-Options: nosniff
Strict-Transport-Security: Enabled with subdomains
```

### Rate Limiting
- Auth endpoints: 5 requests/minute
- Upload endpoints: 10 requests/minute
- General API: 100 requests/minute

### CORS for Supabase
The CSP headers allow connections to Supabase domains, ensuring:
- File uploads work properly
- File deletions can be executed
- Storage API calls are not blocked

---

## 5. Testing and Verification

### Test Scripts Available

#### 1. Test Supabase Delete
```bash
node scripts/test-supabase-delete.js
```
- Tests connection to Supabase
- Creates a test file
- Deletes the test file
- Verifies deletion

#### 2. Verify Deployment
```bash
node scripts/verify-deployment.js
```
- Checks all environment variables
- Tests API endpoints
- Verifies database connection

#### 3. Check Supabase Connection
```bash
node scripts/check-supabase.js
```
- Lists files in bucket
- Verifies permissions

### Manual Testing Steps
1. Navigate to https://cadgrouptools.onrender.com/accounting/upload
2. Upload a test statement
3. Wait for processing
4. Click delete button on the statement
5. Verify in Supabase dashboard that file is removed

---

## 6. Deployment Recommendations

### IMMEDIATE ACTIONS REQUIRED

#### 1. Set Supabase Environment Variables in Render
1. Go to https://dashboard.render.com
2. Select "cadgroup-tools-portal" service
3. Navigate to "Environment" tab
4. Add the following variables:
   - `SUPABASE_URL`: Your Supabase project URL
   - `SUPABASE_SERVICE_ROLE`: Your service role key (NOT anon key)
   - `SUPABASE_BUCKET`: cadgroup-uploads (or your bucket name)

#### 2. Verify Supabase Bucket Configuration
1. Log into Supabase dashboard
2. Go to Storage section
3. Ensure "cadgroup-uploads" bucket exists
4. Check bucket policies:
   - Service role should have full access
   - RLS policies should allow delete operations

#### 3. Test After Deployment
```bash
# From local machine with .env.local configured
npm run build
node scripts/test-supabase-delete.js
```

### CONFIGURATION CHECKLIST

- [ ] SUPABASE_URL environment variable set in Render
- [ ] SUPABASE_SERVICE_ROLE environment variable set in Render
- [ ] SUPABASE_BUCKET environment variable set (or using default)
- [ ] Supabase bucket exists and is accessible
- [ ] Service role key has delete permissions
- [ ] MongoDB connection is stable
- [ ] NEXTAUTH_URL matches deployment URL exactly
- [ ] No trailing slash on NEXTAUTH_URL

---

## 7. Monitoring and Debugging

### Log Messages to Watch For

#### Success Indicators:
```
"Attempting to delete file from Supabase: [path]"
"Successfully deleted file from Supabase: [path]"
"Statement and associated data deleted successfully"
```

#### Warning/Error Messages:
```
"Supabase file deletion error: [error]"
"Error deleting from Supabase storage: [error]"
"Failed to delete statement: [error]"
```

### Render Logs Access
1. Go to Render dashboard
2. Select your service
3. Click "Logs" tab
4. Filter by timestamp when testing delete

### Database Consistency Checks
```javascript
// Check for orphaned files (run in MongoDB console)
db.files.find({ 
  storageProvider: "supabase",
  _id: { $nin: db.statements.distinct("sourceFile") }
})
```

---

## 8. Rollback Plan

If the delete functionality causes issues:

1. **Quick Fix**: Remove Supabase deletion code
   - Comment out lines 207-228 in `/api/statements/[id]/route.ts`
   - This will revert to database-only deletion

2. **Environment Variable Removal**:
   - Remove or rename SUPABASE_SERVICE_ROLE to disable storage operations
   - The code will gracefully skip Supabase operations

3. **Full Rollback**:
   - Revert to previous Git commit
   - Redeploy from Render dashboard

---

## 9. Future Improvements

### Recommended Enhancements:
1. **Soft Delete Implementation**
   - Add `deletedAt` field to documents
   - Schedule cleanup after grace period

2. **Bulk Delete Operations**
   - Batch Supabase deletions for efficiency
   - Add admin bulk cleanup tools

3. **Storage Migration Tools**
   - Script to migrate from S3 to Supabase
   - Cleanup orphaned files in both systems

4. **Enhanced Monitoring**
   - Add Sentry error tracking for storage operations
   - Create storage usage dashboard
   - Set up alerts for failed deletions

5. **Backup Strategy**
   - Implement file archiving before deletion
   - Add recovery mechanism for accidental deletions

---

## 10. Support and Troubleshooting

### Common Issues and Solutions

#### Issue: Files not being deleted from Supabase
**Solution**: 
- Verify SUPABASE_SERVICE_ROLE is set correctly
- Check service role has delete permissions
- Ensure bucket name matches SUPABASE_BUCKET value

#### Issue: 404 errors on file deletion
**Solution**:
- File may already be deleted
- Check file path format matches storage structure
- Verify bucket exists in Supabase

#### Issue: Timeout errors during deletion
**Solution**:
- Check Supabase service status
- Verify network connectivity from Render
- Consider implementing retry logic

### Contact Information
For deployment issues:
1. Check Render service logs first
2. Run verification scripts locally
3. Review this documentation
4. Check Supabase dashboard for storage issues

---

## Summary

The delete functionality has been properly implemented with:
- Safe null checks for missing configuration
- Graceful error handling
- Comprehensive logging
- Database consistency maintenance
- No breaking changes to existing functionality

**The most critical requirement for deployment is setting the Supabase environment variables in Render.** Without these, the delete functionality will only remove database records, not the actual files from storage.

Once the environment variables are configured, the system will automatically start deleting files from Supabase storage when statements are deleted through the UI or API.