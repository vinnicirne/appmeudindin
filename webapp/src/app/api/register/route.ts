import { NextRequest, NextResponse } from 'next/server';
import { MercadoPagoConfig, Preference } from 'mercadopago';
import { SupabaseAuthRepository } from '@/infrastructure/database/SupabaseAuthRepository';
import { RegisterAndCheckoutUseCase } from '@/application/usecases/RegisterAndCheckoutUseCase';

/**
 * POST /api/register
 * Route Handler — Fase 2.4
 *
 * Responsabilidade:
 * 1. Validar os dados recebidos
 * 2. Criar usuário via Use Case (Domain → Application → Infrastructure)
 * 3. Criar a Preference de pagamento no Mercado Pago
 * 4. Retornar o link de checkout para o frontend redirecionar
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, password } = body;

    // Validação de entrada na camada de apresentação
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Nome, e-mail e senha são obrigatórios.' },
        { status: 400 }
      );
    }

    // --- CAMADA DE APPLICATION ---
    console.log('[DEBUG /api/register] NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
    console.log('[DEBUG /api/register] NEXT_PUBLIC_SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 15) + '...');
    const authRepository = new SupabaseAuthRepository();
    const registerUseCase = new RegisterAndCheckoutUseCase(authRepository);
    const { userId } = await registerUseCase.execute({ name, email, password });

    // --- CAMADA DE INFRASTRUCTURE (Mercado Pago) ---
    const mpAccessToken = process.env.MP_ACCESS_TOKEN;
    if (!mpAccessToken) {
      console.error('[/api/register] MP_ACCESS_TOKEN não configurado.');
      return NextResponse.json(
        { error: 'Configuração de pagamento ausente. Contate o suporte.' },
        { status: 500 }
      );
    }

    const client = new MercadoPagoConfig({
      accessToken: mpAccessToken,
      options: { timeout: 10000 },
    });

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

    const preference = new Preference(client);
    const preferenceBody = {
      items: [
        {
          id: 'meu_dindin_anual',
          title: 'Meu DinDin — Assinatura Anual',
          quantity: 1,
          unit_price: 29.00,
          currency_id: 'BRL',
        },
      ],
      payer: {
        name,
        email,
      },
      external_reference: userId,
      back_urls: {
        success: `${siteUrl}/aguardando?status=success`,
        failure: `${siteUrl}/cadastro?error=payment_failed`,
        pending: `${siteUrl}/aguardando?status=pending`,
      },
      auto_return: 'approved' as const,
      notification_url: `${siteUrl}/api/webhooks/mercadopago`,
      statement_descriptor: 'MEU DINDIN',
      metadata: {
        user_id: userId,
        user_email: email,
        user_name: name,
      },
    };

    const response = await preference.create({ body: preferenceBody });

    // Fazer login automático para criar a sessão (cookies)
    try {
      const { createClient } = await import('@/utils/supabase/server');
      const supabaseClient = await createClient();
      await supabaseClient.auth.signInWithPassword({ email, password });
    } catch (authError) {
      console.warn('[/api/register] Aviso: Erro ao fazer login automático:', authError);
    }

    return NextResponse.json({
      preferenceId: response.id,
      checkoutUrl: response.init_point,
    });

  } catch (error: any) {
    console.error('[/api/register] Erro:', error);

    // Trata erros específicos do Supabase
    if (error.message?.includes('already registered') || error.message?.includes('already been registered')) {
      return NextResponse.json(
        { error: 'Este e-mail já está cadastrado. Tente fazer login.' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Erro interno. Tente novamente.' },
      { status: 500 }
    );
  }
}
