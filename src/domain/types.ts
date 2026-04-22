// Domain types following "Make Invalid States Unrepresentable" principle
// All types enforce invariants at the boundary, trusted in the interior

export type GiftId = string & { readonly __brand: unique symbol };
export type SubmissionId = string & { readonly __brand: unique symbol };
export type GiftCode = string & { readonly __brand: unique symbol };
export type NonEmptyString = string & { readonly __brand: unique symbol };
export type ISODateTime = string & { readonly __brand: unique symbol };

export type GiftStatus = 'available' | 'selected' | 'inactive';
export type SubmissionStatus = 'active' | 'cancelled';

export interface Gift {
  readonly id: GiftId;
  readonly formId: string;
  readonly code: GiftCode;
  readonly name: NonEmptyString;
  readonly description: string;
  readonly imageKey: string | null;
  readonly sortOrder: number;
  readonly status: GiftStatus;
  readonly selectedSubmissionId: string | null;
  readonly version: number;
  readonly createdAt: ISODateTime;
  readonly updatedAt: ISODateTime;
}

export interface Submission {
  readonly id: SubmissionId;
  readonly formId: string;
  readonly giftId: GiftId;
  readonly nickname: NonEmptyString;
  readonly giftNameSnapshot: NonEmptyString;
  readonly createdAt: ISODateTime;
  readonly status: SubmissionStatus;
  readonly adminNotes?: string;
}

export interface Settings {
  readonly title: NonEmptyString;
  readonly subtitle: NonEmptyString;
  readonly instructions: NonEmptyString;
  readonly allowDuplicateNicknames: boolean;
  readonly successMessage: NonEmptyString;
  readonly showUnavailableGifts: boolean;
  readonly pollingInterval: number;
  readonly formOpen: boolean;
}

// Type guards for runtime validation
export function isGiftId(value: unknown): value is GiftId {
  return typeof value === 'string' && value.length > 0;
}

export function isGiftCode(value: unknown): value is GiftCode {
  return typeof value === 'string' && value.length > 0;
}

export function isNonEmptyString(value: unknown): value is NonEmptyString {
  return typeof value === 'string' && value.trim().length > 0;
}

export function isISODateTime(value: unknown): value is ISODateTime {
  if (typeof value !== 'string') return false;
  const date = new Date(value);
  return !isNaN(date.getTime());
}

export function isGiftStatus(value: unknown): value is GiftStatus {
  return value === 'available' || value === 'selected' || value === 'inactive';
}

export function isSubmissionStatus(value: unknown): value is SubmissionStatus {
  return value === 'active' || value === 'cancelled';
}

export function isSubmissionId(value: unknown): value is SubmissionId {
  return typeof value === 'string' && value.length > 0;
}

export function isNickname(value: unknown): value is NonEmptyString {
  return typeof value === 'string' && value.trim().length > 0 && value.length <= 50;
}

// Parser functions for runtime validation at boundaries
export function parseGiftId(value: string): GiftId {
  if (!isGiftId(value)) {
    throw new Error(`Invalid GiftId: ${value}`);
  }
  return value as GiftId;
}

export function parseGiftCode(value: string): GiftCode {
  if (!isGiftCode(value)) {
    throw new Error(`Invalid GiftCode: ${value}`);
  }
  return value as GiftCode;
}

export function parseNonEmptyString(value: string): NonEmptyString {
  if (!isNonEmptyString(value)) {
    throw new Error(`Invalid NonEmptyString: ${value}`);
  }
  return value as NonEmptyString;
}

export function parseSubmissionId(value: string): SubmissionId {
  if (!isSubmissionId(value)) {
    throw new Error(`Invalid SubmissionId: ${value}`);
  }
  return value as SubmissionId;
}

export function parseNickname(value: string): NonEmptyString {
  if (!isNickname(value)) {
    throw new Error(`Invalid Nickname: ${value}`);
  }
  return value as NonEmptyString;
}
