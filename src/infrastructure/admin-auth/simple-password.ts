// Secure password-based admin authentication using bcrypt
import bcrypt from 'bcryptjs';
import type { AppError, Result } from '../../domain/errors';
import { success, failure, storageReadError, storageWriteError } from '../../domain/errors';

export interface AdminAuthService {
  verifyPassword(password: string, hash: string): Promise<Result<boolean, AppError>>;
  hashPassword(password: string): Promise<Result<string, AppError>>;
}

export function createBcryptAuth(): AdminAuthService {
  const SALT_ROUNDS = 12;

  return {
    async verifyPassword(password: string, hash: string): Promise<Result<boolean, AppError>> {
      try {
        const isValid = await bcrypt.compare(password, hash);
        return success(isValid);
      } catch (error) {
        return failure(storageReadError('password_verification', error));
      }
    },

    async hashPassword(password: string): Promise<Result<string, AppError>> {
      try {
        const hash = await bcrypt.hash(password, SALT_ROUNDS);
        return success(hash);
      } catch (error) {
        return failure(storageWriteError('password_hashing', error));
      }
    },
  };
}
