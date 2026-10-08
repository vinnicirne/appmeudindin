import { requireAdmin, createAdminClient } from '@/utils/admin'
import { AdminOverviewDashboard, OverviewMetrics, UserMetric, PlanMetric } from './AdminOverviewDashboard'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function AdminPage() {
  await requireAdmin()

  const adminClient = createAdminClient()
  if (!adminClient) {
    return (
      <main className="p-6">
        <div className="bg-destructive/10 text-destructive p-4 rounded-xl font-bold">
          SUPABASE_SERVICE_ROLE_KEY não configurada. Impossível carregar métricas.
        </div>
      </main>
    )
  }

  // 1. Buscar métricas totais via queries COUNT
  const [{ count: totalUsers }, { count: activeUsers }, { count: pendingUsers }] = await Promise.all([
    adminClient.from('users').select('*', { count: 'exact', head: true }),
    adminClient.from('users').select('*', { count: 'exact', head: true }).eq('plan_status', 'active'),
    adminClient.from('users').select('*', { count: 'exact', head: true }).in('plan_status', ['pending', 'trial'])
  ])

  // 2. Buscar dados necessários
  const [plansRes, recentUsersRes] = await Promise.all([
    adminClient.from('plans').select('id, name, price, interval').eq('is_active', true),
    adminClient.from('users')
      .select('id, name, email, plan_status, is_affiliate, affiliate_code, created_at')
      .order('created_at', { ascending: false })
      .limit(30)
  ])

  // Contagem de afiliados 
  // Em vez de puxar toda base, contamos no server via query ou estimamos. 
  // Para precisão total, query head com is_affiliate = true:
  const { count: affiliateUsersCount } = await adminClient
    .from('users')
    .select('*', { count: 'exact', head: true })
    .eq('is_affiliate', true)

  const totUsers = totalUsers || 0
  const actUsers = activeUsers || 0
  const penUsers = pendingUsers || 0

  // Cálculo da Receita (Estimativa Simplificada)
  const plans = plansRes.data || []
  let estimatedRevenue = 0
  if (plans.length > 0) {
    // Usando o plano mais barato como estimativa conservadora
    const minPrice = Math.min(...plans.map(p => Number(p.price)))
    estimatedRevenue = actUsers * minPrice
  }

  const metrics: OverviewMetrics = {
    totalUsers: totUsers,
    activeUsers: actUsers,
    pendingUsers: penUsers,
    inactiveUsers: totUsers - actUsers - penUsers, // Past Due, Canceled, etc
    totalAffiliates: affiliateUsersCount || 0,
    estimatedRevenue,
    averagePlanPrice: plans.length ? Math.min(...plans.map(p => Number(p.price))) : 0
  }

  return (
    <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-black text-foreground tracking-tight mb-2">Visão Geral</h1>
          <p className="text-muted-foreground font-medium">Métricas e acompanhamento do sistema Meu DinDin.</p>
        </header>

        <AdminOverviewDashboard 
          metrics={metrics} 
          recentUsers={(recentUsersRes.data || []) as any[]} 
          plans={(plans || []) as any[]} 
        />
      </div>
    </main>
  )
}
