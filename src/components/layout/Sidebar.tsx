import { createClient } from '@/utils/supabase/server'
import SidebarClient from './SidebarClient'

export async function Sidebar() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let isAdmin = false
  let isAffiliate = false
  if (user) {
    const { data } = await supabase.from('users').select('role, is_affiliate').eq('id', user.id).single()
    isAdmin = data?.role === 'admin'
    isAffiliate = data?.is_affiliate === true
  }

  return <SidebarClient isAdmin={isAdmin} isAffiliate={isAffiliate} />
}
