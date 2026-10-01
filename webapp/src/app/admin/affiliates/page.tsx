import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import AffiliatesClient from './AffiliatesClient'

export default async function AffiliatesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: userData } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (userData?.role !== 'admin') {
    redirect('/')
  }

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const adminClient = (serviceKey && supabaseUrl)
    ? createSupabaseClient(supabaseUrl, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } })
    : supabase

  const { data: affiliatesData } = await adminClient
    .from('affiliates')
    .select('*')
    .order('created_at', { ascending: false })

  const { data: usersData } = await adminClient
    .from('users')
    .select('id, name, full_name, email, referred_by, plan_status, created_at')
    .not('referred_by', 'is', null)

  const { data: plansData } = await adminClient
    .from('plans')
    .select('price')
    .eq('is_active', true)
  
  const avgPlanPrice = (plansData && plansData.length > 0)
    ? plansData.reduce((acc, p) => acc + Number(p.price), 0) / plansData.length
    : 29.0;

  const affiliates = (affiliatesData || []).map(aff => {
    const signups = (usersData || []).filter(u => u.referred_by === aff.code)
    const sales = signups.filter(u => u.plan_status === 'active')
    
    const totalGenerated = sales.length * avgPlanPrice;
    const totalToPay = aff.commission_type === 'fixed' 
      ? sales.length * aff.commission_value
      : sales.length * (avgPlanPrice * (aff.commission_value / 100))

    return {
      ...aff,
      metrics: {
        signups: signups.length,
        sales: sales.length,
        totalGenerated,
        totalToPay
      },
      salesDetails: sales.map(s => ({
        id: s.id,
        name: s.name || s.full_name || s.email,
        email: s.email,
        date: s.created_at,
        commission: aff.commission_type === 'fixed' ? aff.commission_value : (avgPlanPrice * (aff.commission_value / 100))
      }))
    }
  })

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto w-full">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl md:text-3xl font-black tracking-tight text-foreground">
            Parceiros e Afiliados
          </h1>
          <span className="text-[11px] font-bold bg-primary/10 text-primary px-2.5 py-0.5 rounded-full">
            {affiliates.length}
          </span>
        </div>
        <p className="text-xs md:text-sm text-muted-foreground">
          Gerencie influenciadores, veja links e calcule os repasses das vendas confirmadas.
        </p>
      </div>

      <AffiliatesClient initialAffiliates={affiliates} />
    </div>
  )
}
