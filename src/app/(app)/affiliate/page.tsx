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

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!url || !serviceKey) {
    return <AffiliateClient name="Usuário" code="" totalSignups={0} totalSales={0} recentSignups={[]} isAffiliate={false} />
  }

  const admin = createAdminClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  // 1. Busca dados do usuário logado
  const { data: userData } = await admin
    .from('users')
    .select('id, name, full_name, email, is_affiliate, affiliate_code')
    .eq('id', user.id)
    .maybeSingle()

  // 2. Busca também na tabela affiliates se houver registro vinculado
  let affData = null
  if (userData?.affiliate_code) {
    const res = await admin
      .from('affiliates')
      .select('id, code, commission_type, commission_value, pix_key')
      .eq('code', userData.affiliate_code)
      .maybeSingle()
    affData = res.data
  } else {
    const res = await admin
      .from('affiliates')
      .select('id, code, commission_type, commission_value, pix_key')
      .eq('user_id', user.id)
      .maybeSingle()
    affData = res.data
  }

  const code = (userData?.affiliate_code || affData?.code || '').trim()
  const isAff = Boolean(userData?.is_affiliate || affData || code)

  const displayName = userData?.name || userData?.full_name || userData?.email || 'Usuário'

  if (!isAff || !code) {
    return (
      <AffiliateClient
        name={displayName}
        code=""
        totalSignups={0}
        totalSales={0}
        recentSignups={[]}
        isAffiliate={false}
      />
    )
  }

  const cleanCode = code.trim()
  const { data: allUsers } = await admin
    .from('users')
    .select('id, name, full_name, email, referred_by, plan_status, created_at')
    .ilike('referred_by', cleanCode)
    .order('created_at', { ascending: false })

  const signups = (allUsers || []).map(u => ({
    id: u.id,
    name: u.name || u.full_name || null,
    // mascara email para LGPD
    email: u.email
      ? u.email.replace(/^(.)(.*)(@.*)$/, (_, a, mid, domain) =>
          a + '*'.repeat(Math.min(mid.length, 5)) + domain
        )
      : null,
    plan_status: u.plan_status,
    created_at: u.created_at,
  }))

  const activeSales = signups.filter(u => u.plan_status === 'active')

  return (
    <AffiliateClient
      name={displayName}
      code={code}
      totalSignups={signups.length}
      totalSales={activeSales.length}
      recentSignups={signups.slice(0, 15)}
      isAffiliate={true}
      commissionType={affData?.commission_type}
      commissionValue={affData?.commission_value}
    />
  )
}
