import { createClient } from '@supabase/supabase-js';
import { ISubscriptionRepository } from '../../domain/repositories/ISubscriptionRepository';
import { Subscription } from '../../domain/entities/Subscription';

/**
 * Infrastructure: SupabaseSubscriptionRepository
 * Fase 2.3 — Infrastructure Layer
 *
 * Usa o Service Role Key (admin) para operações que precisam ignorar RLS,
 * como a ativação via webhook (que não tem contexto de usuário autenticado).
 */
export class SupabaseSubscriptionRepository implements ISubscriptionRepository {
  private supabase;

  constructor() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error('Variáveis de ambiente do Supabase não configuradas. Verifique NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY.');
    }

    this.supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }

  async activateUser(userId: string, paymentId: string): Promise<void> {
    const now = new Date();
    const expiresAt = new Date(now);
    expiresAt.setFullYear(expiresAt.getFullYear() + 1); // Assinatura anual

    const { error } = await this.supabase
      .from('users')
      .update({
        plan_status: 'active',
        mp_payment_id: paymentId,
        activated_at: now.toISOString(),
        expires_at: expiresAt.toISOString(),
      })
      .eq('id', userId);

    if (error) {
      console.error('[SupabaseSubscriptionRepository] Erro ao ativar usuário:', error);
      throw new Error(`Falha ao ativar usuário ${userId}: ${error.message}`);
    }
  }

  async getByUserId(userId: string): Promise<Subscription | null> {
    const { data, error } = await this.supabase
      .from('users')
      .select('id, plan_status, activated_at, expires_at')
      .eq('id', userId)
      .single();

    if (error || !data) {
      return null;
    }

    return new Subscription({
      userId: data.id,
      planStatus: data.plan_status,
      activatedAt: data.activated_at ? new Date(data.activated_at) : undefined,
      expiresAt: data.expires_at ? new Date(data.expires_at) : undefined,
    });
  }
}
