'use server';

import { SupabaseAuthRepository } from '../../infrastructure/database/SupabaseAuthRepository';
import { AuthenticateUserUseCase } from '../../application/usecases/AuthenticateUserUseCase';

const authRepository = new SupabaseAuthRepository();
const authenticateUseCase = new AuthenticateUserUseCase(authRepository);

export async function loginAction(formData: FormData) {
  try {
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    const user = await authenticateUseCase.execute(email, password);

    return { success: true, user };
  } catch (error: any) {
    return { error: error.message || 'Erro inesperado ao fazer login.' };
  }
}

export async function logoutAction() {
  try {
    await authRepository.signOut();
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function forgotPasswordAction(formData: FormData) {
  try {
    const email = formData.get('email') as string;
    const { createClient } = await import('@/utils/supabase/server');
    const supabase = await createClient();
    
    // Configura a URL de redirecionamento para voltar pro site dele
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${siteUrl}/auth/callback?next=/update-password`,
    });

    if (error) throw error;
    
    return { success: true };
  } catch (error: any) {
    return { error: error.message || 'Falha ao enviar e-mail de recuperação.' };
  }
}

export async function updatePasswordAction(newPassword: string) {
  try {
    const { createClient } = await import('@/utils/supabase/server');
    const supabase = await createClient();
    
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });

    if (error) throw error;
    
    return { success: true };
  } catch (error: any) {
    return { error: error.message || 'Falha ao atualizar a senha.' };
  }
}
