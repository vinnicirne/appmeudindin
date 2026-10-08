import { describe, it, expect, vi } from 'vitest';
import { AuthenticateUserUseCase } from './AuthenticateUserUseCase';
import { IAuthRepository } from '../../domain/repositories/IAuthRepository';
import { User } from '../../domain/entities/User';

describe('AuthenticateUserUseCase', () => {
  it('deve autenticar um usuário válido com sucesso', async () => {
    const mockUser: User = { id: '1', email: 'test@example.com' };
    const mockRepo: IAuthRepository = {
      signIn: vi.fn().mockResolvedValue(mockUser),
      signUp: vi.fn(),
      signOut: vi.fn(),
      getCurrentUser: vi.fn()
    };

    const useCase = new AuthenticateUserUseCase(mockRepo);
    const result = await useCase.execute('test@example.com', '123456');

    expect(result).toBeDefined();
    expect(result.email).toBe('test@example.com');
    expect(mockRepo.signIn).toHaveBeenCalledWith('test@example.com', '123456');
  });

  it('deve rejeitar email inválido', async () => {
    const mockRepo: IAuthRepository = {
      signIn: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
      getCurrentUser: vi.fn()
    };

    const useCase = new AuthenticateUserUseCase(mockRepo);
    await expect(useCase.execute('emailinvalido', '123456')).rejects.toThrow('Email inválido.');
  });

  it('deve rejeitar senha curta', async () => {
    const mockRepo: IAuthRepository = {
      signIn: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
      getCurrentUser: vi.fn()
    };

    const useCase = new AuthenticateUserUseCase(mockRepo);
    await expect(useCase.execute('test@example.com', '123')).rejects.toThrow('A senha deve ter pelo menos 6 caracteres.');
  });
});
