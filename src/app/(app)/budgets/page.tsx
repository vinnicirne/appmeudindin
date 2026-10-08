import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import BudgetsClient from './BudgetsClient'

export default async function BudgetsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth() - 5, 1)
  const startDate = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}-01`

  const [txRes, catRes, budgetRes] = await Promise.all([
    supabase
      .from('transactions')
      .select('id, amount, date, type, category_id')
      .eq('user_id', user.id)
      .eq('type', 'EXPENSE')
      .gte('date', startDate)
      .order('date', { ascending: true }),
    supabase.from('categories').select('id, slug, name, title, label, icon, color, is_active').eq('is_active', true),
    supabase.from('budgets').select('id, category_id, amount').eq('user_id', user.id),
  ])

  return (
    <BudgetsClient
      dbCategories={catRes.data || []}
      transactions={txRes.data || []}
      budgets={budgetRes.data || []}
    />
  )
}
