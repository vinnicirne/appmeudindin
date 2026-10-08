import { describe, it, expect, vi } from 'vitest';
import { AddTransactionUseCase } from './AddTransactionUseCase';
import { ITransactionRepository } from '../../domain/repositories/ITransactionRepository';

describe('AddTransactionUseCase', () => {
  it('deve criar e persistir uma transação', async () => {
    const mockRepo: ITransactionRepository = {
      create: vi.fn().mockResolvedValue(undefined),
      findById: vi.fn(),
      findByUserId: vi.fn(),
      update: vi.fn(),
      delete: vi.fn()
    };

    const useCase = new AddTransactionUseCase(mockRepo);

    const result = await useCase.execute({
      userId: 'user-123',
      amount: 50,
      description: 'Uber',
      date: new Date('2026-09-28'),
      categoryId: 'cat-2',
      type: 'EXPENSE'
    });

    expect(result).toBeDefined();
    expect(result.amount).toBe(50);
    expect(mockRepo.create).toHaveBeenCalledOnce();
    expect(mockRepo.create).toHaveBeenCalledWith(result);
  });
});
