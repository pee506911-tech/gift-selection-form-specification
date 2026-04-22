// TiDB/D1 Gift repository implementation
import type { GiftRepository } from '../interfaces';
import type { Gift, GiftId } from '../../domain/types';
import type { AppError, Result } from '../../domain/errors';
import { storageReadError, storageWriteError, success, failure } from '../../domain/errors';
import type { TiDBConnection } from './connection';

export function createGiftRepository(db: TiDBConnection): GiftRepository {
  return {
    async findByFormId(formId: string): Promise<Result<Gift[], AppError>> {
      const result = await db.query(
        'SELECT * FROM gifts WHERE form_id = ? ORDER BY sort_order ASC',
        [formId]
      );
      
      if (!result.success) {
        return result;
      }

      const gifts = result.data.map(row => mapRowToGift(row));
      return success(gifts);
    },

    async findById(id: GiftId): Promise<Result<Gift, AppError>> {
      const result = await db.query(
        'SELECT * FROM gifts WHERE id = ?',
        [id]
      );
      
      if (!result.success) {
        return result;
      }

      if (result.data.length === 0) {
        return failure(storageReadError(`Gift not found: ${id}`));
      }

      return success(mapRowToGift(result.data[0]));
    },

    async save(gift: Gift): Promise<Result<void, AppError>> {
      const result = await db.execute(
        `INSERT INTO gifts (id, form_id, code, name, description, image_key, sort_order, status, selected_submission_id, version, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           code = VALUES(code),
           name = VALUES(name),
           description = VALUES(description),
           image_key = VALUES(image_key),
           sort_order = VALUES(sort_order),
           status = VALUES(status),
           selected_submission_id = VALUES(selected_submission_id),
           version = VALUES(version) + 1,
           updated_at = VALUES(updated_at)`,
        [
          gift.id,
          gift.formId,
          gift.code,
          gift.name,
          gift.description,
          gift.imageKey,
          gift.sortOrder,
          gift.status,
          gift.selectedSubmissionId,
          gift.version,
          gift.createdAt,
          gift.updatedAt,
        ]
      );

      if (!result.success) {
        return result;
      }

      return success(undefined);
    },

    async selectGiftAtomically(giftId: GiftId, submissionId: string, expectedVersion: number): Promise<Result<void, AppError>> {
      // Atomic update with optimistic locking - only update if gift is still available and version matches
      const result = await db.execute(
        `UPDATE gifts 
         SET status = 'selected', 
             selected_submission_id = ?, 
             version = version + 1,
             updated_at = ?
         WHERE id = ? 
           AND status = 'available' 
           AND version = ?`,
        [submissionId, new Date().toISOString(), giftId, expectedVersion]
      );

      if (!result.success) {
        return result;
      }

      // Check if any row was actually updated
      if (result.data.meta.changes === 0) {
        return failure(storageWriteError(`Gift ${giftId} is no longer available or version mismatch`));
      }

      return success(undefined);
    },

    async delete(id: GiftId): Promise<Result<void, AppError>> {
      const result = await db.execute(
        'DELETE FROM gifts WHERE id = ?',
        [id]
      );

      if (!result.success) {
        return result;
      }

      return success(undefined);
    },
  };
}

function mapRowToGift(row: any): Gift {
  return {
    id: row.id as GiftId,
    formId: row.form_id,
    code: row.code,
    name: row.name,
    description: row.description,
    imageKey: row.image_key,
    sortOrder: row.sort_order,
    status: row.status,
    selectedSubmissionId: row.selected_submission_id,
    version: row.version,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
