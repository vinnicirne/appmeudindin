export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { adminMessaging } from '@/utils/firebase/firebaseAdmin';
import { createClient } from '@/utils/supabase/server';
import { createClient as createSupabaseAdminClient } from '@supabase/supabase-js';

// Basic rate limiting map (In a real app, use Redis)
const rateLimitMap = new Map<string, number>();

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const { data: userData } = await supabase.from('users').select('role').eq('id', user.id).single();
    if (userData?.role !== 'admin') {
      return NextResponse.json({ error: 'Permissão negada' }, { status: 403 });
    }

    // Rate Limiting (1 request per minute per user)
    const now = Date.now();
    const lastRequest = rateLimitMap.get(user.id);
    if (lastRequest && now - lastRequest < 60000) {
      return NextResponse.json({ error: 'Muitas requisições. Aguarde um minuto.' }, { status: 429 });
    }
    rateLimitMap.set(user.id, now);

    const { title, body } = await req.json();

    const t = String(title || '').trim();
    const b = String(body || '').trim();
    if (!t || !b || t.length > 100 || b.length > 500) {
      return NextResponse.json({ error: 'Payload inválido (título max 100, corpo max 500)' }, { status: 400 });
    }

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ error: 'Erro de configuração do servidor' }, { status: 500 });
    }

    const adminSupabase = createSupabaseAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const { data: users, error } = await adminSupabase
      .from('users')
      .select('id, fcm_token')
      .not('fcm_token', 'is', null)
      .eq('push_enabled', true);

    if (error) throw error;

    let sentCount = 0;
    let failCount = 0;

    if (!adminMessaging) {
      return NextResponse.json({ error: 'Serviço Firebase Admin (Push) não está configurado. Verifique as variáveis de ambiente.' }, { status: 500 });
    }

    if (users) {
      const tokens = users.map(u => u.fcm_token).filter(Boolean);
      if (tokens.length > 0) {
        // Send to all tokens
        const response = await adminMessaging.sendEachForMulticast({
          tokens,
          notification: { title: t, body: b },
          webpush: {
            fcmOptions: { link: '/' }
          }
        });
        sentCount = response.successCount;
        failCount = response.failureCount;
      }
    }

    return NextResponse.json({ success: true, sentCount, failCount });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
