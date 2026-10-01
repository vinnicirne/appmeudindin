'use server'

import { createClient } from '../../utils/supabase/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  return createSupabaseClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  })
}

export async function createCategoryAction(data: { id: string, label: string, icon: string, color: string }) {
  const supabase = await createClient()
  const { data: userData } = await supabase.auth.getUser()
  if (!userData?.user) return { error: 'Não autorizado' }
  
  const { data: dbUser } = await supabase.from('users').select('role').eq('id', userData.user.id).single()
  if (dbUser?.role !== 'admin') return { error: 'Acesso negado' }

  const adminClient = getAdminClient()
  const { error } = await adminClient.from('categories').insert([data])
  if (error) return { error: error.message }
  
  revalidatePath('/', 'layout')
  return { success: true }
}

export async function updateCategoryAction(id: string, data: { label: string, icon: string, color: string }) {
  const supabase = await createClient()
  const { data: userData } = await supabase.auth.getUser()
  if (!userData?.user) return { error: 'Não autorizado' }
  
  const { data: dbUser } = await supabase.from('users').select('role').eq('id', userData.user.id).single()
  if (dbUser?.role !== 'admin') return { error: 'Acesso negado' }

  const adminClient = getAdminClient()
  const { error } = await adminClient.from('categories').update(data).eq('id', id)
  if (error) return { error: error.message }

  revalidatePath('/', 'layout')
  return { success: true }
}

export async function deleteCategoryAction(id: string) {
  const supabase = await createClient()
  const { data: userData } = await supabase.auth.getUser()
  if (!userData?.user) return { error: 'Não autorizado' }

  const { data: dbUser } = await supabase.from('users').select('role').eq('id', userData.user.id).single()
  if (dbUser?.role !== 'admin') return { error: 'Acesso negado' }

  const adminClient = getAdminClient()
  
  // Verificar se há transações usando a categoria
  const { count } = await adminClient.from('transactions').select('*', { count: 'exact', head: true }).eq('category_id', id)
  if (count && count > 0) {
    return { error: 'Não é possível excluir: existem transações usando esta categoria.' }
  }

  const { error } = await adminClient.from('categories').delete().eq('id', id)
  if (error) return { error: error.message }

  revalidatePath('/', 'layout')
  return { success: true }
}

export async function getCategoriesAction() {
  const adminClient = getAdminClient()
  const { data } = await adminClient.from('categories').select('*').eq('is_active', true)
  return data
}
