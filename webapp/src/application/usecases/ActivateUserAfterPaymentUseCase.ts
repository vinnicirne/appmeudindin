import { ISubscriptionRepository } from '../../domain/repositories/ISubscriptionRepository';
import { Subscription } from '../../domain/entities/Subscription';

export interface ActivateUserInput {
  userId: string;
  paymentId: string;
  paymentStatus: string;
}

/**
 * Use Case: ActivateUserAfterPaymentUseCase
 * Fase 2.2 — Application Layer
 *
 * Responsabilidade: Ativar o acesso de um usuário após confirmação de pagamento
 * via webhook do Mercado Pago. Esta é a peça central do funil de conversão.
 */
export class ActivateUserAfterPaymentUseCase {
  constructor(private readonly subscriptionRepository: ISubscriptionRepository) {}

  async execute(input: ActivateUserInput): Promise<void> {
    const { userId, paymentId, paymentStatus } = input;

    if (!userId) {
      throw new Error('userId é obrigatório para ativar o usuário.');
    }

    if (paymentStatus !== 'approved') {
      // Pagamento pendente ou rejeitado: não ativa
      console.log(`[ActivateUser] Pagamento ${paymentId} com status '${paymentStatus}' para usuário ${userId}. Ignorando.`);
      return;
    }

    // Ativa o usuário no banco de dados
    await this.subscriptionRepository.activateUser(userId, paymentId);

    console.log(`[ActivateUser] ✅ Usuário ${userId} ativado com sucesso após pagamento ${paymentId}.`);
  }
}
