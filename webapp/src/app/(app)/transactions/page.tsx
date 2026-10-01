import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import TransactionsClient from './TransactionsClient'

export default async function TransactionsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: transactions } = await supabase
    .from('transactions')
    .select('*')
    .eq('user_id', user.id)
    .order('date', { ascending: false })

  return <TransactionsClient transactions={transactions || []} />
}
