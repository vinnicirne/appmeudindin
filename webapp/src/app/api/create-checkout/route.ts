import { NextRequest, NextResponse } from 'next/server';
import { MercadoPagoConfig, Preference } from 'mercadopago';
import { createClient } from '@/utils/supabase/server';

/**
 * POST /api/create-checkout
 * Gera um link de pagamento para um usuário JÁ CADASTRADO (ex: vindo do paywall).
 * Diferente do /api/register que cria o usuário + preference.
 */
export async function POST(request: NextRequest) {
  try {
    // Verifica se o usuário está autenticado
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
    }

    const body = await request.json();
    // Usa o userId do token de sessão, não do body (segurança)
    const { userEmail, userName } = body;

    const mpAccessToken = process.env.MP_ACCESS_TOKEN;
    if (!mpAccessToken) {
      return NextResponse.json(
        { error: 'Configuração de pagamento ausente.' },
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
        name: userName || user.user_metadata?.name || 'Cliente',
        email: userEmail || user.email || '',
      },
      external_reference: user.id, // Sempre usa o ID do usuário autenticado
      back_urls: {
        success: `${siteUrl}/aguardando?status=success`,
        failure: `${siteUrl}/paywall?error=payment_failed`,
        pending: `${siteUrl}/aguardando?status=pending`,
      },
      auto_return: 'approved' as const,
      notification_url: `${siteUrl}/api/webhooks/mercadopago`,
      statement_descriptor: 'MEU DINDIN',
    };

    const response = await preference.create({ body: preferenceBody });

    return NextResponse.json({
      preferenceId: response.id,
      checkoutUrl: response.init_point,
    });

  } catch (error: any) {
    console.error('[/api/create-checkout] Erro:', error);
    return NextResponse.json(
      { error: error.message || 'Erro ao gerar link de pagamento.' },
      { status: 500 }
    );
  }
}
