export type TransactionType = 'INCOME' | 'EXPENSE';

export interface TransactionProps {
  id?: string;
  userId: string;
  amount: number;
  description: string;
  date: Date;
  categoryId: string;
  type: TransactionType;
  isRecurring?: boolean;
  notes?: string;
  isPaid?: boolean;
  installments?: {
    current: number;
    total: number;
  };
  createdAt?: Date;
  updatedAt?: Date;
}

export class Transaction {
  private props: TransactionProps;

  constructor(props: TransactionProps) {
    this.validate(props);
    this.props = {
      ...props,
      id: props.id || crypto.randomUUID(),
      isPaid: props.isPaid !== undefined ? props.isPaid : true,
      notes: props.notes || '',
      createdAt: props.createdAt || new Date(),
      updatedAt: props.updatedAt || new Date(),
    };
  }

  private validate(props: TransactionProps) {
    if (props.amount <= 0) {
      throw new Error("O valor da transação deve ser maior que zero.");
    }
    if (!props.description || props.description.trim() === '') {
      throw new Error("A descrição é obrigatória.");
    }
    if (props.installments) {
      if (props.installments.current > props.installments.total) {
        throw new Error("A parcela atual não pode ser maior que o total de parcelas.");
      }
    }
  }

  get id(): string { return this.props.id!; }
  get userId(): string { return this.props.userId; }
  get amount(): number { return this.props.amount; }
  get description(): string { return this.props.description; }
  get date(): Date { return this.props.date; }
  get categoryId(): string { return this.props.categoryId; }
  get type(): TransactionType { return this.props.type; }
  get isRecurring(): boolean { return this.props.isRecurring || false; }
  get notes(): string { return this.props.notes || ''; }
  get isPaid(): boolean { return this.props.isPaid !== undefined ? this.props.isPaid : true; }
  get installments() { return this.props.installments; }
  get createdAt(): Date { return this.props.createdAt!; }
  get updatedAt(): Date { return this.props.updatedAt!; }

  public toJSON() {
    return { ...this.props };
  }
}
