# Check Deployment Status

## Step 1: Verify Secrets Are Set

Run this command:
```bash
npx wrangler secret list
```

**Expected output:**
```
TIDB_CONNECTION_STRING
```

**If you DON'T see `TIDB_CONNECTION_STRING`**, set it now:
```bash
npx wrangler secret put TIDB_CONNECTION_STRING
# Paste your TiDB connection string when prompted
```

---

## Step 2: Check Real-Time Logs

Open a terminal and run:
```bash
npx wrangler tail
```

Keep this running, then in another terminal or browser:
- Visit your app URL
- The logs will show the actual error

**Look for:**
- "TIDB_CONNECTION_STRING not set"
- "TiDB query error"
- "Database configuration error"
- Connection errors with details

---

## Step 3: Test the API Directly

Open your browser console and run:
```javascript
fetch('https://gift-selection-form-specification.pee506911.workers.dev/api/health')
  .then(r => r.json())
  .then(console.log)
```

This will show if the database connection is working.

**Expected response:**
```json
{
  "status": "ok",
  "environment": "development",
  "checks": {
    "database": "ok"
  },
  "timestamp": "2026-04-22T..."
}
```

**If database check fails:**
```json
{
  "status": "degraded",
  "checks": {
    "database": "error"
  }
}
```

---

## Step 4: Common Issues

### Issue: TIDB_CONNECTION_STRING not set

**Fix:**
```bash
npx wrangler secret put TIDB_CONNECTION_STRING
```

### Issue: Database tables don't exist

**Fix:** Run migrations on your TiDB cluster:
1. Connect to TiDB (MySQL client or TiDB Cloud SQL Editor)
2. Run `migrations/001_initial_schema.sql`
3. Run `migrations/002_assign_image_keys.sql`
4. Run `scripts/seed.sql`

### Issue: TiDB cluster is paused

**Fix:** 
1. Go to TiDB Cloud console
2. Check if cluster is running
3. Wake it up if paused

### Issue: Wrong connection string format

**Correct format:**
```
mysql://user.root:PASSWORD@gateway01.region.prod.aws.tidbcloud.com:4000/database?sslaccept=strict
```

**Common mistakes:**
- Missing `mysql://` prefix
- Wrong port (should be 4000)
- Missing `?sslaccept=strict`
- Special characters in password not URL-encoded

---

## Step 5: Redeploy After Fixing

After setting secrets or fixing issues:
```bash
npm run deploy
```

---

## Quick Debug Commands

```bash
# Check secrets
npx wrangler secret list

# Watch logs in real-time
npx wrangler tail

# Test health endpoint
curl https://gift-selection-form-specification.pee506911.workers.dev/api/health

# Redeploy
npm run deploy
```

---

## What to Share for Help

If still having issues, share:

1. Output of `npx wrangler secret list`
2. Output of `npx wrangler tail` when you visit the app
3. Response from `/api/health` endpoint
4. Your TiDB connection string format (with password hidden)

Example:
```
Connection string format: mysql://user.root:***@gateway01.us-west-2.prod.aws.tidbcloud.com:4000/test?sslaccept=strict
```
