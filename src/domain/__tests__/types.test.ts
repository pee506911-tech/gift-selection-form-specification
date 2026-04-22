// Unit tests for domain type guards and parsers
// Testing runtime validation at boundaries

import { describe, it, expect } from 'vitest';
import {
  isGiftId,
  isGiftCode,
  isNonEmptyString,
  isISODateTime,
  isGiftStatus,
  isSubmissionStatus,
  isSubmissionId,
  isNickname,
  parseGiftId,
  parseGiftCode,
  parseNonEmptyString,
  parseSubmissionId,
  parseNickname,
} from '../types';

// ============================================================================
// Type Guards
// ============================================================================

describe('isGiftId', () => {
  it('returns_true_for_non_empty_string', () => {
    expect(isGiftId('gift-001')).toBe(true);
  });

  it('returns_false_for_empty_string', () => {
    expect(isGiftId('')).toBe(false);
  });

  it('returns_false_for_non_string', () => {
    expect(isGiftId(123)).toBe(false);
    expect(isGiftId(null)).toBe(false);
    expect(isGiftId(undefined)).toBe(false);
  });
});

describe('isGiftCode', () => {
  it('returns_true_for_non_empty_string', () => {
    expect(isGiftCode('GIFT001')).toBe(true);
  });

  it('returns_false_for_empty_string', () => {
    expect(isGiftCode('')).toBe(false);
  });

  it('returns_false_for_non_string', () => {
    expect(isGiftCode(null)).toBe(false);
  });
});

describe('isNonEmptyString', () => {
  it('returns_true_for_non_empty_string', () => {
    expect(isNonEmptyString('hello')).toBe(true);
  });

  it('returns_false_for_empty_string', () => {
    expect(isNonEmptyString('')).toBe(false);
  });

  it('returns_false_for_whitespace_only', () => {
    expect(isNonEmptyString('   ')).toBe(false);
  });

  it('returns_false_for_non_string', () => {
    expect(isNonEmptyString(null)).toBe(false);
    expect(isNonEmptyString(undefined)).toBe(false);
    expect(isNonEmptyString(123)).toBe(false);
  });
});

describe('isISODateTime', () => {
  it('returns_true_for_valid_iso_string', () => {
    expect(isISODateTime('2024-01-15T10:30:00.000Z')).toBe(true);
    expect(isISODateTime('2024-01-15T10:30:00Z')).toBe(true);
    expect(isISODateTime('2024-01-15')).toBe(true);
  });

  it('returns_false_for_invalid_date_string', () => {
    expect(isISODateTime('not-a-date')).toBe(false);
    expect(isISODateTime('2024-13-45')).toBe(false);
  });

  it('returns_false_for_non_string', () => {
    expect(isISODateTime(null)).toBe(false);
    expect(isISODateTime(123456789)).toBe(false);
  });
});

describe('isGiftStatus', () => {
  it('returns_true_for_valid_statuses', () => {
    expect(isGiftStatus('available')).toBe(true);
    expect(isGiftStatus('selected')).toBe(true);
    expect(isGiftStatus('inactive')).toBe(true);
  });

  it('returns_false_for_invalid_status', () => {
    expect(isGiftStatus('pending')).toBe(false);
    expect(isGiftStatus('')).toBe(false);
  });

  it('returns_false_for_non_string', () => {
    expect(isGiftStatus(null)).toBe(false);
  });
});

describe('isSubmissionStatus', () => {
  it('returns_true_for_valid_statuses', () => {
    expect(isSubmissionStatus('active')).toBe(true);
    expect(isSubmissionStatus('cancelled')).toBe(true);
  });

  it('returns_false_for_invalid_status', () => {
    expect(isSubmissionStatus('pending')).toBe(false);
  });

  it('returns_false_for_non_string', () => {
    expect(isSubmissionStatus(null)).toBe(false);
  });
});

describe('isSubmissionId', () => {
  it('returns_true_for_non_empty_string', () => {
    expect(isSubmissionId('sub-001')).toBe(true);
  });

  it('returns_false_for_empty_string', () => {
    expect(isSubmissionId('')).toBe(false);
  });

  it('returns_false_for_non_string', () => {
    expect(isSubmissionId(null)).toBe(false);
  });
});

describe('isNickname', () => {
  it('returns_true_for_valid_nickname', () => {
    expect(isNickname('ValidUser')).toBe(true);
  });

  it('returns_true_for_nickname_at_max_length', () => {
    expect(isNickname('a'.repeat(50))).toBe(true);
  });

  it('returns_false_for_empty_string', () => {
    expect(isNickname('')).toBe(false);
  });

  it('returns_false_for_whitespace_only', () => {
    expect(isNickname('   ')).toBe(false);
  });

  it('returns_false_for_nickname_exceeding_max_length', () => {
    expect(isNickname('a'.repeat(51))).toBe(false);
  });

  it('returns_false_for_non_string', () => {
    expect(isNickname(null)).toBe(false);
  });
});

// ============================================================================
// Parser Functions
// ============================================================================

describe('parseGiftId', () => {
  it('returns_GiftId_for_valid_string', () => {
    const result = parseGiftId('gift-001');
    expect(result).toBe('gift-001');
  });

  it('throws_for_empty_string', () => {
    expect(() => parseGiftId('')).toThrow('Invalid GiftId');
  });
});

describe('parseGiftCode', () => {
  it('returns_GiftCode_for_valid_string', () => {
    const result = parseGiftCode('GIFT001');
    expect(result).toBe('GIFT001');
  });

  it('throws_for_empty_string', () => {
    expect(() => parseGiftCode('')).toThrow('Invalid GiftCode');
  });
});

describe('parseNonEmptyString', () => {
  it('returns_NonEmptyString_for_valid_string', () => {
    const result = parseNonEmptyString('hello');
    expect(result).toBe('hello');
  });

  it('throws_for_empty_string', () => {
    expect(() => parseNonEmptyString('')).toThrow('Invalid NonEmptyString');
  });

  it('throws_for_whitespace_only', () => {
    expect(() => parseNonEmptyString('   ')).toThrow('Invalid NonEmptyString');
  });
});

describe('parseSubmissionId', () => {
  it('returns_SubmissionId_for_valid_string', () => {
    const result = parseSubmissionId('sub-001');
    expect(result).toBe('sub-001');
  });

  it('throws_for_empty_string', () => {
    expect(() => parseSubmissionId('')).toThrow('Invalid SubmissionId');
  });
});

describe('parseNickname', () => {
  it('returns_NonEmptyString_for_valid_nickname', () => {
    const result = parseNickname('ValidUser');
    expect(result).toBe('ValidUser');
  });

  it('throws_for_empty_string', () => {
    expect(() => parseNickname('')).toThrow('Invalid Nickname');
  });

  it('throws_for_nickname_exceeding_max_length', () => {
    expect(() => parseNickname('a'.repeat(51))).toThrow('Invalid Nickname');
  });
});
