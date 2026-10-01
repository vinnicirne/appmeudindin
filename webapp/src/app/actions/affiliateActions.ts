'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@supabase/supabase-js'

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  if (!url || !serviceKey) {
    throw new Error('Missing Supabase env vars')
  }
  return createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  })
}

export async function getAffiliatesAction() {
  const supabase = getAdminClient()
  const { data, error } = await supabase.from('affiliates').select('*').order('created_at', { ascending: false })
  return { data, error: error?.message }
}

export async function createAffiliateAction(data: {
  name: string
  code: string
  commissionType: 'fixed' | 'percentage'
  commissionValue: number
  pixKey?: string
  instagram?: string
  phone?: string
}) {
  const supabase = getAdminClient()
  const { error } = await supabase.from('affiliates').insert({
    name: data.name,
    code: data.code,
    commission_type: data.commissionType,
    commission_value: data.commissionValue,
    pix_key: data.pixKey,
    instagram: data.instagram,
    phone: data.phone
  })

  revalidatePath('/admin/affiliates'); revalidatePath('/admin/users'); return { error: error?.message }
}

export async function deleteAffiliateAction(idOrCode: string) {
  try {
    const supabase = getAdminClient()
    // 1. Busca dados do afiliado
    const { data: aff } = await supabase
      .from('affiliates')
      .select('id, user_id, code')
      .or(`id.eq.${idOrCode},code.eq.${idOrCode}`)
      .limit(1)
      .maybeSingle()

    const code = aff?.code || idOrCode
    const userId = aff?.user_id

    // 2. Remove da tabela affiliates
    await supabase.from('affiliates').delete().or(`id.eq.${idOrCode},code.eq.${code}`)

    // 3. Atualiza tabela users se houver usuário vinculado
    if (userId) {
      await supabase.from('users').update({ is_affiliate: false, affiliate_code: null }).eq('id', userId)
    } else {
      await supabase.from('users').update({ is_affiliate: false, affiliate_code: null }).eq('affiliate_code', code)
    }

    revalidatePath('/admin/affiliates')
    revalidatePath('/admin/users')
    revalidatePath('/affiliate')
    return { success: true }
  } catch (err: any) {
    return { error: err.message || 'Erro ao excluir parceiro.' }
  }
}

export async function updateAffiliateAction(idOrCode: string, data: {
  name: string
  code: string
  commissionType: 'fixed' | 'percentage'
  commissionValue: number
  pixKey?: string
  instagram?: string
  phone?: string
}) {
  try {
    const adminSupabase = getAdminClient()
    const cleanCode = data.code.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '')

    // 1. Busca se o registro já existe por id, user_id ou code
    const { data: existingAff } = await adminSupabase
      .from('affiliates')
      .select('id, user_id, code')
      .or(`id.eq.${idOrCode},code.eq.${idOrCode},code.eq.${cleanCode}`)
      .limit(1)
      .maybeSingle()

    const affiliateId = existingAff?.id
    const userId = existingAff?.user_id || idOrCode

    if (affiliateId) {
      // Atualiza registro existente
      const { error: updateErr } = await adminSupabase.from('affiliates').update({
        name: data.name,
        code: cleanCode,
        commission_type: data.commissionType,
        commission_value: data.commissionValue,
        pix_key: data.pixKey || null,
        instagram: data.instagram || null,
        phone: data.phone || null,
        updated_at: new Date().toISOString()
      }).eq('id', affiliateId)

      if (updateErr) throw updateErr
    } else {
      // Insere novo registro vinculado
      const { error: insertErr } = await adminSupabase.from('affiliates').insert({
        user_id: userId,
        name: data.name,
        code: cleanCode,
        commission_type: data.commissionType,
        commission_value: data.commissionValue,
        pix_key: data.pixKey || null,
        instagram: data.instagram || null,
        phone: data.phone || null
      })

      if (insertErr) throw insertErr
    }

    // 2. Atualiza a tabela users se for um usuário do sistema
    await adminSupabase
      .from('users')
      .update({
        is_affiliate: true,
        affiliate_code: cleanCode
      })
      .or(`id.eq.${userId},affiliate_code.eq.${cleanCode}`)

    // Se o código mudou, atualiza referências no users
    if (existingAff?.code && existingAff.code !== cleanCode) {
      await adminSupabase
        .from('users')
        .update({ affiliate_code: cleanCode })
        .eq('affiliate_code', existingAff.code)
    }

    revalidatePath('/admin/affiliates')
    revalidatePath('/admin/users')
    revalidatePath('/affiliate')
    return { success: true }
  } catch (err: any) {
    console.error('[updateAffiliateAction] Erro ao salvar:', err)
    return { error: err.message || 'Erro ao salvar alterações do parceiro.' }
  }
}

export async function getMyAffiliateDataAction() {
  try {
    const { createClient } = await import('@/utils/supabase/server')
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Nao autenticado' }

    const admin = getAdminClient()

    // Busca dados do usuario afiliado
    const { data: userData, error: userErr } = await admin
      .from('users')
      .select('id, name, email, is_affiliate, affiliate_code')
      .eq('id', user.id)
      .single()

    if (userErr || !userData?.is_affiliate || !userData?.affiliate_code) {
      return { error: 'Voce nao e um afiliado ativo.' }
    }

    const code = userData.affiliate_code

    // Cadastros via este codigo
    const { data: signups } = await admin
      .from('users')
      .select('id, name, email, plan_status, created_at')
      .eq('referred_by', code)
      .order('created_at', { ascending: false })

    const allSignups = signups || []
    const activeSales = allSignups.filter(u => u.plan_status === 'active')

    return {
      code,
      name: userData.name,
      email: userData.email,
      totalSignups: allSignups.length,
      totalSales: activeSales.length,
      recentSignups: allSignups.slice(0, 10)
    }
  } catch (err: any) {
    return { error: err.message || 'Erro ao buscar dados de afiliado.' }
  }
}
