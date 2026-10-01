import { Transaction, TransactionProps } from '../../domain/entities/Transaction';
import { ITransactionRepository } from '../../domain/repositories/ITransactionRepository';

export interface AddTransactionRequestDTO {
  userId: string;
  amount: number;
  description: string;
  date: Date;
  categoryId: string;
  type: 'INCOME' | 'EXPENSE';
  isRecurring?: boolean;
  notes?: string;
  isPaid?: boolean;
  installments?: {
    current: number;
    total: number;
  };
}

export class AddTransactionUseCase {
  constructor(private transactionRepository: ITransactionRepository) {}

  async execute(request: AddTransactionRequestDTO): Promise<Transaction> {
    if (request.installments && request.installments.total > 1) {
      let firstTransaction: Transaction | null = null;
      const totalInstallments = request.installments.total;
      const installmentAmount = Number((request.amount / totalInstallments).toFixed(2));
      
      for (let i = 0; i < totalInstallments; i++) {
        const currentDate = new Date(request.date);
        currentDate.setMonth(currentDate.getMonth() + i);
        
        const transaction = new Transaction({
          ...request,
          amount: installmentAmount,
          description: `${request.description} (${i + 1}/${totalInstallments})`,
          date: currentDate,
          isPaid: i === 0 ? (request.isPaid !== undefined ? request.isPaid : true) : false,
          isRecurring: false,
          installments: {
            current: i + 1,
            total: totalInstallments
          }
        });

        await this.transactionRepository.create(transaction);
        if (i === 0) firstTransaction = transaction;
      }
      return firstTransaction!;
    } else if (request.isRecurring) {
      let firstTransaction: Transaction | null = null;
      // Cria para os próximos 12 meses
      for (let i = 0; i < 12; i++) {
        const currentDate = new Date(request.date);
        currentDate.setMonth(currentDate.getMonth() + i);
        
        const transaction = new Transaction({
          ...request,
          date: currentDate,
        });

        await this.transactionRepository.create(transaction);
        if (i === 0) firstTransaction = transaction;
      }
      return firstTransaction!;
    } else {
      const transaction = new Transaction(request);
      await this.transactionRepository.create(transaction);
      return transaction;
    }
  }
}
