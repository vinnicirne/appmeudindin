import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import PlanningClient from './PlanningClient'

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function PlanningPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: transactions } = await supabase
    .from('transactions')
    .select('*')
    .eq('user_id', user.id)
    .order('date', { ascending: true })

  // Busca as metas do usuario
  const { data: categories } = await supabase.from('categories').select('*').eq('is_active', true)
  const { data: budgets } = await supabase
    .from('budgets')
    .select('*')
    .eq('user_id', user.id)

  return <PlanningClient dbCategories={categories || []} transactions={transactions || []} budgets={budgets || []} />
}

