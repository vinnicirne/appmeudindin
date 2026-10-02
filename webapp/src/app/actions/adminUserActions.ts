'use server'

import { createClient } from '@/utils/supabase/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'

async function checkAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('NÃƒÂ£o autenticado.')

  const { data: userData } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (userData?.role !== 'admin') throw new Error('Acesso nÃƒÂ£o autorizado.')
  return supabase
}

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  if (!url || !serviceKey) {
    throw new Error('Chave de serviÃƒÂ§o do Supabase nÃƒÂ£o configurada.')
  }
  return createSupabaseClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  })
}

export async function createUserAction(formData: {
  name: string
  email: string
  phone?: string
  password?: string
  planStatus: 'active' | 'pending' | 'blocked'
  role: 'user' | 'admin'
}) {
  try {
    await checkAdmin()
    const adminSupabase = getAdminClient()

    const tempPassword = formData.password || ('Mdd#' + Math.random().toString(36).slice(-6) + '!')

    // 1. Cria usuÃƒÂ¡rio no Auth
    const { data: authData, error: authError } = await adminSupabase.auth.admin.createUser({
      email: formData.email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: {
        name: formData.name,
        phone: formData.phone || null
      }
    })

    if (authError) throw authError
    const newUserId = authData.user.id

    // 2. Garante/Atualiza registro na tabela public.users
    const { error: userTableError } = await adminSupabase
      .from('users')
      .upsert({
        id: newUserId,
        name: formData.name,
        email: formData.email,
        phone: formData.phone || null,
        plan_status: formData.planStatus,
        role: formData.role
      })

    if (userTableError) throw userTableError

    revalidatePath('/admin/users')
    revalidatePath('/admin/subscriptions')
    revalidatePath('/admin')

    return { 
      success: true, 
      userId: newUserId, 
      temporaryPassword: formData.password ? undefined : tempPassword 
    }
  } catch (err: any) {
    return { error: err.message || 'Erro ao criar novo usuÃƒÂ¡rio.' }
  }
}

export async function deleteUserAction(userId: string) {
  try {
    await checkAdmin()
    const adminSupabase = getAdminClient()

    // 1. Remove do Auth (trigger ou cascade remove de public.users)
    const { error: authError } = await adminSupabase.auth.admin.deleteUser(userId)
    if (authError) throw authError

    // 2. Remove de public.users por seguranÃƒÂ§a caso nÃƒÂ£o tenha cascade
    await adminSupabase.from('users').delete().eq('id', userId)

    revalidatePath('/admin/users')
    revalidatePath('/admin/subscriptions')
    revalidatePath('/admin')

    return { success: true }
  } catch (err: any) {
    return { error: err.message || 'Erro ao excluir usuÃƒÂ¡rio.' }
  }
}

export async function updateUserPlanStatusAction(userId: string, newStatus: 'active' | 'pending' | 'blocked') {
  try {
    await checkAdmin()
    const adminSupabase = getAdminClient()
    
    const { error } = await adminSupabase
      .from('users')
      .update({ plan_status: newStatus })
      .eq('id', userId)

    if (error) throw error

    revalidatePath('/admin/users')
    revalidatePath('/admin/subscriptions')
    revalidatePath('/admin')
    return { success: true }
  } catch (err: any) {
    return { error: err.message || 'Erro ao atualizar status do usuÃƒÂ¡rio.' }
  }
}

export async function updateUserRoleAction(userId: string, newRole: 'user' | 'admin') {
  try {
    await checkAdmin()
    const adminSupabase = getAdminClient()
    
    const { error } = await adminSupabase
      .from('users')
      .update({ role: newRole })
      .eq('id', userId)

    if (error) throw error

    revalidatePath('/admin/users')
    revalidatePath('/admin')
    return { success: true }
  } catch (err: any) {
    return { error: err.message || 'Erro ao alterar permissÃƒÂ£o do usuÃƒÂ¡rio.' }
  }
}

export async function updateUserTrialAction(userId: string, daysToAdd: number | null) {
  try {
    const supabase = await checkAdmin()
    
    let trialEndsAt = null;
    let newStatus = 'expired';

    if (daysToAdd !== null) {
      const date = new Date();
      date.setDate(date.getDate() + daysToAdd);
      trialEndsAt = date.toISOString();
      newStatus = 'trial';
    }
    
    const { error } = await supabase
      .from('users')
      .update({ trial_ends_at: trialEndsAt, plan_status: newStatus })
      .eq('id', userId)

    if (error) throw error

    revalidatePath('/admin/users')
    revalidatePath('/admin')
    return { success: true }
  } catch (err: any) {
    return { error: err.message || 'Erro ao atualizar perÃƒÂ­odo de teste.' }
  }
}

export async function saveAffiliateForUserAction(data: {
  userId: string
  code: string
  commissionType: 'fixed' | 'percentage'
  commissionValue: number
  pixKey?: string
  instagram?: string
  phone?: string
}) {
  try {
    await checkAdmin()
    const adminSupabase = getAdminClient()

    // 1. Busca dados do usuÃ¡rio
    const { data: targetUser, error: userErr } = await adminSupabase
      .from('users')
      .select('id, name, email, phone')
      .eq('id', data.userId)
      .single()

    if (userErr || !targetUser) return { error: 'Usuário não encontrado.' }

    const cleanCode = data.code.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '')
    if (!cleanCode) return { error: 'Código de afiliado inválido.' }

    // 2. Atualiza tabela users
    const { error: userUpdateErr } = await adminSupabase
      .from('users')
      .update({
        is_affiliate: true,
        affiliate_code: cleanCode
      })
      .eq('id', data.userId)

    if (userUpdateErr) {
      if (userUpdateErr.message?.includes('affiliate_code') || userUpdateErr.message?.includes('schema cache')) {
        return { error: 'As colunas de afiliado ainda nÃ£o foram criadas no Supabase. Execute o comando SQL no SQL Editor.' }
      }
      return { error: userUpdateErr.message }
    }

    // 3. Upsert na tabela affiliates para sincronizaÃ§Ã£o total
    const { error: affErr } = await adminSupabase
      .from('affiliates')
      .upsert({
        user_id: data.userId,
        name: targetUser.name || targetUser.email,
        code: cleanCode,
        commission_type: data.commissionType,
        commission_value: data.commissionValue,
        pix_key: data.pixKey || null,
        instagram: data.instagram || null,
        phone: data.phone || targetUser.phone || null,
        updated_at: new Date().toISOString()
      }, { onConflict: 'code' })

    if (affErr) return { error: affErr.message }

    revalidatePath('/admin/users')
    revalidatePath('/admin/affiliates')
    revalidatePath('/affiliate')
    return { success: true }
  } catch (err: any) {
    console.error('Erro ao salvar parceria de afiliado:', err)
    return { error: err.message || 'Erro ao salvar parceiro.' }
  }
}

export async function removeAffiliateForUserAction(userId: string) {
  try {
    await checkAdmin()
    const adminSupabase = getAdminClient()

    const { data: targetUser } = await adminSupabase
      .from('users')
      .select('affiliate_code')
      .eq('id', userId)
      .single()

    const oldCode = targetUser?.affiliate_code

    // 1. Remove status na tabela users
    await adminSupabase
      .from('users')
      .update({ is_affiliate: false, affiliate_code: null })
      .eq('id', userId)

    // 2. Remove registro na tabela affiliates
    if (oldCode) {
      await adminSupabase.from('affiliates').delete().eq('code', oldCode)
    }
    await adminSupabase.from('affiliates').delete().eq('user_id', userId)

    revalidatePath('/admin/users')
    revalidatePath('/admin/affiliates')
    revalidatePath('/affiliate')
    return { success: true }
  } catch (err: any) {
    return { error: err.message || 'Erro ao remover parceria.' }
  }
}
