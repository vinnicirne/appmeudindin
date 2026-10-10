export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { MercadoPagoConfig, Preference } from 'mercadopago';
import { createClient } from '@/utils/supabase/server';

/**
 * POST /api/create-checkout
 * Gera um link de pagamento para um usuário JÁ CADASTRADO (ex: vindo do paywall).
 * Busca dinamicamente o valor e nome do plano ativo configurado no /admin.
 */
export async function POST(request: NextRequest) {
  try {
    // Verifica se o usuário está autenticado
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { userEmail, userName, planId } = body;

    const mpAccessToken = process.env.MP_ACCESS_TOKEN;
    if (!mpAccessToken) {
      return NextResponse.json(
        { error: 'Configuração de pagamento ausente.' },
        { status: 500 }
      );
    }

    // Busca o plano ativo no Supabase
    let activePlan = null;
    if (planId) {
      const { data } = await supabase.from('plans').select('*').eq('id', planId).single();
      activePlan = data;
    }
    if (!activePlan) {
      const { data } = await supabase.from('plans').select('*').eq('is_active', true).order('sort_order', { ascending: true }).limit(1).single();
      activePlan = data;
    }

    const planPrice = activePlan ? Number(activePlan.price) : 37.00;
    const planName = activePlan?.name || 'Meu DinDin — Assinatura Anual';

    const client = new MercadoPagoConfig({
      accessToken: mpAccessToken,
      options: { timeout: 10000 },
    });

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

    const preference = new Preference(client);
    const preferenceBody = {
      items: [
        {
          id: activePlan?.id || 'meu_dindin_anual',
          title: planName,
          quantity: 1,
          unit_price: planPrice,
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


