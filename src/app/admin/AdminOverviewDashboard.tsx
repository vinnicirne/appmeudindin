'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'

export interface UserMetric {
  id: string
  name: string | null
  email: string | null
  plan_status: string | null
  created_at: string
  is_affiliate?: boolean
  affiliate_code?: string | null
}

export interface PlanMetric {
  id: string
  name: string
  price: number
  interval: string
}

export interface OverviewMetrics {
  totalUsers: number
  activeUsers: number
  pendingUsers: number
  inactiveUsers: number
  totalAffiliates: number
  estimatedRevenue: number
  averagePlanPrice: number
}

interface Props {
  metrics: OverviewMetrics
  recentUsers: UserMetric[]
  plans: PlanMetric[]
}

function formatCurrency(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export function AdminOverviewDashboard({ metrics, recentUsers, plans }: Props) {
  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-card rounded-3xl p-6 shadow-sm border border-border">
          <div className="flex items-center gap-3 mb-4 text-primary">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="material-symbols-outlined">group</span>
            </div>
            <h3 className="font-bold text-sm text-foreground">Total de Usuários</h3>
          </div>
          <p className="text-3xl font-black text-foreground">{metrics.totalUsers}</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="bg-card rounded-3xl p-6 shadow-sm border border-border">
          <div className="flex items-center gap-3 mb-4 text-[#1db576]">
            <div className="w-10 h-10 rounded-full bg-[#1db576]/10 flex items-center justify-center">
              <span className="material-symbols-outlined">verified</span>
            </div>
            <h3 className="font-bold text-sm text-foreground">Assinantes Ativos</h3>
          </div>
          <p className="text-3xl font-black text-foreground">{metrics.activeUsers}</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-card rounded-3xl p-6 shadow-sm border border-border">
          <div className="flex items-center gap-3 mb-4 text-amber-500">
            <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center">
              <span className="material-symbols-outlined">schedule</span>
            </div>
            <h3 className="font-bold text-sm text-foreground">Pendentes/Trial</h3>
          </div>
          <p className="text-3xl font-black text-foreground">{metrics.pendingUsers}</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="bg-card rounded-3xl p-6 shadow-sm border border-border relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-bl-full -z-10" />
          <div className="flex items-center gap-3 mb-4 text-primary">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="material-symbols-outlined">payments</span>
            </div>
            <h3 className="font-bold text-sm text-foreground">Receita Estimada</h3>
          </div>
          <p className="text-2xl font-black text-foreground">{formatCurrency(metrics.estimatedRevenue)}<span className="text-xs text-muted-foreground ml-1">/mês</span></p>
          <p className="text-[10px] text-muted-foreground mt-1 leading-tight">Estimativa simplificada calculada com base no plano ativo de menor valor ({formatCurrency(metrics.averagePlanPrice)}).</p>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        <div className="lg:col-span-2 flex flex-col gap-6">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-card rounded-3xl shadow-sm border border-border overflow-hidden">
            <div className="p-6 border-b border-border/50 flex items-center justify-between">
              <div>
                <h2 className="font-bold text-lg text-foreground">Usuários Recentes</h2>
                <p className="text-xs text-muted-foreground mt-1">Exibindo os {recentUsers.length} últimos cadastros.</p>
              </div>
              <Link href="/admin/users" className="text-sm font-bold text-primary hover:underline bg-primary/5 px-4 py-2 rounded-xl">
                Ver todos
              </Link>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-muted text-muted-foreground uppercase text-[10px] font-bold tracking-wider">
                  <tr>
                    <th className="px-6 py-4">Usuário</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Data</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {recentUsers.map(u => {
                    const isActive = u.plan_status === 'active'
                    const isPending = u.plan_status === 'pending' || u.plan_status === 'trial' || !u.plan_status
                    
                    return (
                      <tr key={u.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-[10px]">
                              {(u.name || u.email || '?').slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-bold text-foreground text-xs">{u.name || 'Sem nome'}</p>
                              <p className="text-[10px] text-muted-foreground">{u.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {isActive && <span className="inline-block px-2 py-1 rounded-lg text-[10px] font-bold bg-[#1db576]/10 text-[#1db576]">Ativo</span>}
                          {isPending && <span className="inline-block px-2 py-1 rounded-lg text-[10px] font-bold bg-amber-500/10 text-amber-600">Pendente/Trial</span>}
                          {!isActive && !isPending && <span className="inline-block px-2 py-1 rounded-lg text-[10px] font-bold bg-muted text-muted-foreground uppercase">{u.plan_status || 'Inativo'}</span>}
                        </td>
                        <td className="px-6 py-4 text-xs font-medium text-muted-foreground">
                          {new Date(u.created_at).toLocaleDateString('pt-BR')}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </motion.div>
        </div>

        <div className="flex flex-col gap-6">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="bg-card rounded-3xl p-6 shadow-sm border border-border">
            <h2 className="font-bold text-lg text-foreground mb-6">Planos Ativos</h2>
            <div className="flex flex-col gap-3">
              {plans.map(p => (
                <div key={p.id} className="p-4 rounded-2xl border border-border/50 hover:border-primary/50 transition-colors flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-foreground text-sm">{p.name}</h4>
                    <p className="text-xs text-muted-foreground capitalize">{p.interval}</p>
                  </div>
                  <p className="font-black text-primary">{formatCurrency(Number(p.price))}</p>
                </div>
              ))}
              {plans.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">Nenhum plano cadastrado.</p>
              )}
            </div>
            <Link href="/admin/plans" className="block text-center text-xs font-bold text-primary mt-6 hover:underline">
              Gerenciar Planos →
            </Link>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-card rounded-3xl p-6 shadow-sm border border-border bg-gradient-to-br from-card to-primary/5">
            <div className="flex items-center gap-3 mb-2 text-primary">
              <span className="material-symbols-outlined text-2xl">handshake</span>
              <h2 className="font-bold text-lg text-foreground">Afiliados</h2>
            </div>
            <p className="text-[10px] uppercase font-bold text-muted-foreground mb-4">Parceiros Registrados</p>
            <p className="text-4xl font-black text-foreground mb-6">{metrics.totalAffiliates}</p>
            <Link href="/admin/affiliates" className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-primary text-primary-foreground font-bold shadow-sm hover:opacity-90">
              <span className="material-symbols-outlined text-sm">open_in_new</span>
              Gerenciar Afiliados
            </Link>
          </motion.div>
        </div>

      </div>
    </div>
  )
}
