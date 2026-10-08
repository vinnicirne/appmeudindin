'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createVaultAction(data: { name: string, goal_amount?: number, color?: string, icon?: string }) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Não autenticado')

    const { error } = await supabase
      .from('vaults')
      .insert({
        user_id: user.id,
        name: data.name,
        goal_amount: data.goal_amount || null,
        color: data.color || 'bg-blue-500',
        icon: data.icon || 'savings'
      })

    if (error) throw error

    revalidatePath('/vaults')
    revalidatePath('/')
    return { success: true }
  } catch (err: any) {
    return { error: err.message || 'Erro ao criar caixinha' }
  }
}

export async function updateVaultAction(id: string, data: { name: string, goal_amount?: number, color?: string, icon?: string }) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Não autenticado')

    const { error } = await supabase
      .from('vaults')
      .update({
        name: data.name,
        goal_amount: data.goal_amount || null,
        color: data.color,
        icon: data.icon,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) throw error

    revalidatePath('/vaults')
    return { success: true }
  } catch (err: any) {
    return { error: err.message || 'Erro ao atualizar caixinha' }
  }
}

export async function deleteVaultAction(id: string) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Não autenticado')

    const { error } = await supabase
      .from('vaults')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) throw error

    revalidatePath('/vaults')
    revalidatePath('/')
    return { success: true }
  } catch (err: any) {
    return { error: err.message || 'Erro ao excluir caixinha' }
  }
}

export async function addVaultTransactionAction(
  vaultId: string, 
  type: 'DEPOSIT' | 'WITHDRAWAL' | 'YIELD', 
  amount: number, 
  description?: string
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Não autenticado')

    if (amount <= 0) throw new Error('O valor deve ser maior que zero')

    const { error } = await supabase
      .from('vault_transactions')
      .insert({
        user_id: user.id,
        vault_id: vaultId,
        type,
        amount,
        description: description || null,
        date: new Date().toISOString()
      })

    if (error) throw error

    revalidatePath('/vaults')
    revalidatePath('/')
    return { success: true }
  } catch (err: any) {
    return { error: err.message || 'Erro ao registrar movimentação na caixinha' }
  }
}
