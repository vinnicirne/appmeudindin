export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { MercadoPagoConfig, Preference } from 'mercadopago';
import { createAdminClient } from '@/utils/supabase/admin';
import { createClient } from '@/utils/supabase/server';

/**
 * POST /api/register
 * Cria a conta do usuário no Supabase Auth + tabela users (incluindo phone/whatsapp),
 * faz login automático na sessão e retorna sucesso para o frontend navegar para o paywall/checkout.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { name, email, password, phone, referred_by } = body;

    // Validação
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Nome, e-mail e senha são obrigatórios.' },
        { status: 400 }
      );
    }

    const adminSupabase = createAdminClient();

    // 1. Cria usuário no Auth
    const { data: authData, error: authError } = await adminSupabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        name,
        phone: phone || null,
        referred_by: referred_by || null,
      },
    });

    if (authError || !authData.user) {
      if (authError?.message?.includes('already registered') || authError?.message?.includes('already been registered')) {
        return NextResponse.json(
          { error: 'Este e-mail já está cadastrado. Faça login para continuar.' },
          { status: 409 }
        );
      }
      throw new Error(authError?.message || 'Falha ao cadastrar usuário.');
    }

    const userId = authData.user.id;

    // 2. Garante registro na tabela public.users
    await adminSupabase
      .from('users')
      .upsert({
        id: userId,
        name,
        email,
        phone: phone || null,
        referred_by: referred_by || null,
        plan_status: 'pending',
      });

    // 3. Fazer login automático para criar a sessão (cookies)
    try {
      const supabaseClient = await createClient();
      await supabaseClient.auth.signInWithPassword({ email, password });
    } catch (authError) {
      console.warn('[/api/register] Aviso: Erro ao fazer login automático:', authError);
    }

    return NextResponse.json({
      success: true,
      userId,
    });

  } catch (error: any) {
    console.error('[/api/register] Erro:', error);
    return NextResponse.json(
      { error: error.message || 'Erro interno ao processar cadastro.' },
      { status: 500 }
    );
  }
}

