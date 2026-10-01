'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function saveBudgetAction(categoryId: string, amount: number) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) throw new Error('Usuário não autenticado')

    if (amount <= 0) {
      // Se for 0, remove a meta
      const { error } = await supabase
        .from('budgets')
        .delete()
        .eq('user_id', user.id)
        .eq('category_id', categoryId)

      if (error) throw error
    } else {
      // Usa upsert baseado na constraint UNIQUE(user_id, category_id)
      const { error } = await supabase
        .from('budgets')
        .upsert({
          user_id: user.id,
          category_id: categoryId,
          amount: amount,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id,category_id' })

      if (error) throw error
    }

    revalidatePath('/planning')
    return { success: true }
  } catch (err: any) {
    console.error('Erro ao salvar meta:', err)
    return { error: err.message || 'Erro ao salvar meta.' }
  }
}
