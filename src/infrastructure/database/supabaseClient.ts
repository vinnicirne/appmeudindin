import { createClient, SupabaseClient } from '@supabase/supabase-js';

// No Next.js app, usaríamos variáveis de ambiente públicas/privadas. 
// Para infraestrutura pura, abstraímos o client.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabaseClient: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey);
