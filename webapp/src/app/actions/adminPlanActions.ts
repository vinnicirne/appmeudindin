'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { PlanItem, DEFAULT_PLANS } from '@/types/plan'

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
  return supabase
}

export async function getPlansAction(): Promise<PlanItem[]> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('plans')
      .select('*')
      .order('sort_order', { ascending: true })

    if (error || !data || data.length === 0) {
      return DEFAULT_PLANS
    }

    return data.map(p => ({
      ...p,
      features: Array.isArray(p.features) ? p.features : (typeof p.features === 'string' ? JSON.parse(p.features) : []),
      price: Number(p.price)
    }))
  } catch {
    return DEFAULT_PLANS
  }
}

export async function savePlanAction(plan: PlanItem) {
  try {
    const supabase = await checkAdmin()

    const { error } = await supabase
      .from('plans')
      .upsert({
        id: plan.id,
        name: plan.name,
        description: plan.description,
        price: plan.price,
        interval: plan.interval,
        features: plan.features,
        is_active: plan.is_active,
        badge: plan.badge,
        sort_order: plan.sort_order,
      })

    if (error) throw error

    revalidatePath('/admin/plans')
    revalidatePath('/admin')
    return { success: true }
  } catch (err: any) {
    return { error: err.message || 'Erro ao salvar plano.' }
  }
}

export async function togglePlanStatusAction(planId: string, currentStatus: boolean) {
  try {
    const supabase = await checkAdmin()

    const { error } = await supabase
      .from('plans')
      .update({ is_active: !currentStatus })
      .eq('id', planId)

    if (error) throw error

    revalidatePath('/admin/plans')
    revalidatePath('/admin')
    return { success: true }
  } catch (err: any) {
    return { error: err.message || 'Erro ao alternar status do plano.' }
  }
}

export async function deletePlanAction(planId: string) {
  try {
    const supabase = await checkAdmin()

    const { error } = await supabase
      .from('plans')
      .delete()
      .eq('id', planId)

    if (error) throw error

    revalidatePath('/admin/plans')
    revalidatePath('/admin')
    return { success: true }
  } catch (err: any) {
    return { error: err.message || 'Erro ao excluir plano.' }
  }
}
