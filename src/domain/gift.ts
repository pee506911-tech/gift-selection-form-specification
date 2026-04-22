// Re-export all types from types.ts for backward compatibility
// This file is deprecated - import from types.ts instead
export type {
  GiftId,
  GiftCode,
  NonEmptyString,
  ISODateTime,
  GiftStatus,
  Gift,
} from './types';
export {
  isGiftId,
  isGiftCode,
  isNonEmptyString,
  isISODateTime,
  isGiftStatus,
  parseGiftId,
  parseGiftCode,
  parseNonEmptyString,
} from './types';
