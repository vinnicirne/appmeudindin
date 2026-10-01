import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { AdminSubscriptionsClient } from './AdminSubscriptionsClient'
import { getSubscriptionsAction } from '@/app/actions/adminSubscriptionActions'

export default async function AdminSubscriptionsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: userData } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (userData?.role !== 'admin') {
    redirect('/')
  }

  const subscriptions = await getSubscriptionsAction()

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto w-full">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl md:text-3xl font-black tracking-tight text-foreground">
            Gerenciar Assinaturas
          </h1>
          <span className="text-[11px] font-bold bg-primary/10 text-primary px-2.5 py-0.5 rounded-full">
            {subscriptions.length} registros
          </span>
        </div>
        <p className="text-xs md:text-sm text-muted-foreground">
          Histórico e controle de renovações, faturamento e ativações de clientes.
        </p>
      </div>

      <AdminSubscriptionsClient initialSubscriptions={subscriptions} />
    </div>
  )
}
