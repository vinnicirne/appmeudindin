'use server'

import { getAdminClient } from './adminUserActions'

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