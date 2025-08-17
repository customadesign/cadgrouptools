import { createClient } from '@supabase/supabase-js';

// Log initialization status
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE;

if (!SUPABASE_URL || SUPABASE_URL === 'https://placeholder.supabase.co') {
  console.warn('[Supabase] URL not configured or using placeholder. File operations will fall back to S3.');
}

if (!SUPABASE_SERVICE_ROLE || SUPABASE_SERVICE_ROLE === 'placeholder_key') {
  console.warn('[Supabase] Service role key not configured or using placeholder. File operations will fall back to S3.');
}

// Server-side client using service role key (more permissions)
// Only create client if environment variables are available and not placeholders
export const supabaseAdmin = 
  SUPABASE_URL && 
  SUPABASE_SERVICE_ROLE && 
  SUPABASE_URL !== 'https://placeholder.supabase.co' &&
  SUPABASE_SERVICE_ROLE !== 'placeholder_key'
    ? createClient(
        SUPABASE_URL,
        SUPABASE_SERVICE_ROLE,
        {
          auth: {
            autoRefreshToken: false,
            persistSession: false,
            detectSessionInUrl: false
          },
          global: {
            headers: {
              'x-client-info': 'cadgroup-portal'
            }
          }
        }
      )
    : null;

// Get the bucket name from server env
export const STORAGE_BUCKET = process.env.SUPABASE_BUCKET || 'cadgroup-uploads';

// Export initialization status for debugging
export const SUPABASE_STATUS = {
  isConfigured: !!supabaseAdmin,
  hasUrl: !!SUPABASE_URL && SUPABASE_URL !== 'https://placeholder.supabase.co',
  hasServiceRole: !!SUPABASE_SERVICE_ROLE && SUPABASE_SERVICE_ROLE !== 'placeholder_key',
  bucket: STORAGE_BUCKET
};

if (supabaseAdmin) {
  console.log('[Supabase] Admin client initialized successfully');
} else {
  console.log('[Supabase] Admin client not initialized - using S3 fallback');
}
