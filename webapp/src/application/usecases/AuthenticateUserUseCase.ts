import { IAuthRepository } from '../../domain/repositories/IAuthRepository';
import { User } from '../../domain/entities/User';

export class AuthenticateUserUseCase {
  constructor(private authRepository: IAuthRepository) {}

  async execute(email: string, password: string): Promise<User> {
    if (!email || !email.includes('@')) {
      throw new Error('Email inválido.');
    }
    if (!password || password.length < 6) {
      throw new Error('A senha deve ter pelo menos 6 caracteres.');
    }

    return await this.authRepository.signIn(email, password);
  }
}
