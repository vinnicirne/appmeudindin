import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { AdminOverviewDashboard, OverviewMetrics, UserMetric, PlanMetric } from './AdminOverviewDashboard'

export default async function AdminPage() {
  let supabase
  try {
    supabase = await createClient()
  } catch {
    return (
      <main className="flex-1 p-6 flex items-center justify-center">
        <div className="text-center space-y-4 max-w-md">
          <h1 className="text-2xl font-bold text-destructive">Configuração Incompleta</h1>
          <p className="text-muted-foreground">
            As variáveis de ambiente do Supabase não foram encontradas.
          </p>
        </div>
      </main>
    )
  }
  
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

  // Busca todos os usuários do banco para calcular métricas de visão geral
  const { data: usersData } = await supabase
    .from('users')
    .select('id, name, email, plan_status, created_at')
    .order('created_at', { ascending: false })

  const users: UserMetric[] = (usersData as UserMetric[]) || []

  // Busca todos os planos cadastrados
  const { data: plansData } = await supabase
    .from('plans')
    .select('id, name, price, interval')
    .eq('is_active', true)

  const plans: PlanMetric[] = (plansData as PlanMetric[]) || []

  const totalUsers = users.length
  const activeUsers = users.filter(u => u.plan_status === 'active').length
  const pendingUsers = users.filter(u => u.plan_status === 'pending' || !u.plan_status).length
  const inactiveUsers = totalUsers - activeUsers - pendingUsers

  const conversionRate = totalUsers > 0 ? Math.round((activeUsers / totalUsers) * 100) : 0
  const abandonmentRate = totalUsers > 0 ? Math.round((pendingUsers / totalUsers) * 100) : 0
  
  // Calcula a média de preço dos planos ativos para estimar receita se não soubermos exatamente qual plano o usuário tem.
  // Como simplificação e correção do mock, assumimos uma estimativa baseada no primeiro plano ativo ou na média.
  const averagePlanPrice = plans.length > 0 
    ? plans.reduce((acc, p) => acc + Number(p.price), 0) / plans.length 
    : 0

  const estimatedRevenue = activeUsers * averagePlanPrice

  const metrics: OverviewMetrics = {
    totalUsers,
    activeUsers,
    pendingUsers,
    inactiveUsers,
    conversionRate,
    abandonmentRate,
    estimatedRevenue,
    recentUsers: users,
    plans,
  }

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto w-full">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl md:text-3xl font-black tracking-tight text-foreground">
            Visão Geral
          </h1>
          <span className="text-[11px] font-bold bg-primary/10 text-primary px-2.5 py-0.5 rounded-full">
            Painel Executivo
          </span>
        </div>
        <p className="text-xs md:text-sm text-muted-foreground">
          Métricas de adesão, conversão de checkout no Mercado Pago e volume de assinantes em tempo real.
        </p>
      </div>

      <AdminOverviewDashboard metrics={metrics} />
    </div>
  )
}
