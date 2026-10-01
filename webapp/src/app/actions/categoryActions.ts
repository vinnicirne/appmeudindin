'use server'

import { createClient } from '../../utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createCategoryAction(data: { id: string, label: string, icon: string, color: string }) {
  const supabase = await createClient()
  const { data: userData } = await supabase.auth.getUser()
  if (!userData?.user) return { error: 'Não autorizado' }

  const { error } = await supabase.from('categories').insert([data])
  if (error) return { error: error.message }
  
  revalidatePath('/', 'layout')
  return { success: true }
}

export async function updateCategoryAction(id: string, data: { label: string, icon: string, color: string }) {
  const supabase = await createClient()
  const { data: userData } = await supabase.auth.getUser()
  if (!userData?.user) return { error: 'Não autorizado' }

  const { error } = await supabase.from('categories').update(data).eq('id', id)
  if (error) return { error: error.message }

  revalidatePath('/', 'layout')
  return { success: true }
}

export async function deleteCategoryAction(id: string) {
  const supabase = await createClient()
  const { data: userData } = await supabase.auth.getUser()
  if (!userData?.user) return { error: 'Não autorizado' }

  // Verificar se há transações usando a categoria
  const { count } = await supabase.from('transactions').select('*', { count: 'exact', head: true }).eq('category_id', id)
  if (count && count > 0) {
    return { error: 'Não é possível excluir: existem transações usando esta categoria.' }
  }

  const { error } = await supabase.from('categories').delete().eq('id', id)
  if (error) return { error: error.message }

  revalidatePath('/', 'layout')
  return { success: true }
}

export async function getCategoriesAction() {
  const supabase = await createClient();
  const { data } = await supabase.from('categories').select('*').eq('is_active', true);
  return data;
}
