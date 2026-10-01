import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import PlanningClient from './PlanningClient'

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
  const { data: budgets } = await supabase
    .from('budgets')
    .select('*')
    .eq('user_id', user.id)

  return <PlanningClient transactions={transactions || []} budgets={budgets || []} />
}
