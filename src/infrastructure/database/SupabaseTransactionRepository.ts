import { Transaction } from '../../domain/entities/Transaction';
import { ITransactionRepository } from '../../domain/repositories/ITransactionRepository';
import { createClient } from '../../utils/supabase/server';

export class SupabaseTransactionRepository implements ITransactionRepository {
  private tableName = 'transactions';

  async create(transaction: Transaction): Promise<void> {
    const data = transaction.toJSON();
    const supabase = await createClient();
    
    const insertPayload: Record<string, any> = {
      user_id: data.userId,
      amount: data.amount,
      description: data.description,
      title: data.description,
      date: data.date.toISOString(),
      timestamp: data.date.getTime(),
      category_id: data.categoryId,
      type: data.type,
      is_recurring: data.isRecurring || false,
    };

    if (data.installments) {
      insertPayload.installments = data.installments;
    }

    if (data.notes !== undefined) {
      insertPayload.notes = data.notes;
    }

    if (data.isPaid !== undefined) {
      insertPayload.is_paid = data.isPaid;
    }

    if (data.createdAt) {
      insertPayload.created_at = data.createdAt.toISOString();
    }

    if (data.updatedAt) {
      insertPayload.updated_at = data.updatedAt.toISOString();
    }

    const { error } = await supabase
      .from(this.tableName)
      .insert([insertPayload]);

    if (error) {
      throw new Error(`Erro ao criar transação: ${error.message}`);
    }
  }

  async findById(id: string): Promise<Transaction | null> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from(this.tableName)
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) return null;

    return new Transaction({
      id: String(data.id),
      userId: data.user_id,
      amount: data.amount,
      description: data.description || data.title || '',
      date: new Date(data.date || data.timestamp || Date.now()),
      categoryId: data.category_id,
      type: data.type,
      notes: data.notes || '',
      isPaid: data.is_paid !== undefined ? data.is_paid : true,
      isRecurring: data.is_recurring,
      installments: data.installments,
      createdAt: data.created_at ? new Date(data.created_at) : new Date(data.date || Date.now()),
      updatedAt: data.updated_at ? new Date(data.updated_at) : new Date(data.date || Date.now())
    });
  }

  async findByUserId(userId: string, filters?: { startDate?: Date; endDate?: Date; type?: 'INCOME' | 'EXPENSE' }): Promise<Transaction[]> {
    const supabase = await createClient();
    let query = supabase.from(this.tableName).select('*').eq('user_id', userId);

    if (filters?.startDate) query = query.gte('date', filters.startDate.toISOString());
    if (filters?.endDate) query = query.lte('date', filters.endDate.toISOString());
    if (filters?.type) query = query.eq('type', filters.type);

    const { data, error } = await query;

    if (error) {
      throw new Error(`Erro ao buscar transações: ${error.message}`);
    }

    return (data || []).map(row => new Transaction({
      id: String(row.id),
      userId: row.user_id,
      amount: row.amount,
      description: row.description || row.title || '',
      date: new Date(row.date || row.timestamp || Date.now()),
      categoryId: row.category_id,
      type: row.type,
      notes: row.notes || '',
      isPaid: row.is_paid !== undefined ? row.is_paid : true,
      isRecurring: row.is_recurring,
      installments: row.installments,
      createdAt: row.created_at ? new Date(row.created_at) : new Date(row.date),
      updatedAt: row.updated_at ? new Date(row.updated_at) : new Date(row.date)
    }));
  }

  async update(transaction: Transaction): Promise<void> {
    const data = transaction.toJSON();
    const supabase = await createClient();
    
    const updatePayload: Record<string, any> = {
      amount: data.amount,
      description: data.description,
      date: data.date.toISOString(),
      timestamp: data.date.getTime(),
      category_id: data.categoryId,
      type: data.type,
      notes: data.notes || '',
      is_paid: data.isPaid !== undefined ? data.isPaid : true,
      is_recurring: data.isRecurring || false,
      installments: data.installments,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from(this.tableName)
      .update(updatePayload)
      .eq('id', data.id);

    if (error) {
      throw new Error(`Erro ao atualizar transação: ${error.message}`);
    }
  }

  async delete(id: string): Promise<void> {
    const supabase = await createClient();
    const { error } = await supabase
      .from(this.tableName)
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Erro ao excluir transação: ${error.message}`);
    }
  }
}
