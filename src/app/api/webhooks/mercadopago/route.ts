import { NextRequest, NextResponse } from 'next/server';
import { SupabaseSubscriptionRepository } from '@/infrastructure/database/SupabaseSubscriptionRepository';
import { ActivateUserAfterPaymentUseCase } from '@/application/usecases/ActivateUserAfterPaymentUseCase';
import crypto from 'crypto';

/**
 * Valida a assinatura HMAC-SHA256 enviada pelo Mercado Pago.
 * Garante que apenas o MP pode acionar este endpoint.
 * Docs: https://www.mercadopago.com.br/developers/pt/docs/your-integrations/notifications/webhooks
 */
function validateMPSignature(request: NextRequest, rawBody: string): boolean {
  const secret = process.env.MP_WEBHOOK_SECRET;
  if (!secret) {
    // Se não houver secret configurado, loga um aviso mas não bloqueia (modo dev)
    console.warn('[Webhook MP] MP_WEBHOOK_SECRET não configurado. Validação de assinatura desativada.');
    return true;
  }

  const xSignature = request.headers.get('x-signature');
  const xRequestId = request.headers.get('x-request-id');
  const dataId = request.nextUrl.searchParams.get('data.id') ||
                 request.nextUrl.searchParams.get('id');

  if (!xSignature) {
    console.warn('[Webhook MP] Header x-signature ausente.');
    return false;
  }

  // Extrai ts e v1 do header x-signature
  const parts = xSignature.split(',');
  let ts = '';
  let v1 = '';
  for (const part of parts) {
    const [key, value] = part.split('=');
    if (key?.trim() === 'ts') ts = value?.trim() || '';
    if (key?.trim() === 'v1') v1 = value?.trim() || '';
  }

  if (!ts || !v1) {
    console.warn('[Webhook MP] Assinatura malformada:', xSignature);
    return false;
  }

  // Template: id:[data.id];request-id:[x-request-id];ts:[ts];
  const template = `id:${dataId};request-id:${xRequestId};ts:${ts};`;
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(template)
    .digest('hex');

  const isValid = expectedSignature === v1;
  if (!isValid) {
    console.error('[Webhook MP] Assinatura inválida! Possível requisição não autorizada.');
  }
  return isValid;
}

/**
 * POST /api/webhooks/mercadopago
 * Route Handler — Fase 2.4
 *
 * Responsabilidade:
 * 1. Receber notificação do Mercado Pago
 * 2. Verificar o pagamento diretamente na API do MP (nunca confiar só no webhook)
 * 3. Ativar o usuário no banco via Use Case se pagamento for 'approved'
 *
 * IMPORTANTE: Retorna 200 imediatamente (MP exige resposta rápida)
 * O processamento real ocorre de forma assíncrona.
 */
export async function POST(request: NextRequest) {
  // Responde imediatamente para o MP não reenviar o evento
  const response = NextResponse.json({ received: true }, { status: 200 });

  try {
    const rawBody = await request.text();
    const body = rawBody ? JSON.parse(rawBody) : {};
    const searchParams = request.nextUrl.searchParams;

    // Valida assinatura HMAC — garante que é o MP chamando
    if (!validateMPSignature(request, rawBody)) {
      console.error('[Webhook MP] Requisição rejeitada: assinatura inválida.');
      return response; // Retorna 200 mesmo assim (MP não deve re-enviar)
    }

    const topic = body.type || searchParams.get('topic');
    // O paymentId pode vir como body.data.id (webhook moderno) ou como query ?id= (IPN legacy)
    const paymentId = body.data?.id || searchParams.get('data.id') || searchParams.get('id');

    console.log(`[Webhook MP] Recebido: topic=${topic}, paymentId=${paymentId}`);

    // Aceita tanto o formato moderno ('payment') quanto o IPN legacy ('payment')
    const isPaymentTopic = topic === 'payment' || topic === 'topic_payment';
    if (!isPaymentTopic || !paymentId) {
      console.log(`[Webhook MP] Evento ignorado: topic='${topic}', paymentId='${paymentId}'.`);
      return response;
    }

    const mpAccessToken = process.env.MP_ACCESS_TOKEN;
    if (!mpAccessToken) {
      console.error('[Webhook MP] MP_ACCESS_TOKEN não configurado!');
      return response;
    }

    // Verifica o pagamento diretamente na API do Mercado Pago
    const paymentResponse = await fetch(
      `https://api.mercadopago.com/v1/payments/${paymentId}`,
      {
        headers: {
          Authorization: `Bearer ${mpAccessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!paymentResponse.ok) {
      console.error(`[Webhook MP] Falha ao consultar pagamento ${paymentId}: ${paymentResponse.status}`);
      return response;
    }

    const payment = await paymentResponse.json();

    const userId = payment.external_reference;
    const paymentStatus = payment.status;

    console.log(`[Webhook MP] Pagamento ${paymentId}: status=${paymentStatus}, userId=${userId}`);

    if (!userId) {
      console.error('[Webhook MP] external_reference (userId) ausente no pagamento!');
      return response;
    }

    // --- CAMADA DE APPLICATION ---
    const subscriptionRepository = new SupabaseSubscriptionRepository();
    const activateUseCase = new ActivateUserAfterPaymentUseCase(subscriptionRepository);

    await activateUseCase.execute({
      userId,
      paymentId: String(paymentId),
      paymentStatus,
    });

  } catch (error: any) {
    // Nunca deixa o erro vazar para o MP (ele poderia reenviar o evento infinitamente)
    console.error('[Webhook MP] Erro no processamento:', error.message || error);
  }

  return response;
}
