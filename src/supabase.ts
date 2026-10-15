import { createClient } from '@supabase/supabase-js'
// Only the public anon key is used here. Never put a service-role key in frontend code.
export const supabase = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY)
