import { IAuthRepository } from '../../domain/repositories/IAuthRepository';

export interface RegisterAndCheckoutInput {
  name: string;
  email: string;
  password: string;
}

export interface RegisterAndCheckoutOutput {
  userId: string;
  preferenceId: string;
  checkoutUrl: string;
}

/**
 * Use Case: RegisterAndCheckoutUseCase
 * Fase 2.2 — Application Layer
 *
 * Responsabilidade: Orquestrar o cadastro do usuário + criação da preferência de pagamento no Mercado Pago.
 * Seguindo Clean Architecture: não conhece Next.js, Supabase nem Mercado Pago diretamente.
 */
export class RegisterAndCheckoutUseCase {
  constructor(private readonly authRepository: IAuthRepository) {}

  async execute(input: RegisterAndCheckoutInput): Promise<RegisterAndCheckoutOutput> {
    const { name, email, password } = input;

    // 1. Valida inputs
    if (!name || name.trim().length < 2) {
      throw new Error('O nome deve ter pelo menos 2 caracteres.');
    }
    if (!email || !email.includes('@')) {
      throw new Error('E-mail inválido.');
    }
    if (!password || password.length < 6) {
      throw new Error('A senha deve ter pelo menos 6 caracteres.');
    }

    // 2. Cria o usuário no Supabase (plan_status = 'pending' via trigger)
    const user = await this.authRepository.signUp(email, password, name);

    // 3. Retorna o userId para a camada de infraestrutura criar a preference MP
    // (A criação da preference MP fica na Infrastructure pois é um detalhe externo)
    return {
      userId: user.id,
      preferenceId: '', // preenchido pelo infrastructure layer
      checkoutUrl: '', // preenchido pelo infrastructure layer
    };
  }
}
