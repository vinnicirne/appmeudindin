import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import HomeClient from './HomeClient'

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function Home() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Busca todas as transações do usuário
  const { data: categories } = await supabase.from('categories').select('*').eq('is_active', true)
  const { data: transactions } = await supabase
    .from('transactions')
    .select('*')
    .eq('user_id', user.id)
    .order('date', { ascending: false })

  return <HomeClient dbCategories={categories || []} transactions={transactions || []} />
}
