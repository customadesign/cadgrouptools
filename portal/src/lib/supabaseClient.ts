import { createClient } from '@supabase/supabase-js';

// Browser-safe client using public anon key
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false
    }
  }
);

// Get the bucket name (prefer public env var for client-side)
export const STORAGE_BUCKET = process.env.NEXT_PUBLIC_SUPABASE_BUCKET || 'cadgroup-uploads';
