/**
 * Domain Entity: Subscription
 * Representa o estado de assinatura de um usuário no sistema.
 */

export type PlanStatus = 'pending' | 'active' | 'trial' | 'expired' | 'blocked';

export interface SubscriptionProps {
  userId: string;
  planStatus: PlanStatus;
  mpPaymentId?: string;
  mpPreferenceId?: string;
  activatedAt?: Date;
  expiresAt?: Date;
  createdAt?: Date;
}

export class Subscription {
  private props: SubscriptionProps;

  constructor(props: SubscriptionProps) {
    this.validate(props);
    this.props = {
      ...props,
      createdAt: props.createdAt || new Date(),
    };
  }

  private validate(props: SubscriptionProps) {
    if (!props.userId) {
      throw new Error('userId é obrigatório para criar uma assinatura.');
    }
    const validStatuses: PlanStatus[] = ['pending', 'active', 'trial', 'expired', 'blocked'];
    if (!validStatuses.includes(props.planStatus)) {
      throw new Error(`Status de plano inválido: ${props.planStatus}`);
    }
  }

  get userId(): string { return this.props.userId; }
  get planStatus(): PlanStatus { return this.props.planStatus; }
  get mpPaymentId(): string | undefined { return this.props.mpPaymentId; }
  get mpPreferenceId(): string | undefined { return this.props.mpPreferenceId; }
  get activatedAt(): Date | undefined { return this.props.activatedAt; }
  get expiresAt(): Date | undefined { return this.props.expiresAt; }
  get createdAt(): Date { return this.props.createdAt!; }

  get isActive(): boolean {
    return this.props.planStatus === 'active';
  }

  get isPending(): boolean {
    return this.props.planStatus === 'pending';
  }

  public activate(paymentId: string): Subscription {
    const now = new Date();
    const expiresAt = new Date(now);
    expiresAt.setFullYear(expiresAt.getFullYear() + 1); // Assinatura anual

    return new Subscription({
      ...this.props,
      planStatus: 'active',
      mpPaymentId: paymentId,
      activatedAt: now,
      expiresAt,
    });
  }

  public toJSON() {
    return { ...this.props };
  }
}
