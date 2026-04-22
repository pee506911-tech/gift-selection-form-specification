// Pure domain logic - no infrastructure dependencies
// All functions are deterministic and testable in memory

import type {
  Gift,
  Submission,
  Settings,
  GiftStatus,
  GiftId,
  SubmissionId,
  NonEmptyString,
  ISODateTime,
} from './types';
import { parseGiftCode, parseNonEmptyString } from './types';
import type { DomainError, Result } from './errors';
import {
  formClosedError,
  nicknameRequiredError,
  nicknameTooLongError,
  duplicateNicknameError,
  giftNotAvailableError,
  giftNotFoundError,
  success,
  failure,
} from './errors';

// Dependencies for time and randomness - injected from outside
export interface TimeProvider {
  readonly now: () => ISODateTime;
}

export interface IdGenerator {
  readonly generateGiftId: () => GiftId;
  readonly generateSubmissionId: () => SubmissionId;
  readonly generateFormId: () => string;
}

// Validation functions - pure and deterministic

export function validateNickname(
  nickname: string,
  settings: Settings,
  existingSubmissions: readonly Submission[]
): Result<NonEmptyString, DomainError> {
  const trimmed = nickname.trim();

  if (!trimmed) {
    return failure<NonEmptyString, DomainError>(nicknameRequiredError());
  }

  if (trimmed.length > 50) {
    return failure<NonEmptyString, DomainError>(nicknameTooLongError(50, trimmed.length));
  }

  if (!settings.allowDuplicateNicknames) {
    const exists = existingSubmissions.some(
      s => s.nickname.toLowerCase() === trimmed.toLowerCase() && s.status === 'active'
    );
    if (exists) {
      return failure<NonEmptyString, DomainError>(duplicateNicknameError(trimmed));
    }
  }

  return success(trimmed as NonEmptyString);
}

export function validateGiftAvailability(
  gift: Gift,
  takenGiftIds: ReadonlySet<GiftId>
): Result<Gift, DomainError> {
  if (gift.status !== 'available') {
    return failure<Gift, DomainError>(giftNotAvailableError(gift.id));
  }
  
  if (takenGiftIds.has(gift.id)) {
    return failure<Gift, DomainError>(giftNotAvailableError(gift.id));
  }
  
  return success(gift);
}

export function findGiftById(
  gifts: readonly Gift[],
  giftId: GiftId
): Result<Gift, DomainError> {
  const gift = gifts.find(g => g.id === giftId);
  if (!gift) {
    return failure<Gift, DomainError>(giftNotFoundError(giftId));
  }
  return success(gift);
}

export function canSubmitForm(settings: Settings): Result<void, DomainError> {
  if (!settings.formOpen) {
    return failure<void, DomainError>(formClosedError());
  }
  return success(undefined);
}

export function computeTakenGiftIds(submissions: readonly Submission[]): ReadonlySet<GiftId> {
  return new Set(
    submissions
      .filter(s => s.status === 'active')
      .map(s => s.giftId)
  );
}

export function computeAvailableGifts(
  gifts: readonly Gift[],
  takenGiftIds: ReadonlySet<GiftId>
): readonly Gift[] {
  return gifts.filter(g => g.status === 'available' && !takenGiftIds.has(g.id));
}

export function computeSelectedGifts(
  gifts: readonly Gift[],
  takenGiftIds: ReadonlySet<GiftId>
): readonly Gift[] {
  return gifts.filter(g => g.status === 'selected' || takenGiftIds.has(g.id));
}

export function computeInactiveGifts(gifts: readonly Gift[]): readonly Gift[] {
  return gifts.filter(g => g.status === 'inactive');
}

export function transitionGiftStatus(
  gift: Gift,
  newStatus: GiftStatus,
  timeProvider: TimeProvider
): Gift {
  return {
    ...gift,
    status: newStatus,
    updatedAt: timeProvider.now(),
  };
}

export function createSubmission(
  nickname: NonEmptyString,
  gift: Gift,
  idGenerator: IdGenerator,
  timeProvider: TimeProvider
): Submission {
  return {
    id: idGenerator.generateSubmissionId(),
    formId: gift.formId,
    nickname,
    giftId: gift.id,
    giftNameSnapshot: gift.name,
    createdAt: timeProvider.now(),
    status: 'active',
  };
}

export function cancelSubmission(submission: Submission): Submission {
  return {
    ...submission,
    status: 'cancelled',
  };
}

export function createGift(
  data: {
    formId: string;
    code: string;
    name: string;
    description: string;
    imageKey: string | null;
    status: GiftStatus;
    sortOrder: number;
  },
  idGenerator: IdGenerator,
  timeProvider: TimeProvider
): Gift {
  const now = timeProvider.now();
  return {
    id: idGenerator.generateGiftId(),
    formId: data.formId,
    code: parseGiftCode(data.code),
    name: parseNonEmptyString(data.name),
    description: data.description,
    imageKey: data.imageKey,
    status: data.status,
    sortOrder: data.sortOrder,
    selectedSubmissionId: null,
    version: 1,
    createdAt: now,
    updatedAt: now,
  };
}

export function updateGift(
  gift: Gift,
  updates: Partial<Omit<Gift, 'id' | 'createdAt' | 'version'>>,
  timeProvider: TimeProvider
): Gift {
  return {
    ...gift,
    ...updates,
    version: gift.version + 1,
    updatedAt: timeProvider.now(),
  };
}

// Statistics computation - pure and deterministic

export interface Stats {
  readonly totalGifts: number;
  readonly availableGifts: number;
  readonly selectedGifts: number;
  readonly inactiveGifts: number;
  readonly totalSubmissions: number;
}

export function computeStats(
  gifts: readonly Gift[],
  submissions: readonly Submission[]
): Stats {
  const activeSubmissions = submissions.filter(s => s.status === 'active');
  const takenGiftIds = computeTakenGiftIds(activeSubmissions);
  
  return {
    totalGifts: gifts.length,
    availableGifts: computeAvailableGifts(gifts, takenGiftIds).length,
    selectedGifts: computeSelectedGifts(gifts, takenGiftIds).length,
    inactiveGifts: computeInactiveGifts(gifts).length,
    totalSubmissions: activeSubmissions.length,
  };
}
