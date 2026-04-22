// Use case: Get form snapshot for bootstrap
import type { GiftRepository, SubmissionRepository, FormRepository } from '../infrastructure/interfaces';
import type { Gift } from '../domain/types';
import type { AppError, Result } from '../domain/errors';
import {
  computeAvailableGifts,
  computeSelectedGifts,
  computeInactiveGifts,
  computeStats,
  computeTakenGiftIds,
} from '../domain/logic';
import { success, failure } from '../domain/errors';

export interface FormSnapshot {
  form: {
    id: string;
    slug: string;
    title: string;
    status: 'open' | 'closed';
  };
  gifts: {
    available: readonly Gift[];
    selected: readonly Gift[];
    inactive: readonly Gift[];
  };
  stats: {
    totalGifts: number;
    availableGifts: number;
    selectedGifts: number;
    inactiveGifts: number;
    totalSubmissions: number;
  };
  revision: number;
  websocketEndpoint: string;
}

export async function getFormSnapshot(
  slug: string,
  giftRepo: GiftRepository,
  submissionRepo: SubmissionRepository,
  formRepo: FormRepository
): Promise<Result<FormSnapshot, AppError>> {
  // Get form
  const formResult = await formRepo.findBySlug(slug);
  if (!formResult.success) {
    return formResult;
  }
  if (!formResult.data) {
    return failure({ type: 'GiftNotFoundError', message: 'Form not found', giftId: slug } as any);
  }

  const form = formResult.data;

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

  // Compute state
  const takenGiftIds = computeTakenGiftIds(submissions);
  const availableGifts = computeAvailableGifts(gifts, takenGiftIds);
  const selectedGifts = computeSelectedGifts(gifts, takenGiftIds);
  const inactiveGifts = computeInactiveGifts(gifts);
  const stats = computeStats(gifts, submissions);

  // Get revision from DO (for now, use a simple counter)
  const revision = submissions.length;

  return success({
    form: {
      id: form.id,
      slug: form.slug,
      title: form.title,
      status: form.status as 'open' | 'closed',
    },
    gifts: {
      available: availableGifts,
      selected: selectedGifts,
      inactive: inactiveGifts,
    },
    stats,
    revision,
    websocketEndpoint: `/ws/forms/${form.id}`,
  });
}
