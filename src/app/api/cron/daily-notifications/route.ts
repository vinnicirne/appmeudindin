import { NextResponse } from 'next/server';
import { adminMessaging } from '@/utils/firebase/firebaseAdmin';
import { createClient } from '@supabase/supabase-js';

// Vercel Cron will call this without auth headers naturally if we don't block it, 
// but we should verify the request if using headers. We will keep it simple for now,
// or verify a basic secret if needed.

export async function GET(req: Request) {
  try {
    const adminSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Get today's date formatted as YYYY-MM-DD
    const today = new Date().toISOString().split('T')[0];

    // Find pending transactions due today
    const { data: transactions, error: txError } = await adminSupabase
      .from('transactions')
      .select('id, description, type, amount, user_id')
      .eq('date', today)
      .eq('is_paid', false);

    if (txError) throw txError;

    if (!transactions || transactions.length === 0) {
      return NextResponse.json({ message: 'Nenhuma transação pendente para hoje.' });
    }

    // Group by user_id
    const userMap = new Map<string, any[]>();
    for (const tx of transactions) {
      if (!userMap.has(tx.user_id)) {
        userMap.set(tx.user_id, []);
      }
      userMap.get(tx.user_id)!.push(tx);
    }

    // Fetch users who have FCM tokens
    const userIds = Array.from(userMap.keys());
    const { data: users, error: userError } = await adminSupabase
      .from('users')
      .select('id, fcm_token, push_enabled')
      .in('id', userIds)
      .not('fcm_token', 'is', null)
      .eq('push_enabled', true);

    if (userError) throw userError;

    let sentCount = 0;

    // Send notifications
    for (const user of users || []) {
      const userTx = userMap.get(user.id) || [];
      const incomes = userTx.filter(t => t.type === 'INCOME');
      const expenses = userTx.filter(t => t.type === 'EXPENSE');

      let title = '';
      let body = '';

      if (expenses.length > 0) {
        title = 'Atenção ao seu Lançamento!';
        body = Você tem  conta(s) a pagar vencendo HOJE.;
      } else if (incomes.length > 0) {
        title = 'Dinheiro na Conta!';
        body = Você tem  recebimento(s) previstos para HOJE.;
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
              fcmOptions: {
                link: '/transactions'
              }
            }
          });
          sentCount++;
        } catch (e) {
          console.error(Erro ao enviar push para usuário :, e);
        }
      }
    }

    return NextResponse.json({ success: true, sentCount });
  } catch (error: any) {
    console.error('Cron erro:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
