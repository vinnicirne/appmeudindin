'use server'

import { createClient } from '@/utils/supabase/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'

async function checkAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('NÃ£o autenticado.')

  const { data: userData } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (userData?.role !== 'admin') throw new Error('Acesso nÃ£o autorizado.')
  return supabase
}

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  if (!url || !serviceKey) {
    throw new Error('Chave de serviÃ§o do Supabase nÃ£o configurada.')
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

    // 1. Cria usuÃ¡rio no Auth
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
    return { error: err.message || 'Erro ao criar novo usuÃ¡rio.' }
  }
}

export async function deleteUserAction(userId: string) {
  try {
    await checkAdmin()
    const adminSupabase = getAdminClient()

    // 1. Remove do Auth (trigger ou cascade remove de public.users)
    const { error: authError } = await adminSupabase.auth.admin.deleteUser(userId)
    if (authError) throw authError

    // 2. Remove de public.users por seguranÃ§a caso nÃ£o tenha cascade
    await adminSupabase.from('users').delete().eq('id', userId)

    revalidatePath('/admin/users')
    revalidatePath('/admin/subscriptions')
    revalidatePath('/admin')

    return { success: true }
  } catch (err: any) {
    return { error: err.message || 'Erro ao excluir usuÃ¡rio.' }
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
    return { error: err.message || 'Erro ao atualizar status do usuÃ¡rio.' }
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
    return { error: err.message || 'Erro ao alterar permissÃ£o do usuÃ¡rio.' }
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
    return { error: err.message || 'Erro ao atualizar perÃ­odo de teste.' }
  }
}

export async function toggleAffiliateAction(userId: string, makeAffiliate: boolean, affiliateCode?: string) {
  try {
    await checkAdmin()
    const adminSupabase = getAdminClient()

    // 1. Busca dados do usuário
    const { data: targetUser, error: userErr } = await adminSupabase
      .from('users')
      .select('id, name, email, phone, affiliate_code')
      .eq('id', userId)
      .single()

    if (userErr || !targetUser) throw new Error('Usuário não encontrado')

    if (makeAffiliate) {
      // Gera código único limpo baseado no primeiro nome ou código aleatório
      let cleanBase = targetUser.name 
        ? targetUser.name.toLowerCase().trim().replace(/[^a-z0-9]/g, '').slice(0, 8)
        : targetUser.email.split('@')[0].replace(/[^a-z0-9]/g, '').slice(0, 8)
      
      const code = affiliateCode || targetUser.affiliate_code || (cleanBase || ('aff' + Math.random().toString(36).slice(2, 6)))

      // 2. Atualiza tabela users
      const { error: updateErr } = await adminSupabase
        .from('users')
        .update({ is_affiliate: true, affiliate_code: code })
        .eq('id', userId)

      if (updateErr) {
        if (updateErr.message?.includes('affiliate_code') || updateErr.message?.includes('schema cache')) {
          return { error: 'As colunas de afiliado ainda não foram criadas no Supabase. Execute o comando SQL no SQL Editor.' }
        }
        throw updateErr
      }

      // 3. Garante que o afiliado apareça imediatamente no painel /admin/affiliates
      await adminSupabase.from('affiliates').upsert({
        name: targetUser.name || targetUser.email,
        code: code,
        phone: targetUser.phone || null,
        commission_type: 'percentage',
        commission_value: 30, // Padrão 30%
        user_id: userId
      }, { onConflict: 'code' })

    } else {
      const oldCode = targetUser.affiliate_code

      // 2. Remove da tabela users
      const { error: updateErr } = await adminSupabase
        .from('users')
        .update({ is_affiliate: false, affiliate_code: null })
        .eq('id', userId)

      if (updateErr) throw updateErr

      // 3. Remove do painel de afiliados
      if (oldCode) {
        await adminSupabase.from('affiliates').delete().eq('code', oldCode)
      }
      await adminSupabase.from('affiliates').delete().eq('user_id', userId)
    }

    revalidatePath('/admin/users')
    revalidatePath('/admin/affiliates')
    revalidatePath('/affiliate')
    return { success: true }
  } catch (err: any) {
    if (err?.message?.includes('affiliate_code') || err?.message?.includes('schema cache')) {
      return { error: 'As colunas de afiliado ainda não foram criadas no Supabase. Execute o comando SQL no SQL Editor.' }
    }
    return { error: err.message || 'Erro ao atualizar status de afiliado.' }
  }
}
