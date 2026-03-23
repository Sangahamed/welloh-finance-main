import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

function initializeSupabase() {
    if (!supabaseUrl || !supabaseAnonKey) {
        console.error("CRITICAL: Les clés Supabase ne sont pas configurées. L'authentification et la persistance des données seront désactivées.");
        return null;
    }
    return createClient(supabaseUrl, supabaseAnonKey);
}

export const supabase = initializeSupabase();
