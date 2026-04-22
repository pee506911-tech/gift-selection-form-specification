// TiDB Serverless database connection adapter
import { connect } from '@tidbcloud/serverless';
import type { AppError, Result } from '../../domain/errors';
import { storageReadError, storageWriteError, success, failure } from '../../domain/errors';

export interface TiDBConnection {
  query(sql: string, params?: any[]): Promise<Result<any[], AppError>>;
  execute(sql: string, params?: any[]): Promise<Result<any, AppError>>;
  close(): Promise<void>;
}

export function createTiDBConnection(connectionString: string): TiDBConnection {
  const conn = connect({ url: connectionString });

  return {
    async query(sql: string, params: any[] = []): Promise<Result<any[], AppError>> {
      try {
        const result = await conn.execute(sql, params);
        return success(result.rows as any[]);
      } catch (error) {
        return failure(storageReadError(sql, error));
      }
    },

    async execute(sql: string, params: any[] = []): Promise<Result<any, AppError>> {
      try {
        const result = await conn.execute(sql, params);
        return success(result);
      } catch (error) {
        return failure(storageWriteError(sql, error));
      }
    },

    async close(): Promise<void> {
      // TiDB serverless driver handles connection pooling
      // No explicit close needed for HTTP connections
    },
  };
}
