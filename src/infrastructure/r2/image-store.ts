// R2 image storage adapter
// Handles image upload, deletion, and URL generation

import type { ImageStore } from '../interfaces';
import type { AppError, Result } from '../../domain/errors';
import { storageWriteError, success, failure } from '../../domain/errors';

export function createR2ImageStore(bucket: R2Bucket): ImageStore {
  return {
    async upload(formId: string, giftId: string, file: File, contentType: string): Promise<Result<string, AppError>> {
      try {
        // Generate deterministic key
        const ext = contentType.split('/')[1] || 'jpg';
        const key = `forms/${formId}/gifts/${giftId}.${ext}`;

        const arrayBuffer = await file.arrayBuffer();
        await bucket.put(key, arrayBuffer, {
          httpMetadata: { contentType },
        });

        return success(key);
      } catch (error) {
        return failure(storageWriteError(`forms/${formId}/gifts/${giftId}`, error));
      }
    },

    async delete(key: string): Promise<Result<void, AppError>> {
      try {
        await bucket.delete(key);
        return success(undefined);
      } catch (error) {
        return failure(storageWriteError(key, error));
      }
    },

    getUrl(key: string): string {
      // In production, this would use a custom domain or public URL
      // For now, return the key - the HTTP layer will construct the full URL
      return key;
    },
  };
}
