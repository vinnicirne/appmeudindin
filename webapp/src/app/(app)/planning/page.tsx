import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import PlanningClient from './PlanningClient'

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function PlanningPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  const adminClient = createSupabaseClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } })

  // Busca as metas personalizadas do usuário
  const { data: goals, error } = await adminClient
    .from('goals')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return <PlanningClient initialGoals={goals || []} />
}
