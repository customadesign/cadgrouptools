# Bank Statement Delete Functionality Fix

## Issue Description
The delete functionality for failed upload statements was not properly removing files from Supabase storage, only deleting database records. This caused orphaned files in Supabase storage.

## Root Cause
The DELETE endpoint in `/api/statements/[id]/route.ts` was only deleting:
1. MongoDB Statement record
2. MongoDB Transaction records
3. MongoDB File record

But it was NOT deleting the actual file from Supabase storage.

## Solution Implemented

### 1. Backend API Fix
Updated `/api/statements/[id]/route.ts` to:
- Import Supabase admin client
- Populate the `sourceFile` reference when fetching the statement
- Check if the file is stored in Supabase (`storageProvider === 'supabase'`)
- Delete the file from Supabase storage using the stored `path`
- Continue with database deletion even if Supabase deletion fails (to prevent orphaned DB records)
- Add proper error logging for debugging

### 2. Key Changes
```typescript
// Added import
import { supabaseAdmin, STORAGE_BUCKET } from '@/lib/supabaseAdmin';

// In DELETE function:
// 1. Populate sourceFile to get full file details
const statement = await Statement.findById(id).populate('sourceFile');

// 2. Delete from Supabase if applicable
if (fileDoc.storageProvider === 'supabase' && fileDoc.path && supabaseAdmin) {
  const { error } = await supabaseAdmin
    .storage
    .from(STORAGE_BUCKET)
    .remove([fileDoc.path]);
  // Handle error but continue with DB deletion
}
```

## Testing the Fix

### 1. Test Storage Connection
```bash
# Run the storage test endpoint (requires authentication)
curl https://cadgrouptools.onrender.com/api/test-storage
```

### 2. Test Deletion Script
```bash
# Test Supabase deletion capabilities
node scripts/test-supabase-delete.js
```

### 3. Manual Testing
1. Go to https://cadgrouptools.onrender.com/accounting/upload
2. Upload a test statement
3. Click the delete button on a failed or completed statement
4. Verify:
   - Statement disappears from the UI
   - No errors in the console
   - File is removed from Supabase storage

## Cleanup Scripts

### Remove Orphaned Files
For existing orphaned files in Supabase:
```bash
# Dry run to see what would be deleted
node scripts/cleanup-orphaned-files.js --dry-run

# Actually delete orphaned files
node scripts/cleanup-orphaned-files.js
```

## Environment Variables Required
Ensure these are set in your Render deployment:
- `SUPABASE_URL` or `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE` (service role key with full permissions)
- `SUPABASE_BUCKET` (default: 'cadgroup-uploads')

## Verification Steps
1. **Check Supabase Dashboard**:
   - Go to your Supabase project → Storage
   - Navigate to the `cadgroup-uploads` bucket
   - Check the `statements/` folder
   - Verify files are being deleted when statements are deleted

2. **Check Application Logs**:
   - Look for messages like:
     - "Attempting to delete file from Supabase: [path]"
     - "Successfully deleted file from Supabase: [path]"
   - Any error messages will include "Supabase file deletion error"

3. **Database Consistency**:
   - Run MongoDB queries to ensure no orphaned File records exist
   - Check that Statement and Transaction records are properly deleted

## Troubleshooting

### If deletion still doesn't work:
1. **Check Supabase RLS Policies**:
   - Ensure service role can delete files
   - Check bucket policies in Supabase dashboard

2. **Verify Environment Variables**:
   ```bash
   # In your deployment, check if variables are set
   echo $SUPABASE_URL
   echo $SUPABASE_SERVICE_ROLE
   echo $SUPABASE_BUCKET
   ```

3. **Check File Path Format**:
   - Files should be stored with paths like: `statements/2024/11/timestamp_filename.pdf`
   - Verify the path in the File document matches the actual Supabase path

4. **Test with Script**:
   ```bash
   node scripts/test-supabase-delete.js
   ```
   This will verify upload and delete permissions.

## Future Improvements
1. Add a background job to periodically clean orphaned files
2. Implement soft delete with a grace period before permanent deletion
3. Add file versioning for audit trails
4. Implement bulk delete operations for better performance

## Related Files
- `/src/app/api/statements/[id]/route.ts` - Main DELETE endpoint
- `/src/app/api/statements/upload/route.ts` - Upload handler
- `/src/models/File.ts` - File model with Supabase fields
- `/src/lib/supabaseAdmin.ts` - Supabase admin client
- `/scripts/test-supabase-delete.js` - Test script
- `/scripts/cleanup-orphaned-files.js` - Cleanup script