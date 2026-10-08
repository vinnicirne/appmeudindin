import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import PlanningClient from './PlanningClient'

export default async function PlanningPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  return <PlanningClient />
}
