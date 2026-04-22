// TiDB/D1 Submission repository implementation
import type { SubmissionRepository } from '../interfaces';
import type { Submission, GiftId } from '../../domain/types';
import type { AppError, Result } from '../../domain/errors';
import { success, failure } from '../../domain/errors';
import type { TiDBConnection } from './connection';

export function createSubmissionRepository(db: TiDBConnection): SubmissionRepository {
  return {
    async findByFormId(formId: string): Promise<Result<Submission[], AppError>> {
      const result = await db.query(
        'SELECT * FROM submissions WHERE form_id = ? ORDER BY created_at DESC',
        [formId]
      );

      if (!result.success) {
        return result;
      }

      const submissions = result.data.map(row => mapRowToSubmission(row));
      return success(submissions);
    },

    async findByFormIdPaginated(formId: string, page: number, limit: number): Promise<Result<{ submissions: Submission[]; total: number }, AppError>> {
      const offset = (page - 1) * limit;

      // Get total count
      const countResult = await db.query(
        'SELECT COUNT(*) as total FROM submissions WHERE form_id = ?',
        [formId]
      );

      if (!countResult.success) {
        return countResult;
      }

      const total = countResult.data[0]?.total as number || 0;

      // Get paginated results
      const result = await db.query(
        'SELECT * FROM submissions WHERE form_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?',
        [formId, limit, offset]
      );

      if (!result.success) {
        return result;
      }

      const submissions = result.data.map(row => mapRowToSubmission(row));
      return success({ submissions, total });
    },

    async findByGiftId(giftId: GiftId): Promise<Result<Submission[], AppError>> {
      const result = await db.query(
        'SELECT * FROM submissions WHERE gift_id = ? ORDER BY created_at DESC',
        [giftId]
      );
      
      if (!result.success) {
        return result;
      }

      const submissions = result.data.map(row => mapRowToSubmission(row));
      return success(submissions);
    },

    async save(submission: Submission): Promise<Result<void, AppError>> {
      const result = await db.execute(
        `INSERT INTO submissions (id, form_id, gift_id, nickname, gift_name_snapshot, status, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           status = VALUES(status)`,
        [
          submission.id,
          submission.formId,
          submission.giftId,
          submission.nickname,
          submission.giftNameSnapshot,
          submission.status,
          submission.createdAt,
        ]
      );

      if (!result.success) {
        return result;
      }

      return success(undefined);
    },

    async delete(id: string): Promise<Result<void, AppError>> {
      const result = await db.execute(
        'DELETE FROM submissions WHERE id = ?',
        [id]
      );

      if (!result.success) {
        return result;
      }

      return success(undefined);
    },
  };
}

function mapRowToSubmission(row: any): Submission {
  return {
    id: row.id,
    formId: row.form_id,
    giftId: row.gift_id as GiftId,
    nickname: row.nickname,
    giftNameSnapshot: row.gift_name_snapshot,
    createdAt: row.created_at,
    status: row.status,
  };
}
