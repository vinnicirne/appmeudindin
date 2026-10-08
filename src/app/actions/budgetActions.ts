'use server'

import { createClient } from '@/utils/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  return createAdminClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } })
}

export async function saveBudgetAction(categoryId: string, amount: number) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) throw new Error('Usuário não autenticado')

    const admin = getAdminClient()

    if (amount <= 0) {
      const { error } = await admin
        .from('budgets')
        .delete()
        .eq('user_id', user.id)
        .eq('category_id', categoryId)

      if (error) throw error
      revalidatePath('/budgets')
      revalidatePath('/planning')
      return { success: true, data: null }
    } else {
      const { data, error } = await admin
        .from('budgets')
        .upsert({
          user_id: user.id,
          category_id: categoryId,
          amount: amount,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id,category_id' })
        .select('id, category_id, amount')
        .single()

      if (error) throw error
      revalidatePath('/budgets')
      revalidatePath('/planning')
      return { success: true, data }
    }
  } catch (err: any) {
    console.error('Erro ao salvar teto de gastos:', err)
    return { error: err.message || 'Erro ao salvar teto de gastos.' }
  }
}
