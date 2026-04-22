// Re-export all types from types.ts for backward compatibility
// This file is deprecated - import from types.ts instead
export type {
  SubmissionId,
  Submission,
  SubmissionStatus,
} from './types';
export {
  isSubmissionId,
  isNickname,
  isSubmissionStatus,
  parseSubmissionId,
  parseNickname,
} from './types';
