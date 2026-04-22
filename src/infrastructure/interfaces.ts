// Infrastructure interfaces - domain defines the contract, infrastructure implements it
// This follows "Dependencies Must Flow Inward" principle

import type { Gift, GiftId, Submission, SubmissionId } from '../domain/types';
import type { AppError, Result } from '../domain/errors';

export interface GiftRepository {
  findByFormId(formId: string): Promise<Result<Gift[], AppError>>;
  findById(id: GiftId): Promise<Result<Gift, AppError>>;
  save(gift: Gift): Promise<Result<void, AppError>>;
  delete(id: GiftId): Promise<Result<void, AppError>>;
  selectGiftAtomically(giftId: GiftId, submissionId: string, expectedVersion: number): Promise<Result<void, AppError>>;
}

export interface SubmissionRepository {
  findByFormId(formId: string): Promise<Result<Submission[], AppError>>;
  findByFormIdPaginated(formId: string, page: number, limit: number): Promise<Result<{ submissions: Submission[]; total: number }, AppError>>;
  findByGiftId(giftId: GiftId): Promise<Result<Submission[], AppError>>;
  save(submission: Submission): Promise<Result<void, AppError>>;
  delete(id: string): Promise<Result<void, AppError>>;
}

export interface FormRepository {
  findBySlug(slug: string): Promise<Result<{ id: string; slug: string; title: string; status: string } | null, AppError>>;
  save(form: { id: string; slug: string; title: string; status: string }): Promise<Result<void, AppError>>;
}

export interface ImageStore {
  upload(formId: string, giftId: string, file: File, contentType: string): Promise<Result<string, AppError>>;
  delete(key: string): Promise<Result<void, AppError>>;
  getUrl(key: string): string;
}

export interface RealtimePublisher {
  publishGiftSelected(formId: string, giftId: GiftId): Promise<void>;
  publishGiftUpdated(formId: string, giftId: GiftId): Promise<void>;
  publishGiftRemoved(formId: string, giftId: GiftId): Promise<void>;
  publishFormClosed(formId: string): Promise<void>;
}

export interface Clock {
  now(): string;
}

export interface IdGenerator {
  readonly generateGiftId: () => GiftId;
  readonly generateSubmissionId: () => SubmissionId;
  readonly generateFormId: () => string;
}
