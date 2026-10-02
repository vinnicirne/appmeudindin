
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import ProfileClient from './ProfileClient'

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Busca dados do perfil na tabela public.users
  const { data: userData } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()

  const displayName = userData?.name || user.user_metadata?.name || user.email?.split('@')[0] || 'Usuário'
  const email = user.email || ''
  const phone = userData?.phone || user.user_metadata?.phone || ''
  const role = userData?.role || 'user'
  const planStatus = userData?.plan_status || 'pending'
  const createdAt = userData?.created_at || user.created_at || ''

  return (
    <ProfileClient
      userId={user.id}
      displayName={displayName}
      email={email}
      phone={phone}
      role={role}
      planStatus={planStatus}
      createdAt={createdAt}
    />
  )
}
