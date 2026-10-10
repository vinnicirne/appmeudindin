export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { MercadoPagoConfig, Payment } from 'mercadopago';
import { createClient } from '@/utils/supabase/server';
import crypto from 'crypto';

/**
 * POST /api/create-pix
 * Gera um pagamento direto via Pix (Checkout Transparente) no Mercado Pago.
 * Busca dinamicamente o valor e nome do plano ativo configurado no /admin.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { cpf, userName, userEmail, planId } = body;

    const cleanCpf = (cpf || '').replace(/\D/g, '');
    if (cleanCpf.length !== 11) {
      return NextResponse.json(
        { error: 'CPF inválido. Por favor, digite um CPF com 11 dígitos para emissão do Pix.' },
        { status: 400 }
      );
    }

    const mpAccessToken = process.env.MP_ACCESS_TOKEN;
    if (!mpAccessToken) {
      return NextResponse.json(
        { error: 'Configuração de pagamento ausente no servidor (MP_ACCESS_TOKEN).' },
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
    const payment = new Payment(client);

    const fullName = (userName || user.user_metadata?.name || 'Cliente').trim();
    const nameParts = fullName.split(' ');
    const firstName = nameParts[0] || 'Cliente';
    const lastName = nameParts.slice(1).join(' ') || 'Assinante';
    const email = userEmail || user.email || 'contato@meudindin.app';

    const paymentData = {
      transaction_amount: planPrice,
      description: planName,
      payment_method_id: 'pix',
      payer: {
        email,
        first_name: firstName,
        last_name: lastName,
        identification: {
          type: 'CPF',
          number: cleanCpf,
        },
      },
      notification_url: `${siteUrl}/api/webhooks/mercadopago`,
      external_reference: user.id,
    };

    const response = await payment.create({
      body: paymentData,
      requestOptions: {
        idempotencyKey: crypto.randomUUID(),
      },
    });

    const qrCode = response.point_of_interaction?.transaction_data?.qr_code;
    const qrCodeBase64 = response.point_of_interaction?.transaction_data?.qr_code_base64;
    const ticketUrl = response.point_of_interaction?.transaction_data?.ticket_url;

    if (!qrCode && !qrCodeBase64) {
      return NextResponse.json(
        { error: 'Mercado Pago não retornou os dados do QR Code. Verifique se a chave Pix da sua conta MP está ativa.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      paymentId: response.id,
      status: response.status,
      qrCode,
      qrCodeBase64,
      ticketUrl,
      amount: planPrice,
    });
  } catch (error: any) {
    console.error('[/api/create-pix] Erro ao criar pagamento Pix:', error);
    return NextResponse.json(
      { error: error.message || 'Erro ao gerar Pix no Mercado Pago.' },
      { status: 500 }
    );
  }
}


