import { describe, it, expect } from 'vitest';
import { Transaction } from './Transaction';

describe('Transaction Entity', () => {
  it('deve criar uma transação válida', () => {
    const transaction = new Transaction({
      userId: 'user-123',
      amount: 150,
      description: 'Compra no Mercado',
      date: new Date('2026-09-28'),
      categoryId: 'cat-1',
      type: 'EXPENSE'
    });

    expect(transaction.id).toBeDefined();
    expect(transaction.amount).toBe(150);
    expect(transaction.type).toBe('EXPENSE');
  });

  it('deve rejeitar uma transação com valor zero ou negativo', () => {
    expect(() => {
      new Transaction({
        userId: 'user-123',
        amount: 0,
        description: 'Compra no Mercado',
        date: new Date('2026-09-28'),
        categoryId: 'cat-1',
        type: 'EXPENSE'
      });
    }).toThrow('O valor da transação deve ser maior que zero.');

    expect(() => {
      new Transaction({
        userId: 'user-123',
        amount: -50,
        description: 'Compra no Mercado',
        date: new Date('2026-09-28'),
        categoryId: 'cat-1',
        type: 'EXPENSE'
      });
    }).toThrow('O valor da transação deve ser maior que zero.');
  });

  it('deve rejeitar uma transação sem descrição', () => {
    expect(() => {
      new Transaction({
        userId: 'user-123',
        amount: 100,
        description: '   ',
        date: new Date('2026-09-28'),
        categoryId: 'cat-1',
        type: 'EXPENSE'
      });
    }).toThrow('A descrição é obrigatória.');
  });
});
