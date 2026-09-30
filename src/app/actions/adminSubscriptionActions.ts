'use server'

import { createClient } from '@/utils/supabase/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'
import { SubscriptionItem } from '@/types/subscription'

async function checkAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Não autenticado.')

  const { data: userData } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (userData?.role !== 'admin') throw new Error('Acesso não autorizado.')
  return user
}

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  if (!url || !serviceKey) {
    throw new Error('Chave de serviço do Supabase não configurada.')
  }
  return createSupabaseClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  })
}

export async function getSubscriptionsAction(): Promise<SubscriptionItem[]> {
  try {
    await checkAdmin()
    const adminSupabase = getAdminClient()

    // 1. Busca os planos para obter valor dinâmico
    const { data: plansData } = await adminSupabase
      .from('plans')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
      .limit(1)
      .single()

    const currentPrice = plansData ? Number(plansData.price) : 29.00
    const currentPlanName = plansData?.name || 'Plano Anual Oficial'

    // 2. Busca todos os usuários via Service Role (ignora RLS)
    const { data: usersData, error: usersError } = await adminSupabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false })

    if (usersError || !usersData) {
      console.error('[getSubscriptionsAction] Erro ao buscar usuários:', usersError)
      return []
    }

    // 3. Mapeia os usuários em assinaturas
    const subscriptions: SubscriptionItem[] = usersData.map((u: any) => {
      const isApproved = u.plan_status === 'active'
      const status: SubscriptionItem['status'] = isApproved
        ? 'active'
        : u.plan_status === 'blocked'
        ? 'canceled'
        : 'pending'

      const createdDate = new Date(u.created_at || Date.now())
      const expiresDate = new Date(createdDate)
      expiresDate.setFullYear(expiresDate.getFullYear() + 1)

      return {
        id: `sub_${u.id.slice(0, 8)}`,
        userId: u.id,
        userName: u.name || 'Sem nome',
        userEmail: u.email || '—',
        planId: 'meu_dindin_anual',
        planName: currentPlanName,
        amount: currentPrice,
        status,
        interval: 'year',
        createdAt: u.created_at || new Date().toISOString(),
        expiresAt: isApproved ? expiresDate.toISOString() : null,
      }
    })

    return subscriptions
  } catch (err: any) {
    console.error('[getSubscriptionsAction] Exceção:', err)
    return []
  }
}

export async function updateSubscriptionStatusAction(userId: string, newStatus: 'active' | 'pending' | 'canceled') {
  try {
    await checkAdmin()
    const adminSupabase = getAdminClient()

    const dbPlanStatus = newStatus === 'active' ? 'active' : newStatus === 'canceled' ? 'blocked' : 'pending'

    const { error } = await adminSupabase
      .from('users')
      .update({ plan_status: dbPlanStatus })
      .eq('id', userId)

    if (error) throw error

    revalidatePath('/admin/subscriptions')
    revalidatePath('/admin/users')
    revalidatePath('/admin')
    return { success: true }
  } catch (err: any) {
    return { error: err.message || 'Erro ao atualizar assinatura.' }
  }
}
