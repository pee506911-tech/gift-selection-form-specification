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
  if (!connectionString) {
    throw new Error('TIDB_CONNECTION_STRING is not set. Please set it using: npx wrangler secret put TIDB_CONNECTION_STRING');
  }

  const conn = connect({ url: connectionString });

  return {
    async query(sql: string, params: any[] = []): Promise<Result<any[], AppError>> {
      try {
        const result = await conn.execute(sql, params);
        // Defensive: ensure rows exists and is an array
        const rows = result?.rows ?? [];
        return success(Array.isArray(rows) ? rows : []);
      } catch (error) {
        console.error('TiDB query error:', { sql, params, error });
        return failure(storageReadError(sql, error));
      }
    },

    async execute(sql: string, params: any[] = []): Promise<Result<any, AppError>> {
      try {
        const result = await conn.execute(sql, params);
        return success(result);
      } catch (error) {
        console.error('TiDB execute error:', { sql, params, error });
        return failure(storageWriteError(sql, error));
      }
    },

    async close(): Promise<void> {
      // TiDB serverless driver handles connection pooling
      // No explicit close needed for HTTP connections
    },
  };
}
