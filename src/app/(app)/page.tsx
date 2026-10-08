import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import HomeClient from './HomeClient'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // RSC agora retorna apenas a casca da Home.
  // Os dados pesados serão injetados e cacheados pelo React Query no Cliente
  return <HomeClient />
}
