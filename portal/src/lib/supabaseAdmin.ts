import { createClient } from '@supabase/supabase-js';

// Server-side client using service role key (more permissions)
// Only create client if environment variables are available
export const supabaseAdmin = process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE
  ? createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
          detectSessionInUrl: false
        }
      }
    )
  : null;

// Get the bucket name from server env
export const STORAGE_BUCKET = process.env.SUPABASE_BUCKET || 'cadgroup-uploads';
