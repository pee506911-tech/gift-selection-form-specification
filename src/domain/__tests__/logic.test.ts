// Unit tests for domain logic - pure functions, no I/O, fast execution
// Following TDD principles: test behavior, not implementation

import { describe, it, expect } from 'vitest';
import {
  validateNickname,
  validateGiftAvailability,
  findGiftById,
  canSubmitForm,
  computeTakenGiftIds,
  computeAvailableGifts,
  computeSelectedGifts,
  computeInactiveGifts,
  transitionGiftStatus,
  createSubmission,
  cancelSubmission,
  createGift,
  updateGift,
  computeStats,
  type TimeProvider,
  type IdGenerator,
} from '../logic';
import type {
  Gift,
  Submission,
  Settings,
  GiftId,
  SubmissionId,
  GiftCode,
  NonEmptyString,
  ISODateTime,
} from '../types';
import { parseGiftId, parseGiftCode, parseNonEmptyString, parseSubmissionId } from '../types';
import { isSuccess, isFailure } from '../errors';

// ============================================================================
// Test Fixtures - Pure data, no external dependencies
// ============================================================================

const fixedTime = '2024-01-15T10:30:00.000Z' as ISODateTime;

const timeProvider: TimeProvider = {
  now: () => fixedTime,
};

const idGenerator: IdGenerator = {
  generateGiftId: () => 'gift-001' as GiftId,
  generateSubmissionId: () => 'sub-001' as SubmissionId,
  generateFormId: () => 'form-001',
};

function createTestGift(overrides: Partial<Gift> = {}): Gift {
  return {
    id: parseGiftId('gift-001'),
    formId: 'form-001',
    code: parseGiftCode('GIFT001'),
    name: parseNonEmptyString('Test Gift'),
    description: 'A test gift',
    imageKey: null,
    sortOrder: 1,
    status: 'available',
    selectedSubmissionId: null,
    version: 1,
    createdAt: fixedTime,
    updatedAt: fixedTime,
    ...overrides,
  };
}

function createTestSubmission(overrides: Partial<Submission> = {}): Submission {
  return {
    id: parseSubmissionId('sub-001'),
    formId: 'form-001',
    nickname: parseNonEmptyString('TestUser'),
    giftId: parseGiftId('gift-001'),
    giftNameSnapshot: parseNonEmptyString('Test Gift'),
    createdAt: fixedTime,
    status: 'active',
    ...overrides,
  };
}

function createTestSettings(overrides: Partial<Settings> = {}): Settings {
  return {
    title: parseNonEmptyString('Gift Selection'),
    subtitle: parseNonEmptyString('Choose your gift'),
    instructions: parseNonEmptyString('Pick one gift'),
    allowDuplicateNicknames: false,
    successMessage: parseNonEmptyString('Thank you!'),
    showUnavailableGifts: false,
    pollingInterval: 5000,
    formOpen: true,
    ...overrides,
  };
}

// ============================================================================
// validateNickname
// ============================================================================

describe('validateNickname', () => {
  it('rejects_empty_nickname', () => {
    const settings = createTestSettings();
    const result = validateNickname('', settings, []);

    expect(isFailure(result)).toBe(true);
    if (isFailure(result)) {
      expect(result.error.type).toBe('NicknameRequiredError');
    }
  });

  it('rejects_whitespace_only_nickname', () => {
    const settings = createTestSettings();
    const result = validateNickname('   ', settings, []);

    expect(isFailure(result)).toBe(true);
    if (isFailure(result)) {
      expect(result.error.type).toBe('NicknameRequiredError');
    }
  });

  it('rejects_nickname_exceeding_max_length', () => {
    const settings = createTestSettings();
    const longNickname = 'a'.repeat(51);
    const result = validateNickname(longNickname, settings, []);

    expect(isFailure(result)).toBe(true);
    if (isFailure(result)) {
      expect(result.error.type).toBe('NicknameTooLongError');
      expect(result.error.maxLength).toBe(50);
      expect(result.error.actualLength).toBe(51);
    }
  });

  it('accepts_nickname_at_max_length', () => {
    const settings = createTestSettings();
    const maxNickname = 'a'.repeat(50);
    const result = validateNickname(maxNickname, settings, []);

    expect(isSuccess(result)).toBe(true);
    if (isSuccess(result)) {
      expect(result.data).toBe(maxNickname);
    }
  });

  it('trims_whitespace_from_nickname', () => {
    const settings = createTestSettings();
    const result = validateNickname('  validname  ', settings, []);

    expect(isSuccess(result)).toBe(true);
    if (isSuccess(result)) {
      expect(result.data).toBe('validname');
    }
  });

  it('rejects_duplicate_nickname_when_not_allowed', () => {
    const settings = createTestSettings({ allowDuplicateNicknames: false });
    const existingSubmissions = [
      createTestSubmission({ nickname: parseNonEmptyString('ExistingUser') }),
    ];
    const result = validateNickname('ExistingUser', settings, existingSubmissions);

    expect(isFailure(result)).toBe(true);
    if (isFailure(result)) {
      expect(result.error.type).toBe('DuplicateNicknameError');
      expect(result.error.nickname).toBe('ExistingUser');
    }
  });

  it('rejects_duplicate_nickname_case_insensitive', () => {
    const settings = createTestSettings({ allowDuplicateNicknames: false });
    const existingSubmissions = [
      createTestSubmission({ nickname: parseNonEmptyString('ExistingUser') }),
    ];
    const result = validateNickname('EXISTINGUSER', settings, existingSubmissions);

    expect(isFailure(result)).toBe(true);
    if (isFailure(result)) {
      expect(result.error.type).toBe('DuplicateNicknameError');
    }
  });

  it('accepts_duplicate_nickname_when_allowed', () => {
    const settings = createTestSettings({ allowDuplicateNicknames: true });
    const existingSubmissions = [
      createTestSubmission({ nickname: parseNonEmptyString('ExistingUser') }),
    ];
    const result = validateNickname('ExistingUser', settings, existingSubmissions);

    expect(isSuccess(result)).toBe(true);
  });

  it('ignores_cancelled_submissions_for_duplicate_check', () => {
    const settings = createTestSettings({ allowDuplicateNicknames: false });
    const existingSubmissions = [
      createTestSubmission({
        nickname: parseNonEmptyString('CancelledUser'),
        status: 'cancelled',
      }),
    ];
    const result = validateNickname('CancelledUser', settings, existingSubmissions);

    expect(isSuccess(result)).toBe(true);
  });

  it('accepts_valid_unique_nickname', () => {
    const settings = createTestSettings();
    const result = validateNickname('ValidUser', settings, []);

    expect(isSuccess(result)).toBe(true);
    if (isSuccess(result)) {
      expect(result.data).toBe('ValidUser');
    }
  });
});

// ============================================================================
// validateGiftAvailability
// ============================================================================

describe('validateGiftAvailability', () => {
  it('accepts_available_gift_not_in_taken_set', () => {
    const gift = createTestGift({ status: 'available' });
    const takenGiftIds = new Set<GiftId>();

    const result = validateGiftAvailability(gift, takenGiftIds);

    expect(isSuccess(result)).toBe(true);
  });

  it('rejects_gift_with_selected_status', () => {
    const gift = createTestGift({ status: 'selected' });
    const takenGiftIds = new Set<GiftId>();

    const result = validateGiftAvailability(gift, takenGiftIds);

    expect(isFailure(result)).toBe(true);
    if (isFailure(result)) {
      expect(result.error.type).toBe('GiftNotAvailableError');
      expect(result.error.giftId).toBe('gift-001');
    }
  });

  it('rejects_gift_with_inactive_status', () => {
    const gift = createTestGift({ status: 'inactive' });
    const takenGiftIds = new Set<GiftId>();

    const result = validateGiftAvailability(gift, takenGiftIds);

    expect(isFailure(result)).toBe(true);
    if (isFailure(result)) {
      expect(result.error.type).toBe('GiftNotAvailableError');
    }
  });

  it('rejects_available_gift_in_taken_set', () => {
    const gift = createTestGift({ status: 'available' });
    const takenGiftIds = new Set<GiftId>(['gift-001' as GiftId]);

    const result = validateGiftAvailability(gift, takenGiftIds);

    expect(isFailure(result)).toBe(true);
    if (isFailure(result)) {
      expect(result.error.type).toBe('GiftNotAvailableError');
    }
  });
});

// ============================================================================
// findGiftById
// ============================================================================

describe('findGiftById', () => {
  it('returns_gift_when_found', () => {
    const gift1 = createTestGift({ id: parseGiftId('gift-001') });
    const gift2 = createTestGift({ id: parseGiftId('gift-002') });
    const gifts = [gift1, gift2];

    const result = findGiftById(gifts, 'gift-001' as GiftId);

    expect(isSuccess(result)).toBe(true);
    if (isSuccess(result)) {
      expect(result.data.id).toBe('gift-001');
    }
  });

  it('returns_error_when_not_found', () => {
    const gifts: Gift[] = [];

    const result = findGiftById(gifts, 'nonexistent' as GiftId);

    expect(isFailure(result)).toBe(true);
    if (isFailure(result)) {
      expect(result.error.type).toBe('GiftNotFoundError');
      expect(result.error.giftId).toBe('nonexistent');
    }
  });
});

// ============================================================================
// canSubmitForm
// ============================================================================

describe('canSubmitForm', () => {
  it('returns_success_when_form_open', () => {
    const settings = createTestSettings({ formOpen: true });

    const result = canSubmitForm(settings);

    expect(isSuccess(result)).toBe(true);
  });

  it('returns_error_when_form_closed', () => {
    const settings = createTestSettings({ formOpen: false });

    const result = canSubmitForm(settings);

    expect(isFailure(result)).toBe(true);
    if (isFailure(result)) {
      expect(result.error.type).toBe('FormClosedError');
    }
  });
});

// ============================================================================
// computeTakenGiftIds
// ============================================================================

describe('computeTakenGiftIds', () => {
  it('returns_empty_set_for_no_submissions', () => {
    const result = computeTakenGiftIds([]);

    expect(result.size).toBe(0);
  });

  it('includes_gift_ids_from_active_submissions', () => {
    const submissions = [
      createTestSubmission({ giftId: parseGiftId('gift-001'), status: 'active' }),
      createTestSubmission({ giftId: parseGiftId('gift-002'), status: 'active' }),
    ];

    const result = computeTakenGiftIds(submissions);

    expect(result.size).toBe(2);
    expect(result.has('gift-001' as GiftId)).toBe(true);
    expect(result.has('gift-002' as GiftId)).toBe(true);
  });

  it('excludes_gift_ids_from_cancelled_submissions', () => {
    const submissions = [
      createTestSubmission({ giftId: parseGiftId('gift-001'), status: 'cancelled' }),
    ];

    const result = computeTakenGiftIds(submissions);

    expect(result.size).toBe(0);
  });
});

// ============================================================================
// computeAvailableGifts
// ============================================================================

describe('computeAvailableGifts', () => {
  it('returns_only_available_gifts_not_taken', () => {
    const gift1 = createTestGift({ id: parseGiftId('gift-001'), status: 'available' });
    const gift2 = createTestGift({ id: parseGiftId('gift-002'), status: 'available' });
    const gift3 = createTestGift({ id: parseGiftId('gift-003'), status: 'selected' });
    const gift4 = createTestGift({ id: parseGiftId('gift-004'), status: 'inactive' });
    const gifts = [gift1, gift2, gift3, gift4];
    const takenGiftIds = new Set<GiftId>(['gift-002' as GiftId]);

    const result = computeAvailableGifts(gifts, takenGiftIds);

    expect(result.length).toBe(1);
    expect(result[0].id).toBe('gift-001');
  });

  it('returns_empty_array_when_all_taken', () => {
    const gift1 = createTestGift({ id: parseGiftId('gift-001'), status: 'available' });
    const gifts = [gift1];
    const takenGiftIds = new Set<GiftId>(['gift-001' as GiftId]);

    const result = computeAvailableGifts(gifts, takenGiftIds);

    expect(result.length).toBe(0);
  });
});

// ============================================================================
// computeSelectedGifts
// ============================================================================

describe('computeSelectedGifts', () => {
  it('returns_gifts_with_selected_status_or_in_taken_set', () => {
    const gift1 = createTestGift({ id: parseGiftId('gift-001'), status: 'available' });
    const gift2 = createTestGift({ id: parseGiftId('gift-002'), status: 'selected' });
    const gift3 = createTestGift({ id: parseGiftId('gift-003'), status: 'inactive' });
    const gifts = [gift1, gift2, gift3];
    const takenGiftIds = new Set<GiftId>(['gift-001' as GiftId]);

    const result = computeSelectedGifts(gifts, takenGiftIds);

    expect(result.length).toBe(2);
    expect(result.map(g => g.id)).toContain('gift-001');
    expect(result.map(g => g.id)).toContain('gift-002');
  });
});

// ============================================================================
// computeInactiveGifts
// ============================================================================

describe('computeInactiveGifts', () => {
  it('returns_only_inactive_gifts', () => {
    const gift1 = createTestGift({ status: 'available' });
    const gift2 = createTestGift({ status: 'inactive' });
    const gifts = [gift1, gift2];

    const result = computeInactiveGifts(gifts);

    expect(result.length).toBe(1);
    expect(result[0].status).toBe('inactive');
  });
});

// ============================================================================
// transitionGiftStatus
// ============================================================================

describe('transitionGiftStatus', () => {
  it('updates_status_and_timestamp', () => {
    const gift = createTestGift({ status: 'available' });
    const newTime = '2024-01-16T12:00:00.000Z' as ISODateTime;
    const customTimeProvider: TimeProvider = { now: () => newTime };

    const result = transitionGiftStatus(gift, 'selected', customTimeProvider);

    expect(result.status).toBe('selected');
    expect(result.updatedAt).toBe(newTime);
    expect(result.id).toBe(gift.id); // immutable - other fields preserved
  });

  it('preserves_immutability_of_original', () => {
    const gift = createTestGift({ status: 'available' });

    transitionGiftStatus(gift, 'selected', timeProvider);

    expect(gift.status).toBe('available'); // original unchanged
  });
});

// ============================================================================
// createSubmission
// ============================================================================

describe('createSubmission', () => {
  it('creates_submission_with_all_required_fields', () => {
    const gift = createTestGift();
    const nickname = parseNonEmptyString('TestUser');

    const result = createSubmission(nickname, gift, idGenerator, timeProvider);

    expect(result.id).toBe('sub-001');
    expect(result.formId).toBe(gift.formId);
    expect(result.nickname).toBe('TestUser');
    expect(result.giftId).toBe(gift.id);
    expect(result.giftNameSnapshot).toBe(gift.name);
    expect(result.createdAt).toBe(fixedTime);
    expect(result.status).toBe('active');
  });
});

// ============================================================================
// cancelSubmission
// ============================================================================

describe('cancelSubmission', () => {
  it('sets_status_to_cancelled', () => {
    const submission = createTestSubmission({ status: 'active' });

    const result = cancelSubmission(submission);

    expect(result.status).toBe('cancelled');
  });

  it('preserves_other_fields', () => {
    const submission = createTestSubmission();

    const result = cancelSubmission(submission);

    expect(result.id).toBe(submission.id);
    expect(result.nickname).toBe(submission.nickname);
    expect(result.giftId).toBe(submission.giftId);
  });

  it('preserves_immutability_of_original', () => {
    const submission = createTestSubmission({ status: 'active' });

    cancelSubmission(submission);

    expect(submission.status).toBe('active');
  });
});

// ============================================================================
// createGift
// ============================================================================

describe('createGift', () => {
  it('creates_gift_with_all_required_fields', () => {
    const data = {
      formId: 'form-001',
      code: 'GIFT001',
      name: 'New Gift',
      description: 'Description',
      imageKey: 'image.png',
      status: 'available' as const,
      sortOrder: 1,
    };

    const result = createGift(data, idGenerator, timeProvider);

    expect(result.id).toBe('gift-001');
    expect(result.formId).toBe('form-001');
    expect(result.code).toBe('GIFT001');
    expect(result.name).toBe('New Gift');
    expect(result.description).toBe('Description');
    expect(result.imageKey).toBe('image.png');
    expect(result.status).toBe('available');
    expect(result.sortOrder).toBe(1);
    expect(result.selectedSubmissionId).toBeNull();
    expect(result.version).toBe(1);
    expect(result.createdAt).toBe(fixedTime);
    expect(result.updatedAt).toBe(fixedTime);
  });

  it('handles_null_image_key', () => {
    const data = {
      formId: 'form-001',
      code: 'GIFT001',
      name: 'New Gift',
      description: 'Description',
      imageKey: null,
      status: 'available' as const,
      sortOrder: 1,
    };

    const result = createGift(data, idGenerator, timeProvider);

    expect(result.imageKey).toBeNull();
  });
});

// ============================================================================
// updateGift
// ============================================================================

describe('updateGift', () => {
  it('applies_updates_and_increments_version', () => {
    const gift = createTestGift({ version: 1 });
    const newTime = '2024-01-16T12:00:00.000Z' as ISODateTime;
    const customTimeProvider: TimeProvider = { now: () => newTime };

    const result = updateGift(gift, { name: parseNonEmptyString('Updated Name') }, customTimeProvider);

    expect(result.name).toBe('Updated Name');
    expect(result.version).toBe(2);
    expect(result.updatedAt).toBe(newTime);
  });

  it('preserves_id_and_createdAt', () => {
    const gift = createTestGift();

    const result = updateGift(gift, { name: parseNonEmptyString('Updated') }, timeProvider);

    expect(result.id).toBe(gift.id);
    expect(result.createdAt).toBe(gift.createdAt);
  });

  it('preserves_immutability_of_original', () => {
    const gift = createTestGift({ version: 1 });

    updateGift(gift, { name: parseNonEmptyString('Updated') }, timeProvider);

    expect(gift.version).toBe(1);
  });
});

// ============================================================================
// computeStats
// ============================================================================

describe('computeStats', () => {
  it('computes_correct_statistics', () => {
    const gift1 = createTestGift({ id: parseGiftId('gift-001'), status: 'available' });
    const gift2 = createTestGift({ id: parseGiftId('gift-002'), status: 'available' });
    const gift3 = createTestGift({ id: parseGiftId('gift-003'), status: 'selected' });
    const gift4 = createTestGift({ id: parseGiftId('gift-004'), status: 'inactive' });
    const gifts = [gift1, gift2, gift3, gift4];

    const submission1 = createTestSubmission({
      giftId: parseGiftId('gift-001'),
      status: 'active',
    });
    const submission2 = createTestSubmission({
      giftId: parseGiftId('gift-002'),
      status: 'cancelled',
    });
    const submissions = [submission1, submission2];

    const result = computeStats(gifts, submissions);

    expect(result.totalGifts).toBe(4);
    expect(result.availableGifts).toBe(1); // gift-001 is taken, gift-002 is available
    expect(result.selectedGifts).toBe(2); // gift-001 (taken) + gift-003 (selected status)
    expect(result.inactiveGifts).toBe(1);
    expect(result.totalSubmissions).toBe(1); // only active submissions count
  });

  it('returns_zeros_for_empty_data', () => {
    const result = computeStats([], []);

    expect(result.totalGifts).toBe(0);
    expect(result.availableGifts).toBe(0);
    expect(result.selectedGifts).toBe(0);
    expect(result.inactiveGifts).toBe(0);
    expect(result.totalSubmissions).toBe(0);
  });
});
