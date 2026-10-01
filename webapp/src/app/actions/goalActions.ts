'use server'

import { createClient } from '@/utils/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  return createAdminClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } })
}

export async function createGoalAction(formData: {
  title: string
  targetAmount: number
  initialAmount?: number
  targetDate?: string | null
  icon?: string
  color?: string
}) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Não autenticado')

    const admin = getAdminClient()
    const { error } = await admin.from('goals').insert({
      user_id: user.id,
      title: formData.title,
      target_amount: formData.targetAmount,
      current_amount: formData.initialAmount || 0,
      target_date: formData.targetDate || null,
      icon: formData.icon || 'savings',
      color: formData.color || 'bg-emerald-500'
    })

    if (error) throw error

    revalidatePath('/planning')
    return { success: true }
  } catch (err: any) {
    console.error('Erro ao criar meta:', err)
    return { error: err.message || 'Erro ao criar meta.' }
  }
}

export async function updateGoalAction(goalId: string, formData: {
  title: string
  targetAmount: number
  targetDate?: string | null
  icon?: string
  color?: string
}) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Não autenticado')

    const admin = getAdminClient()
    const { error } = await admin.from('goals').update({
      title: formData.title,
      target_amount: formData.targetAmount,
      target_date: formData.targetDate || null,
      icon: formData.icon || 'savings',
      color: formData.color || 'bg-emerald-500',
      updated_at: new Date().toISOString()
    }).eq('id', goalId).eq('user_id', user.id)

    if (error) throw error

    revalidatePath('/planning')
    return { success: true }
  } catch (err: any) {
    console.error('Erro ao atualizar meta:', err)
    return { error: err.message || 'Erro ao atualizar meta.' }
  }
}

export async function updateGoalBalanceAction(goalId: string, deltaAmount: number) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Não autenticado')

    const admin = getAdminClient()
    const { data: goal, error: fetchErr } = await admin
      .from('goals')
      .select('current_amount')
      .eq('id', goalId)
      .eq('user_id', user.id)
      .single()

    if (fetchErr || !goal) throw new Error('Meta não encontrada')

    const newAmount = Math.max(0, Number(goal.current_amount || 0) + deltaAmount)

    const { error } = await admin.from('goals').update({
      current_amount: newAmount,
      updated_at: new Date().toISOString()
    }).eq('id', goalId).eq('user_id', user.id)

    if (error) throw error

    revalidatePath('/planning')
    return { success: true, newAmount }
  } catch (err: any) {
    console.error('Erro ao ajustar saldo da meta:', err)
    return { error: err.message || 'Erro ao atualizar saldo da meta.' }
  }
}

export async function deleteGoalAction(goalId: string) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Não autenticado')

    const admin = getAdminClient()
    const { error } = await admin.from('goals').delete().eq('id', goalId).eq('user_id', user.id)

    if (error) throw error

    revalidatePath('/planning')
    return { success: true }
  } catch (err: any) {
    console.error('Erro ao excluir meta:', err)
    return { error: err.message || 'Erro ao excluir meta.' }
  }
}
