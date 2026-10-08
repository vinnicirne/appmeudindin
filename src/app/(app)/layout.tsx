import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { Sidebar } from "@/components/layout/Sidebar";
import { BottomNav } from "@/components/layout/BottomNav";
import { Header } from "@/components/layout/Header";
import { PushNotificationPrompt } from "@/components/ui/PushNotificationPrompt";
import { FloatingActionButton } from "@/components/ui/FloatingActionButton";
import { SwipeNavigation } from "@/components/layout/SwipeNavigation";
import { AppLockGate } from "@/components/layout/AppLockGate";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/login')
  }

  const { data: userData } = await supabase
    .from('users')
    .select('plan_status, trial_ends_at, role')
    .eq('id', user.id)
    .maybeSingle()

  if (userData && userData.role !== 'admin') {
    const status = userData.plan_status;
    const trialEndsAt = userData.trial_ends_at ? new Date(userData.trial_ends_at) : null;
    const now = new Date();

    if (status === 'blocked' || status === 'expired') {
      redirect('/paywall')
    } else if (status === 'trial') {
      if (!trialEndsAt || trialEndsAt < now) {
        redirect('/paywall')
      }
    } else if (status !== 'active') {
      redirect('/paywall')
    }
  }

  return (
    <AppLockGate>
      <div className="flex flex-col sm:flex-row min-h-screen w-full bg-background">
        <PushNotificationPrompt />
        <Sidebar />
        <div className="flex-1 flex flex-col min-h-0 overflow-y-auto pb-20 sm:pb-0">
          <Header />
          <SwipeNavigation>
            {children}
          </SwipeNavigation>
        </div>
        <BottomNav />
        <FloatingActionButton />
      </div>
    </AppLockGate>
  );
}
