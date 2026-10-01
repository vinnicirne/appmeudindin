import { NextResponse } from 'next/server';
import { adminMessaging } from '@/utils/firebase/firebaseAdmin';
import { createClient } from '@/utils/supabase/server';
import { createClient as createSupabaseAdminClient } from '@supabase/supabase-js';

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const { data: userData } = await supabase.from('users').select('role').eq('id', user.id).single();
    if (userData?.role !== 'admin') {
      return NextResponse.json({ error: 'Permissão negada' }, { status: 403 });
    }

    const { title, body } = await req.json();

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

    if (adminMessaging && users) {
      const tokens = users.map(u => u.fcm_token).filter(Boolean);
      if (tokens.length > 0) {
        // Send to all tokens
        const response = await adminMessaging.sendEachForMulticast({
          tokens,
          notification: { title, body },
          webpush: {
            fcmOptions: { link: '/' }
          }
        });
        sentCount = response.successCount;
      }
    }

    return NextResponse.json({ success: true, sentCount });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
