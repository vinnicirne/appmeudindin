'use server';

import { AddTransactionUseCase } from '../../application/usecases/AddTransactionUseCase';
import { SupabaseTransactionRepository } from '../../infrastructure/database/SupabaseTransactionRepository';
import { createClient } from '../../utils/supabase/server';
import { revalidatePath } from 'next/cache';

const transactionRepository = new SupabaseTransactionRepository();
const addTransactionUseCase = new AddTransactionUseCase(transactionRepository);

export async function addTransactionAction(formData: FormData) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return { error: 'Não autorizado. Faça login para adicionar transações.' };
    }

    const userId = user.id;

    const amount = Number(formData.get('amount'));
    const description = formData.get('description') as string;
    const dateStr = formData.get('date') as string;
    const type = formData.get('type') as 'INCOME' | 'EXPENSE';
    const categoryId = formData.get('categoryId') as string;
    const isRecurring = formData.get('isRecurring') === 'true';
    const notes = (formData.get('notes') as string) || '';
    const installmentsTotal = Number(formData.get('installmentsTotal'));

    if (!amount || !description || !dateStr || !type || !categoryId) {
      return { error: 'Campos obrigatórios ausentes.' };
    }

    const transaction = await addTransactionUseCase.execute({
      userId,
      amount,
      description,
      date: new Date(dateStr + "T12:00:00-03:00"),
      categoryId,
      type,
      isRecurring,
      notes,
      isPaid: true,
      installments: installmentsTotal > 1 ? { current: 1, total: installmentsTotal } : undefined
    });

    revalidatePath('/', 'layout');
    return { success: true, transactionId: transaction.id };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function updateTransactionAction(formData: FormData) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return { error: 'Não autorizado.' };
    }

    const id = formData.get('id') as string;
    const amount = Number(formData.get('amount'));
    const description = formData.get('description') as string;
    const dateStr = formData.get('date') as string;
    const type = formData.get('type') as 'INCOME' | 'EXPENSE';
    const categoryId = formData.get('categoryId') as string;
    const notes = (formData.get('notes') as string) || '';
    const isPaid = formData.get('isPaid') === 'true';
    const isRecurring = formData.get('isRecurring') === 'true';

    if (!id || !amount || !description || !dateStr || !type || !categoryId) {
      return { error: 'Campos obrigatórios ausentes para atualização.' };
    }

    const existing = await transactionRepository.findById(id);
    if (!existing || existing.userId !== user.id) {
      return { error: 'Transação não encontrada ou sem permissão.' };
    }

    const updated = new (await import('../../domain/entities/Transaction')).Transaction({
      id: existing.id,
      userId: user.id,
      amount,
      description,
      date: new Date(dateStr + "T12:00:00-03:00"),
      categoryId,
      type,
      notes,
      isPaid,
      isRecurring,
      installments: existing.installments,
      createdAt: existing.createdAt,
      updatedAt: new Date(),
    });

    await transactionRepository.update(updated);

    if (!existing.isRecurring && isRecurring) {
      for (let i = 1; i <= 11; i++) {
        const currentDate = new Date(updated.date);
        currentDate.setMonth(currentDate.getMonth() + i);
        
        const futureTransaction = new (await import('../../domain/entities/Transaction')).Transaction({
          userId: user.id,
          amount,
          description,
          date: currentDate,
          categoryId,
          type,
          notes,
          isPaid: false, 
          isRecurring: true,
        });

        await transactionRepository.create(futureTransaction);
      }
    }

    revalidatePath('/', 'layout');
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function deleteTransactionAction(id: string) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return { error: 'Não autorizado.' };
    }

    const existing = await transactionRepository.findById(id);
    if (!existing || existing.userId !== user.id) {
      return { error: 'Transação não encontrada ou sem permissão.' };
    }

    await transactionRepository.delete(id);

    revalidatePath('/', 'layout');
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function togglePaidTransactionAction(id: string, isPaid: boolean) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return { error: 'Não autorizado.' };
    }

    const existing = await transactionRepository.findById(id);
    if (!existing || existing.userId !== user.id) {
      return { error: 'Transação não encontrada.' };
    }

    const updated = new (await import('../../domain/entities/Transaction')).Transaction({
      id: existing.id,
      userId: user.id,
      amount: existing.amount,
      description: existing.description,
      date: existing.date,
      categoryId: existing.categoryId,
      type: existing.type,
      notes: existing.notes,
      isPaid,
      installments: existing.installments,
      createdAt: existing.createdAt,
      updatedAt: new Date(),
    });

    await transactionRepository.update(updated);

    revalidatePath('/', 'layout');
    return { success: true, isPaid };
  } catch (error: any) {
    return { error: error.message };
  }
}
