import { createClient } from "@supabase/supabase-js";

// Supabase credentials loaded from environment variables (.env.local)
// NEXT_PUBLIC_ prefix makes these available in client-side code
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
