import { createBrowserClient } from '@supabase/ssr'

/**
 * Cria um cliente Supabase para uso no lado do cliente (browser).
 * Use este client em componentes 'use client' que precisam de acesso ao Supabase.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
