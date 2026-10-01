"use client"

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export interface UserMetric {
  id: string
  name: string | null
  email: string | null
  plan_status: string | null
  created_at: string
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
  pendingUsers: number // Abandono / Pendentes
  inactiveUsers: number
  totalAffiliates: number
  conversionRate: number
  abandonmentRate: number
  estimatedRevenue: number
  recentUsers: UserMetric[]
  plans: PlanMetric[]
}

interface Props {
  metrics: OverviewMetrics
}

export function AdminOverviewDashboard({ metrics }: Props) {
  const [filter, setFilter] = useState<'all' | 'active' | 'pending'>('all')

  const filteredUsers = metrics.recentUsers.filter(u => {
    if (filter === 'active') return u.plan_status === 'active'
    if (filter === 'pending') return u.plan_status === 'pending' || !u.plan_status
    return true
  })

  const total = metrics.totalUsers || 1
  const activePct = Math.round((metrics.activeUsers / total) * 100)
  const pendingPct = Math.round((metrics.pendingUsers / total) * 100)
  const otherPct = Math.max(0, 100 - activePct - pendingPct)

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {/* 1. Total de Cadastros */}
        <Link href="/admin/users" className="block group">
          <Card className="border-border/60 bg-card hover:border-primary transition-all shadow-sm group-hover:shadow-md cursor-pointer h-full flex flex-col justify-between">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider group-hover:text-primary transition-colors flex items-center gap-1 whitespace-nowrap truncate">
                Total de Cadastros
                <span className="material-symbols-outlined text-xs opacity-0 group-hover:opacity-100 transition-opacity">arrow_forward</span>
              </CardTitle>
              <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-all shrink-0">
                <span className="material-symbols-outlined text-lg">group</span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-black text-foreground">{metrics.totalUsers}</div>
              <p className="text-[11px] text-muted-foreground mt-1 whitespace-nowrap truncate flex items-center gap-1">
                <span className="text-primary font-bold">100%</span> da base de leads
              </p>
            </CardContent>
          </Card>
        </Link>

        {/* 2. Assinantes Ativos */}
        <Link href="/admin/subscriptions" className="block group">
          <Card className="border-border/60 bg-card hover:border-[#1db576] transition-all shadow-sm group-hover:shadow-md cursor-pointer h-full flex flex-col justify-between">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider group-hover:text-[#1db576] transition-colors flex items-center gap-1 whitespace-nowrap truncate">
                Assinantes Ativos
                <span className="material-symbols-outlined text-xs opacity-0 group-hover:opacity-100 transition-opacity">arrow_forward</span>
              </CardTitle>
              <div className="w-8 h-8 rounded-lg bg-[#1db576]/10 text-[#1db576] flex items-center justify-center group-hover:bg-[#1db576] group-hover:text-white transition-all shrink-0">
                <span className="material-symbols-outlined text-lg">verified</span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-black text-[#1db576]">{metrics.activeUsers}</div>
              <p className="text-[11px] text-muted-foreground mt-1 whitespace-nowrap truncate flex items-center gap-1">
                <span className="text-[#1db576] font-bold">{metrics.conversionRate}%</span> taxa de conversão
              </p>
            </CardContent>
          </Card>
        </Link>

        {/* 3. Abandono / Pendentes */}
        <Link href="/admin/users" className="block group">
          <Card className="border-border/60 bg-card hover:border-amber-500 transition-all shadow-sm group-hover:shadow-md cursor-pointer h-full flex flex-col justify-between">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider group-hover:text-amber-500 transition-colors flex items-center gap-1 whitespace-nowrap truncate">
                Abandono / Pendentes
                <span className="material-symbols-outlined text-xs opacity-0 group-hover:opacity-100 transition-opacity">arrow_forward</span>
              </CardTitle>
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center group-hover:bg-amber-500 group-hover:text-white transition-all shrink-0">
                <span className="material-symbols-outlined text-lg">shopping_cart_checkout</span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-black text-amber-500">{metrics.pendingUsers}</div>
              <p className="text-[11px] text-muted-foreground mt-1 whitespace-nowrap truncate flex items-center gap-1">
                <span className="text-amber-500 font-bold">{metrics.abandonmentRate}%</span> abandonaram no checkout
              </p>
            </CardContent>
          </Card>
        </Link>

        {/* 4. Total de Afiliados */}
        <Link href="/admin/affiliates" className="block group">
          <Card className="border-border/60 bg-card hover:border-purple-500 transition-all shadow-sm group-hover:shadow-md cursor-pointer h-full flex flex-col justify-between">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider group-hover:text-purple-500 transition-colors flex items-center gap-1 whitespace-nowrap truncate">
                Total de Afiliados
                <span className="material-symbols-outlined text-xs opacity-0 group-hover:opacity-100 transition-opacity">arrow_forward</span>
              </CardTitle>
              <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-500 flex items-center justify-center group-hover:bg-purple-500 group-hover:text-white transition-all shrink-0">
                <span className="material-symbols-outlined text-lg">handshake</span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-black text-purple-600">{metrics.totalAffiliates || 0}</div>
              <p className="text-[11px] text-muted-foreground mt-1 whitespace-nowrap truncate">
                Parceiros ativos
              </p>
            </CardContent>
          </Card>
        </Link>

        {/* 5. Receita Estimada */}
        <Link href="/admin/plans" className="block group">
          <Card className="border-border/60 bg-card hover:border-emerald-500 transition-all shadow-sm group-hover:shadow-md cursor-pointer h-full flex flex-col justify-between">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider group-hover:text-emerald-500 transition-colors flex items-center gap-1 whitespace-nowrap truncate">
                Receita Estimada
                <span className="material-symbols-outlined text-xs opacity-0 group-hover:opacity-100 transition-opacity">arrow_forward</span>
              </CardTitle>
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center group-hover:bg-emerald-500 group-hover:text-white transition-all shrink-0">
                <span className="material-symbols-outlined text-lg">payments</span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-black text-foreground">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(metrics.estimatedRevenue)}
              </div>
              <p className="text-[11px] text-muted-foreground mt-1 whitespace-nowrap truncate">
                Média dos planos ativos
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-border/60 bg-card shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold text-foreground">Funil de Conversão & Checkout</CardTitle>
                <CardDescription className="text-xs">
                  Proporção de usuários convertidos vs abandono
                </CardDescription>
              </div>
              <span className="material-symbols-outlined text-muted-foreground">analytics</span>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-[#1db576]">Ativos: {activePct}%</span>
                <span className="text-amber-500">Abandono: {pendingPct}%</span>
              </div>
              <div className="h-4 w-full bg-muted rounded-full overflow-hidden flex p-0.5 gap-0.5">
                <div 
                  className="bg-[#1db576] h-full rounded-full transition-all duration-500"
                  style={{ width: `${activePct}%` }}
                />
                <div 
                  className="bg-amber-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${pendingPct}%` }}
                />
                {otherPct > 0 && (
                  <div 
                    className="bg-muted-foreground/30 h-full rounded-full transition-all duration-500"
                    style={{ width: `${otherPct}%` }}
                  />
                )}
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <Link href="/admin/users" className="block group">
                <div className="flex items-center justify-between p-3 rounded-xl bg-muted/40 border border-border/40 hover:border-primary/50 transition-all">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-primary shrink-0" />
                    <div>
                      <p className="text-xs font-bold text-foreground group-hover:text-primary transition-colors flex items-center gap-1">
                        1. Cadastro Iniciado (Landing Page)
                        <span className="material-symbols-outlined text-[12px] opacity-0 group-hover:opacity-100 transition-opacity">open_in_new</span>
                      </p>
                    </div>
                  </div>
                  <span className="font-bold text-sm text-foreground">{metrics.totalUsers}</span>
                </div>
              </Link>

              <Link href="/admin/users" className="block group">
                <div className="flex items-center justify-between p-3 rounded-xl bg-amber-500/5 border border-amber-500/20 hover:border-amber-500/50 transition-all">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-amber-500 shrink-0" />
                    <div>
                      <p className="text-xs font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                        2. Abandono no Mercado Pago
                        <span className="material-symbols-outlined text-[12px] opacity-0 group-hover:opacity-100 transition-opacity">open_in_new</span>
                      </p>
                    </div>
                  </div>
                  <span className="font-bold text-sm text-amber-600 dark:text-amber-400">{metrics.pendingUsers}</span>
                </div>
              </Link>

              <Link href="/admin/subscriptions" className="block group">
                <div className="flex items-center justify-between p-3 rounded-xl bg-[#1db576]/5 border border-[#1db576]/20 hover:border-[#1db576]/50 transition-all">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-[#1db576] shrink-0" />
                    <div>
                      <p className="text-xs font-bold text-[#1db576] flex items-center gap-1">
                        3. Pagamento Aprovado (Ativos)
                        <span className="material-symbols-outlined text-[12px] opacity-0 group-hover:opacity-100 transition-opacity">open_in_new</span>
                      </p>
                    </div>
                  </div>
                  <span className="font-bold text-sm text-[#1db576]">{metrics.activeUsers}</span>
                </div>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Gráfico 2: Distribuição dos Planos - AGORA DINÂMICO! */}
        <Card className="border-border/60 bg-card shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold text-foreground">Distribuição de Planos</CardTitle>
                <CardDescription className="text-xs">
                  Planos ativos cadastrados no banco
                </CardDescription>
              </div>
              <Link href="/admin/plans" className="text-xs text-primary hover:underline flex items-center gap-1 font-semibold">
                Gerenciar
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-center py-4">
              <div className="relative flex items-center justify-center">
                <div className="w-36 h-36 rounded-full border-8 border-primary/20 border-t-primary flex flex-col items-center justify-center text-center shadow-inner">
                  <span className="text-2xl font-black text-foreground">{metrics.activeUsers}</span>
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase">Ativos</span>
                </div>
              </div>
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {metrics.plans.map(plan => (
                <Link key={plan.id} href="/admin/plans" className="block group">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-card border border-border/80 hover:border-primary/50 transition-all">
                    <div className="flex items-center gap-3">
                      <div className="w-2.5 h-2.5 rounded-full bg-primary" />
                      <div>
                        <p className="text-xs font-bold text-foreground group-hover:text-primary transition-colors flex items-center gap-1">
                          {plan.name}
                          <span className="material-symbols-outlined text-[12px] opacity-0 group-hover:opacity-100 transition-opacity">open_in_new</span>
                        </p>
                        <p className="text-[11px] text-muted-foreground">R$ {Number(plan.price).toFixed(2)} / {plan.interval}</p>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}

              {metrics.plans.length === 0 && (
                <div className="p-3 text-center text-xs text-muted-foreground border border-dashed border-border rounded-xl">
                  Nenhum plano cadastrado.
                </div>
              )}

              <Link href="/admin/plans" className="block group mt-2">
                <div className="p-3 rounded-xl bg-muted/30 border border-dashed border-border hover:border-primary/40 flex items-center justify-between text-xs text-muted-foreground transition-all">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm text-primary">add_circle</span>
                    <span className="font-medium text-foreground">Adicionar Novo Plano</span>
                  </div>
                  <span className="text-[10px] font-medium bg-primary/10 text-primary px-2 py-0.5 rounded">Configurar</span>
                </div>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabela Permanece Igual */}
      <Card className="border-border/60 bg-card shadow-sm">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-base font-bold text-foreground">Usuários e Status de Checkout</CardTitle>
            </div>
            
            <div className="flex items-center gap-1.5 bg-muted/60 p-1 rounded-xl border border-border/40">
              <Button variant={filter === 'all' ? 'default' : 'ghost'} size="sm" onClick={() => setFilter('all')} className="text-xs h-7 rounded-lg">
                Todos ({metrics.totalUsers})
              </Button>
              <Button variant={filter === 'active' ? 'default' : 'ghost'} size="sm" onClick={() => setFilter('active')} className="text-xs h-7 rounded-lg text-[#1db576]">
                Ativos ({metrics.activeUsers})
              </Button>
              <Button variant={filter === 'pending' ? 'default' : 'ghost'} size="sm" onClick={() => setFilter('pending')} className="text-xs h-7 rounded-lg text-amber-500">
                Abandono ({metrics.pendingUsers})
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredUsers.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground text-xs">Nenhum usuário encontrado.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-border/60 text-muted-foreground font-semibold">
                    <th className="pb-3 pl-2">Usuário</th>
                    <th className="pb-3">E-mail</th>
                    <th className="pb-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {filteredUsers.map((u) => {
                    const isActive = u.plan_status === 'active'
                    const isPending = u.plan_status === 'pending' || !u.plan_status
                    
                    return (
                      <tr key={u.id} className="hover:bg-muted/30 transition-colors">
                        <td className="py-3.5 pl-2 font-medium text-foreground">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-[10px]">
                              {(u.name || u.email || 'U').slice(0, 2).toUpperCase()}
                            </div>
                            <span>{u.name || 'Sem nome'}</span>
                          </div>
                        </td>
                        <td className="py-3.5 text-muted-foreground">{u.email || '—'}</td>
                        <td className="py-3.5">
                          {isActive && (
                            <Badge className="bg-[#1db576]/15 text-[#1db576] border-[#1db576]/30 font-semibold text-[10px]">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#1db576] mr-1 inline-block" />
                              Plano Ativo
                            </Badge>
                          )}
                          {isPending && (
                            <Badge className="bg-amber-500/15 text-amber-600 border-amber-500/30 font-semibold text-[10px]">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mr-1 inline-block" />
                              Abandono / Pendente
                            </Badge>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
