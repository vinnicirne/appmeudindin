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

  // Verifica se e afiliado
  const { data: userData } = await admin
    .from('users')
    .select('id, name, email, is_affiliate, affiliate_code')
    .eq('id', user.id)
    .single()

  if (!userData?.is_affiliate || !userData?.affiliate_code) {
    redirect('/')
  }

  const code = userData.affiliate_code

  // Busca indicados
  const { data: signups } = await admin
    .from('users')
    .select('id, name, email, plan_status, created_at')
    .eq('referred_by', code)
    .order('created_at', { ascending: false })

  const allSignups = signups || []
  const activeSales = allSignups.filter(u => u.plan_status === 'active')

  return (
    <AffiliateClient
      name={userData.name || userData.email || 'Afiliado'}
      code={code}
      totalSignups={allSignups.length}
      totalSales={activeSales.length}
      recentSignups={allSignups.slice(0, 15)}
    />
  )
}
