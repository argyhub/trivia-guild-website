import { createClient } from "@supabase/supabase-js";

// Supabase credentials loaded from environment variables
// This client uses the SERVICE ROLE KEY, which BYPASSES Row Level Security (RLS).
// NEVER use this client in public-facing code or client components.
// ONLY use this in secure Server Actions or API routes.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
