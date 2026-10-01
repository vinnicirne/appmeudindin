import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import AffiliateClient from './AffiliateClient'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function AffiliatePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  const admin = createAdminClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } })

  // 1. Busca dados do usuário logado
  const { data: userData } = await admin
    .from('users')
    .select('id, name, full_name, email, phone, is_affiliate, affiliate_code')
    .eq('id', user.id)
    .single()

  // 2. Busca também na tabela affiliates se houver registro vinculado
  const { data: affData } = await admin
    .from('affiliates')
    .select('id, code, commission_type, commission_value, pix_key')
    .or(`user_id.eq.${user.id},code.eq.${userData?.affiliate_code || 'NONE'}`)
    .limit(1)
    .maybeSingle()

  const isAff = Boolean(userData?.is_affiliate || affData || userData?.affiliate_code)
  const code = userData?.affiliate_code || affData?.code

  if (!isAff || !code) {
    redirect('/')
  }

  // 3. Busca todos os usuários indicados (com matching insensível a maiúsculas/minúsculas)
  const { data: allUsers } = await admin
    .from('users')
    .select('id, name, full_name, email, referred_by, plan_status, created_at')
    .not('referred_by', 'is', null)
    .order('created_at', { ascending: false })

  const cleanCode = code.trim().toLowerCase()
  const signups = (allUsers || []).filter(u => 
    u.referred_by && u.referred_by.trim().toLowerCase() === cleanCode
  )

  const activeSales = signups.filter(u => u.plan_status === 'active')

  return (
    <AffiliateClient
      name={userData?.name || userData?.full_name || userData?.email || 'Afiliado'}
      code={code}
      totalSignups={signups.length}
      totalSales={activeSales.length}
      recentSignups={signups.slice(0, 15)}
    />
  )
}
