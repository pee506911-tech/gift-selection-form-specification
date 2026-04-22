// Typed errors following "Errors Are Values With Structure" principle
// Every failure path is part of the contract with explicit structure

// Domain errors - business rule violations
export type DomainError =
  | FormClosedError
  | NicknameRequiredError
  | NicknameTooLongError
  | DuplicateNicknameError
  | GiftNotAvailableError
  | GiftNotFoundError
  | InvalidGiftStatusError;

export interface FormClosedError {
  readonly type: 'FormClosedError';
  readonly message: 'The gift selection form is currently closed.';
}

export interface NicknameRequiredError {
  readonly type: 'NicknameRequiredError';
  readonly message: 'Please enter your nickname.';
}

export interface NicknameTooLongError {
  readonly type: 'NicknameTooLongError';
  readonly message: 'Nickname must be 50 characters or less.';
  readonly maxLength: number;
  readonly actualLength: number;
}

export interface DuplicateNicknameError {
  readonly type: 'DuplicateNicknameError';
  readonly message: 'This nickname has already submitted a selection.';
  readonly nickname: string;
}

export interface GiftNotAvailableError {
  readonly type: 'GiftNotAvailableError';
  readonly message: 'Sorry, this gift was just selected by someone else. Please choose another gift.';
  readonly giftId: string;
}

export interface GiftNotFoundError {
  readonly type: 'GiftNotFoundError';
  readonly message: 'Gift not found.';
  readonly giftId: string;
}

export interface InvalidGiftStatusError {
  readonly type: 'InvalidGiftStatusError';
  readonly message: 'Invalid gift status transition.';
  readonly currentStatus: string;
  readonly requestedStatus: string;
}

// Infrastructure errors - I/O, serialization, etc.
export type InfrastructureError =
  | StorageReadError
  | StorageWriteError
  | SerializationError
  | DeserializationError;

export interface StorageReadError {
  readonly type: 'StorageReadError';
  readonly message: 'Failed to read from storage.';
  readonly key: string;
  readonly cause?: unknown;
}

export interface StorageWriteError {
  readonly type: 'StorageWriteError';
  readonly message: 'Failed to write to storage.';
  readonly key: string;
  readonly cause?: unknown;
}

export interface SerializationError {
  readonly type: 'SerializationError';
  readonly message: 'Failed to serialize data.';
  readonly cause?: unknown;
}

export interface DeserializationError {
  readonly type: 'DeserializationError';
  readonly message: 'Failed to deserialize data.';
  readonly cause?: unknown;
}

// Combined error type
export type AppError = DomainError | InfrastructureError;

// Result type for operations that can fail - properly generic
export type Result<T, E = AppError> =
  | { readonly success: true; readonly data: T }
  | { readonly success: false; readonly error: E };

// Helper functions to construct errors
export const formClosedError = (): FormClosedError => ({
  type: 'FormClosedError',
  message: 'The gift selection form is currently closed.',
});

export const nicknameRequiredError = (): NicknameRequiredError => ({
  type: 'NicknameRequiredError',
  message: 'Please enter your nickname.',
});

export const nicknameTooLongError = (maxLength: number, actualLength: number): NicknameTooLongError => ({
  type: 'NicknameTooLongError',
  message: 'Nickname must be 50 characters or less.',
  maxLength,
  actualLength,
});

export const duplicateNicknameError = (nickname: string): DuplicateNicknameError => ({
  type: 'DuplicateNicknameError',
  message: 'This nickname has already submitted a selection.',
  nickname,
});

export const giftNotAvailableError = (giftId: string): GiftNotAvailableError => ({
  type: 'GiftNotAvailableError',
  message: 'Sorry, this gift was just selected by someone else. Please choose another gift.',
  giftId,
});

export const giftNotFoundError = (giftId: string): GiftNotFoundError => ({
  type: 'GiftNotFoundError',
  message: 'Gift not found.',
  giftId,
});

export const invalidGiftStatusError = (currentStatus: string, requestedStatus: string): InvalidGiftStatusError => ({
  type: 'InvalidGiftStatusError',
  message: 'Invalid gift status transition.',
  currentStatus,
  requestedStatus,
});

export const storageReadError = (key: string, cause?: unknown): StorageReadError => ({
  type: 'StorageReadError',
  message: 'Failed to read from storage.',
  key,
  cause,
});

export const storageWriteError = (key: string, cause?: unknown): StorageWriteError => ({
  type: 'StorageWriteError',
  message: 'Failed to write to storage.',
  key,
  cause,
});

export const serializationError = (cause?: unknown): SerializationError => ({
  type: 'SerializationError',
  message: 'Failed to serialize data.',
  cause,
});

export const deserializationError = (cause?: unknown): DeserializationError => ({
  type: 'DeserializationError',
  message: 'Failed to deserialize data.',
  cause,
});

// Helper functions to construct results
export const success = <T, E = AppError>(data: T): Result<T, E> => ({
  success: true,
  data,
});

export const failure = <T, E = AppError>(error: E): Result<T, E> => ({
  success: false,
  error,
});

// Type guard for success
export function isSuccess<T, E>(result: Result<T, E>): result is { success: true; data: T } {
  return result.success === true;
}

// Type guard for failure
export function isFailure<T, E>(result: Result<T, E>): result is { success: false; error: E } {
  return result.success === false;
}
