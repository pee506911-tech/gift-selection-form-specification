# Fix: Bootstrap Error - Cannot read properties of undefined

## Problem
The `/api/forms/gift-selection/bootstrap` endpoint is returning a 500 error with:
```
TypeError: Cannot read properties of undefined (reading 'length')
```

## Root Cause
The `findBySlug` method in the form repository was trying to access `.length` on `result.data` when it was `undefined`. This happens when:
1. The database query returns an unexpected structure
2. The forms table hasn't been seeded with data

## Fixes Applied

### 1. Defensive Checks in Form Repository
Added null/undefined checks before accessing array properties:
- File: `src/infrastructure/tidb/form-repository.ts`
- Now safely handles cases where `result.data` is undefined or not an array

### 2. Defensive Checks in TiDB Connection
Added fallback to empty array when `result.rows` is undefined:
- File: `src/infrastructure/tidb/connection.ts`
- Ensures `query()` always returns an array, even if the underlying driver returns undefined

### 3. Better Error Messages
Added helpful error messages in the bootstrap endpoint:
- File: `src/worker/index.ts`
- Now returns a 404 with seeding instructions when form is not found

### 4. Enhanced Logging
Added debug logging to help diagnose issues:
- Logs when form is not found
- Logs when form is found successfully
- Logs query failures with details

## Next Steps

### If the error persists, you need to seed the database:

1. **Check if the database has been migrated:**
   ```bash
   # For TiDB (production)
   # You'll need to run migrations manually using your TiDB client
   ```

2. **Seed the database with initial data:**
   ```bash
   # For TiDB (production)
   # Connect to your TiDB instance and run:
   # scripts/seed-tidb.sql
   ```

3. **Verify the form exists:**
   Connect to your TiDB database and run:
   ```sql
   SELECT * FROM forms WHERE slug = 'gift-selection';
   ```
   
   You should see a form with:
   - id: `default-form-id` (from migration) or `form-001` (from seed)
   - slug: `gift-selection`
   - title: `Choose Your Gift`
   - status: `open`

### If you're using local development:

The migration file (`migrations/001_initial_schema.sql`) already includes a default form insert, so if migrations have run, the form should exist.

## Testing

After deploying the fixes:

1. Try accessing the bootstrap endpoint:
   ```bash
   curl https://jotform.pee506911.workers.dev/api/forms/gift-selection/bootstrap
   ```

2. Check the logs for diagnostic information:
   - "Form not found" indicates the database needs seeding
   - "Form found" indicates success
   - Query errors indicate database connection issues

## Database Schema Note

There's a minor inconsistency:
- Migration creates form with id: `default-form-id`
- Seed script creates form with id: `form-001`

Both use the same slug (`gift-selection`), so only one will exist. The migration's `ON DUPLICATE KEY UPDATE` ensures no conflicts.
