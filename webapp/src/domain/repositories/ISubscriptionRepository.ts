import { Subscription } from '../entities/Subscription';

/**
 * Repository Interface: ISubscriptionRepository
 * Define o contrato para operações de assinatura no banco de dados.
 */
export interface ISubscriptionRepository {
  /**
   * Ativa o plano de um usuário após confirmação de pagamento.
   */
  activateUser(userId: string, paymentId: string): Promise<void>;

  /**
   * Busca o status de assinatura de um usuário.
   */
  getByUserId(userId: string): Promise<Subscription | null>;
}
