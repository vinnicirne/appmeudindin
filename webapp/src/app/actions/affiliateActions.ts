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

  return { error: error?.message }
}

export async function deleteAffiliateAction(id: string) {
  const supabase = getAdminClient()
  const { error } = await supabase.from('affiliates').delete().eq('id', id)
  return { error: error?.message }
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

  return { error: error?.message }
}
