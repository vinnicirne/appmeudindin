import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import PaywallClient from './PaywallClient'

/**
 * Paywall — Server Component
 * Busca os dados do usuário logado e os dados do plano ativo no banco de dados.
 */
export default async function PaywallPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Se não estiver logado, manda para o cadastro (início do funil)
  if (!user) {
    redirect('/cadastro')
  }

  // Se já está ativo, não precisa do paywall
  const { data: userData } = await supabase
    .from('users')
    .select('plan_status, name, email')
    .eq('id', user.id)
    .single()

  if (userData?.plan_status === 'active') {
    redirect('/')
  }

  // Busca o plano ativo configurado no /admin
  const { data: activePlans } = await supabase
    .from('plans')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true })

  const plans = activePlans && activePlans.length > 0 ? activePlans : [{
    id: 'default',
    name: 'Plano Anual',
    price: 29.00,
    interval: 'year'
  }]

  return (
    <PaywallClient
      userId={user.id}
      userEmail={userData?.email || user.email || ''}
      userName={userData?.name || ''}
      plans={plans}
    />
  )
}

