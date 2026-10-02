export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { adminMessaging } from '@/utils/firebase/firebaseAdmin';
import { createClient } from '@supabase/supabase-js';

export async function GET(req: Request) {
  try {
    const adminSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // 1. Buscar TODOS os usuários com token FCM ativo
    const { data: users, error: userError } = await adminSupabase
      .from('users')
      .select('id, fcm_token, push_enabled, plan_status, trial_ends_at')
      .not('fcm_token', 'is', null)
      .eq('push_enabled', true);

    if (userError) throw userError;
    if (!users || users.length === 0) {
      return NextResponse.json({ message: 'Nenhum usuário com push configurado.' });
    }

    // Obter data de hoje YYYY-MM-DD
    const today = new Date().toISOString().split('T')[0];

    // Buscar TODAS as transações pendentes de hoje
    const { data: pendingTx } = await adminSupabase
      .from('transactions')
      .select('id, description, type, amount, user_id')
      .eq('date', today)
      .eq('is_paid', false);

    // Buscar transações CADASTRADAS hoje (para ver se o usuário já engajou)
    const { data: todayCreatedTx } = await adminSupabase
      .from('transactions')
      .select('user_id')
      .gte('created_at', `${today}T00:00:00.000Z`);

    // Buscar Metas para notificar progresso
    const { data: goals } = await adminSupabase
      .from('goals')
      .select('id, user_id, title, target_amount, current_amount')
      .gt('current_amount', 0);

    let sentCount = 0;

    for (const user of users) {
      const userPendingTx = pendingTx?.filter(t => t.user_id === user.id) || [];
      const userIncomes = userPendingTx.filter(t => t.type === 'INCOME');
      const userExpenses = userPendingTx.filter(t => t.type === 'EXPENSE');
      const hasEngagedToday = todayCreatedTx?.some(t => t.user_id === user.id);
      
      const userGoals = goals?.filter(g => g.user_id === user.id) || [];

      let title = '';
      let body = '';
      let link = '/';

            let isTrialEnding = false;
      let isTrialExpired = false;

      if (user.plan_status === 'trial' && user.trial_ends_at) {
        const trialEnd = new Date(user.trial_ends_at);
        const now = new Date();
        const diffMs = trialEnd.getTime() - now.getTime();
        const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
        
        if (diffDays === 1) {
          isTrialEnding = true;
        } else if (diffDays <= 0) {
          isTrialExpired = true;
        }
      }

      // Regra 0: Teste Gr�tis
      if (isTrialExpired) {
        title = 'Seu teste acabou! ??';
        body = 'Seu per�odo de teste gratuito do Meu DinDin expirou. Assine agora para continuar tendo o controle financeiro na palma da m�o!';
        link = '/paywall';
      } else if (isTrialEnding) {
        title = '�ltimo dia de teste! ?';
        body = 'Amanh� o seu teste gr�tis encerra. Garanta seu plano agora para n�o perder o acesso aos seus dados!';
        link = '/paywall';
      }
      // Regra 1: Contas a pagar vencendo hoje (Urgente)
      if (userExpenses.length > 0) {
        title = 'Atenção ao seu Lançamento! 🚨';
        body = `Você tem ${userExpenses.length} conta(s) a pagar vencendo HOJE.`;
        link = '/transactions';
      } 
      // Regra 2: Dinheiro a receber hoje
      else if (userIncomes.length > 0) {
        title = 'Dinheiro na Conta! 🤑';
        body = `Você tem ${userIncomes.length} recebimento(s) previstos para HOJE.`;
        link = '/transactions';
      }
      // Regra 3: Se o usuário ainda não abriu o app hoje para registrar nada
      else if (!hasEngagedToday) {
        title = 'Não perca o controle! 📊';
        body = 'Você ainda não registrou nenhum gasto ou receita hoje. Que tal anotar agora?';
        link = '/add';
      }
      // Regra 4: Motivação de Meta (Metas que já passaram da metade)
      else if (userGoals.length > 0) {
        // Encontrar a primeira meta acima de 50%
        const closeGoal = userGoals.find(g => (g.current_amount / g.target_amount) >= 0.5);
        if (closeGoal) {
          const perc = Math.floor((closeGoal.current_amount / closeGoal.target_amount) * 100);
          title = 'Quase lá! 🎯';
          body = `Falta pouco! Você já atingiu ${perc}% da sua meta "${closeGoal.title}".`;
          link = '/planning';
        } else {
          // Fallback motivacional genérico
          title = 'Mantenha o foco! 🚀';
          body = 'Cada centavo guardado é um passo mais perto dos seus sonhos.';
          link = '/planning';
        }
      }

      if (title && adminMessaging) {
        try {
          await adminMessaging.send({
            token: user.fcm_token,
            notification: {
              title,
              body,
            },
            webpush: {
              fcmOptions: { link }
            }
          });
          sentCount++;
        } catch (e) {
          console.error(`Erro ao enviar push para usuário ${user.id}:`, e);
        }
      }
    }

    return NextResponse.json({ success: true, sentCount });
  } catch (error: any) {
    console.error('Cron erro:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
