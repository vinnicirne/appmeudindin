import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import PaywallClient from './PaywallClient'

export default async function PaywallPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/cadastro')
  }

  const { data: userData } = await supabase
    .from('users')
    .select('plan_status, name, email')
    .eq('id', user.id)
    .single()

  if (userData?.plan_status === 'active') {
    redirect('/')
  }

  // Busca todos os planos ativos configurados no /admin
  const { data: activePlans } = await supabase
    .from('plans')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true })

  const plans = activePlans && activePlans.length > 0 ? activePlans : [
    {
      id: 'default',
      name: 'Plano Anual Oficial',
      price: 29.00,
      interval: 'year',
      description: 'Acesso ilimitado a todas as ferramentas por 1 ano.',
      badge: 'MAIS POPULAR'
    }
  ]

  return (
    <PaywallClient
      userId={user.id}
      userEmail={userData?.email || user.email || ''}
      userName={userData?.name || ''}
      plans={plans}
    />
  )
}
