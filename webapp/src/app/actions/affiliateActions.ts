import { revalidatePath } from 'next/cache'
'use server'

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

export async function deleteAffiliateAction(id: string) {
  const supabase = getAdminClient()
  const { error } = await supabase.from('affiliates').delete().eq('id', id)
  revalidatePath('/admin/affiliates'); revalidatePath('/admin/users'); return { error: error?.message }
}

export async function updateAffiliateAction(id: string, data: {
  name: string
  code: string
  commissionType: 'fixed' | 'percentage'
  commissionValue: number
  pixKey?: string
  instagram?: string
  phone?: string
}) {
  const adminSupabase = getAdminClient()
  const { error } = await adminSupabase.from('affiliates').update({
    name: data.name,
    code: data.code,
    commission_type: data.commissionType,
    commission_value: data.commissionValue,
    pix_key: data.pixKey,
    instagram: data.instagram,
    phone: data.phone
  }).eq('id', id)

  revalidatePath('/admin/affiliates'); revalidatePath('/admin/users'); return { error: error?.message }
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
