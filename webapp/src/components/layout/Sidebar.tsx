import { createClient } from '@/utils/supabase/server'
import SidebarClient from './SidebarClient'

export async function Sidebar() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let isAdmin = false
  if (user) {
    const { data } = await supabase.from('users').select('role').eq('id', user.id).single()
    isAdmin = data?.role === 'admin'
  }

  return <SidebarClient isAdmin={isAdmin} />
}
