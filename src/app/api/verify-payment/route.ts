import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { SupabaseSubscriptionRepository } from '@/infrastructure/database/SupabaseSubscriptionRepository';
import { ActivateUserAfterPaymentUseCase } from '@/application/usecases/ActivateUserAfterPaymentUseCase';

/**
 * POST /api/verify-payment
 * Verifica ativamente um pagamento no Mercado Pago e ativa o usuário se aprovado.
 * Serve como fallback imediato para o webhook quando o usuário retorna à página /aguardando.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const paymentId = body.paymentId || request.nextUrl.searchParams.get('payment_id');

    if (!paymentId) {
      return NextResponse.json({ error: 'paymentId é obrigatório.' }, { status: 400 });
    }

    const mpAccessToken = process.env.MP_ACCESS_TOKEN;
    if (!mpAccessToken) {
      return NextResponse.json({ error: 'MP_ACCESS_TOKEN não configurado.' }, { status: 500 });
    }

    // Consulta status direto no Mercado Pago
    const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: {
        Authorization: `Bearer ${mpAccessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!mpRes.ok) {
      const errorText = await mpRes.text();
      console.error(`[/api/verify-payment] Erro ao consultar MP: ${mpRes.status} ${errorText}`);
      return NextResponse.json({ error: 'Falha ao consultar pagamento no Mercado Pago.' }, { status: mpRes.status });
    }

    const payment = await mpRes.json();
    const externalRef = payment.external_reference;
    const paymentStatus = payment.status;

    // Garante que o pagamento pertence ao usuário logado
    if (externalRef && externalRef !== user.id) {
      console.error(`[/api/verify-payment] external_reference (${externalRef}) diferente do user.id (${user.id})`);
      return NextResponse.json({ error: 'Pagamento não pertence ao usuário logado.' }, { status: 403 });
    }

    if (paymentStatus === 'approved') {
      const subscriptionRepo = new SupabaseSubscriptionRepository();
      const activateUseCase = new ActivateUserAfterPaymentUseCase(subscriptionRepo);

      await activateUseCase.execute({
        userId: user.id,
        paymentId: String(paymentId),
        paymentStatus,
      });

      return NextResponse.json({
        success: true,
        status: 'approved',
        message: 'Usuário ativado com sucesso.',
      });
    }

    return NextResponse.json({
      success: false,
      status: paymentStatus,
      message: `Status do pagamento: ${paymentStatus}`,
    });
  } catch (error: any) {
    console.error('[/api/verify-payment] Erro inesperado:', error);
    return NextResponse.json({ error: error.message || 'Erro ao verificar pagamento.' }, { status: 500 });
  }
}
