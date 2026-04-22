// Use case: Submit gift selection
import type { GiftRepository, SubmissionRepository, FormRepository, Clock, IdGenerator } from '../infrastructure/interfaces';
import type { GiftId, Submission } from '../domain/types';
import type { AppError, Result } from '../domain/errors';
import {
  validateNickname,
  validateGiftAvailability,
  findGiftById,
  canSubmitForm,
  computeTakenGiftIds,
  createSubmission,
} from '../domain/logic';
import { success, failure } from '../domain/errors';

export interface SubmitSelectionRequest {
  nickname: string;
  giftId: string;
}

export async function submitGiftSelection(
  slug: string,
  request: SubmitSelectionRequest,
  giftRepo: GiftRepository,
  submissionRepo: SubmissionRepository,
  formRepo: FormRepository,
  clock: Clock,
  idGenerator: IdGenerator
): Promise<Result<Submission, AppError>> {
  // Get form
  const formResult = await formRepo.findBySlug(slug);
  if (!formResult.success) {
    return formResult;
  }
  if (!formResult.data) {
    return failure({ type: 'GiftNotFoundError', message: 'Form not found', giftId: slug } as any);
  }

  const form = formResult.data;

  // Check if form is open
  const formOpenCheck = canSubmitForm({ isOpen: form.status === 'open', allowDuplicateNicknames: false });
  if (!formOpenCheck.success) {
    return formOpenCheck;
  }

  // Get all gifts and submissions
  const giftsResult = await giftRepo.findByFormId(form.id);
  if (!giftsResult.success) {
    return giftsResult;
  }

  const submissionsResult = await submissionRepo.findByFormId(form.id);
  if (!submissionsResult.success) {
    return submissionsResult;
  }

  const gifts = giftsResult.data;
  const submissions = submissionsResult.data;

  // Validate nickname
  const nicknameResult = validateNickname(
    request.nickname,
    { isOpen: form.status === 'open', allowDuplicateNicknames: false },
    submissions
  );
  if (!nicknameResult.success) {
    return nicknameResult;
  }

  // Find and validate gift
  const giftResult = findGiftById(gifts, request.giftId as GiftId);
  if (!giftResult.success) {
    return giftResult;
  }

  const takenGiftIds = computeTakenGiftIds(submissions);
  const availabilityResult = validateGiftAvailability(giftResult.data, takenGiftIds);
  if (!availabilityResult.success) {
    return availabilityResult;
  }

  // Create submission
  const submission = createSubmission(
    nicknameResult.data,
    giftResult.data,
    idGenerator,
    clock
  );

  // Update gift status atomically with optimistic locking to prevent race conditions
  const atomicUpdateResult = await giftRepo.selectGiftAtomically(
    giftResult.data.id,
    submission.id,
    giftResult.data.version
  );

  if (!atomicUpdateResult.success) {
    // Gift was already selected by another user
    return failure({
      type: 'GiftNotAvailableError',
      message: 'Sorry, this gift was just selected by someone else. Please choose another gift.',
      giftId: giftResult.data.id,
    });
  }

  // Save submission after successful gift update
  const saveSubmissionResult = await submissionRepo.save(submission);
  if (!saveSubmissionResult.success) {
    return saveSubmissionResult;
  }

  return success(submission);
}
