// TiDB/D1 Form repository implementation
import type { FormRepository } from '../interfaces';
import type { AppError, Result } from '../../domain/errors';
import { storageReadError, success, failure } from '../../domain/errors';
import type { TiDBConnection } from './connection';

export function createFormRepository(db: TiDBConnection): FormRepository {
  return {
    async findBySlug(slug: string): Promise<Result<{ id: string; slug: string; title: string; status: string } | null, AppError>> {
      const result = await db.query(
        'SELECT id, slug, title, status FROM forms WHERE slug = ?',
        [slug]
      );
      
      if (!result.success) {
        console.error('Form findBySlug query failed:', { slug, error: result.error });
        return result;
      }

      // Defensive check: ensure data exists and is an array
      if (!result.data || !Array.isArray(result.data) || result.data.length === 0) {
        console.log('Form not found:', { slug, dataExists: !!result.data, isArray: Array.isArray(result.data), length: result.data?.length });
        return success(null);
      }

      const row = result.data[0];
      console.log('Form found:', { slug, formId: row.id });
      return success({
        id: row.id,
        slug: row.slug,
        title: row.title,
        status: row.status,
      });
    },

    async save(form: { id: string; slug: string; title: string; status: string }): Promise<Result<void, AppError>> {
      const result = await db.execute(
        `INSERT INTO forms (id, slug, title, status)
         VALUES (?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           slug = VALUES(slug),
           title = VALUES(title),
           status = VALUES(status)`,
        [form.id, form.slug, form.title, form.status]
      );

      if (!result.success) {
        return result;
      }

      return success(undefined);
    },
  };
}
