import { Transaction } from '../entities/Transaction';

export interface ITransactionRepository {
  create(transaction: Transaction): Promise<void>;
  findById(id: string): Promise<Transaction | null>;
  findByUserId(userId: string, filters?: { 
    startDate?: Date; 
    endDate?: Date; 
    type?: 'INCOME' | 'EXPENSE' 
  }): Promise<Transaction[]>;
  update(transaction: Transaction): Promise<void>;
  delete(id: string): Promise<void>;
}
