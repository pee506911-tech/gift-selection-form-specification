// Utility implementations for Clock and IdGenerator
import type { Clock, IdGenerator } from './interfaces';
import type { GiftId, SubmissionId } from '../domain/types';

// Real-time clock implementation
export function createRealClock(): Clock {
  return {
    now(): string {
      return new Date().toISOString();
    },
  };
}

// UUID-based ID generator
export function createUuidIdGenerator(): IdGenerator {
  return {
    generateGiftId: () => crypto.randomUUID() as GiftId,
    generateSubmissionId: () => crypto.randomUUID() as SubmissionId,
    generateFormId: () => crypto.randomUUID(),
  };
}
