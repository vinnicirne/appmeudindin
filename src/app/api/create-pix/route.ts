import { NextRequest, NextResponse } from 'next/server';
import { MercadoPagoConfig, Payment } from 'mercadopago';
import { createClient } from '@/utils/supabase/server';
import crypto from 'crypto';

/**
 * POST /api/create-pix
 * Gera um pagamento direto via Pix (Checkout Transparente) no Mercado Pago.
 * Retorna o QR Code em Base64 e a chave Pix Copia e Cola para pagamento imediato.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { cpf, userName, userEmail } = body;

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
      transaction_amount: 29.00,
      description: 'Meu DinDin — Assinatura Anual',
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
    });
  } catch (error: any) {
    console.error('[/api/create-pix] Erro ao criar pagamento Pix:', error);
    return NextResponse.json(
      { error: error.message || 'Erro ao gerar Pix no Mercado Pago.' },
      { status: 500 }
    );
  }
}
