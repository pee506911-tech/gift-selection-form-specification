// TiDB/D1 database connection adapter
// Using D1 for now - will switch to TiDB serverless driver when correct package is available

import type { AppError, Result } from '../../domain/errors';
import { storageReadError, storageWriteError, success, failure } from '../../domain/errors';

export interface TiDBConnection {
  query(sql: string, params?: any[]): Promise<Result<any[], AppError>>;
  execute(sql: string, params?: any[]): Promise<Result<any, AppError>>;
  close(): Promise<void>;
}

export function createTiDBConnection(db: D1Database): TiDBConnection {
  return {
    async query(sql: string, params: any[] = []): Promise<Result<any[], AppError>> {
      try {
        const result = await db.prepare(sql).bind(...params).all();
        return success(result.results);
      } catch (error) {
        return failure(storageReadError(sql, error));
      }
    },

    async execute(sql: string, params: any[] = []): Promise<Result<any, AppError>> {
      try {
        const result = await db.prepare(sql).bind(...params).run();
        return success(result);
      } catch (error) {
        return failure(storageWriteError(sql, error));
      }
    },

    async close(): Promise<void> {
      // D1 handles connection pooling automatically
      // No explicit close needed
    },
  };
}
