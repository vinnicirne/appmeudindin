import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import GraphicsClient from './GraphicsClient'

export default async function GraphicsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  return <GraphicsClient />
}
