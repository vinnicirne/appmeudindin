import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import BudgetsClient from './BudgetsClient'

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function BudgetsPage() {
  const supabase = await createClient()
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  const adminClient = createSupabaseClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } })
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: transactions } = await supabase
    .from('transactions')
    .select('*')
    .eq('user_id', user.id)
    .order('date', { ascending: true })

  const { data: categories } = await adminClient.from('categories').select('*').eq('is_active', true)
  const { data: budgets } = await supabase
    .from('budgets')
    .select('*')
    .eq('user_id', user.id)

  return <BudgetsClient dbCategories={categories || []} transactions={transactions || []} budgets={budgets || []} />
}
