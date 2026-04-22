# Troubleshooting Guide

## Error: "Failed to read from storage"

This error means the database connection is failing. Here's how to fix it:

### Step 1: Verify TIDB_CONNECTION_STRING is Set

```bash
# Check if the secret is set
npx wrangler secret list
```

You should see `TIDB_CONNECTION_STRING` in the list.

If it's **not listed**, set it:
```bash
npx wrangler secret put TIDB_CONNECTION_STRING
# Paste your connection string when prompted
```

### Step 2: Verify Connection String Format

Your TiDB connection string should look like:
```
mysql://user.root:password@gateway01.region.prod.aws.tidbcloud.com:4000/database?sslaccept=strict
```

**Common mistakes:**
- ❌ Missing `mysql://` prefix
- ❌ Wrong port (should be `4000`)
- ❌ Missing `?sslaccept=strict` at the end
- ❌ Incorrect username format (should be `user.root` not just `root`)
- ❌ Special characters in password not URL-encoded

### Step 3: Test Connection String

Get your connection string from TiDB Cloud:

1. Go to [TiDB Cloud Console](https://tidbcloud.com/)
2. Select your cluster
3. Click **"Connect"**
4. Copy the connection string
5. Make sure it includes the password

### Step 4: Verify Database Schema Exists

Connect to your TiDB cluster and verify tables exist:

```sql
-- Check if tables exist
SHOW TABLES;

-- Should show:
-- forms
-- gifts
-- submissions
```

If tables don't exist, run migrations:
1. `migrations/001_initial_schema.sql`
2. `migrations/002_assign_image_keys.sql`
3. `scripts/seed.sql`

### Step 5: Check Cloudflare Logs

View real-time logs:
```bash
npx wrangler tail
```

Then refresh your app. Look for detailed error messages like:
- "TIDB_CONNECTION_STRING not set"
- "TiDB query error"
- Connection timeout errors

### Step 6: Redeploy

After setting the secret, redeploy:
```bash
npm run deploy
```

---

## Error: "Database configuration error"

This means `TIDB_CONNECTION_STRING` is not set.

**Fix:**
```bash
npx wrangler secret put TIDB_CONNECTION_STRING
```

---

## Error: Connection Timeout

**Possible causes:**
1. TiDB cluster is paused (Serverless clusters auto-pause)
2. Network connectivity issues
3. Incorrect host/port in connection string

**Fix:**
1. Go to TiDB Cloud console
2. Check if cluster is running (wake it up if paused)
3. Verify connection string is correct

---

## Error: "Table doesn't exist"

**Fix:** Run migrations on your TiDB cluster

Using MySQL client:
```bash
mysql -h gateway.region.prod.aws.tidbcloud.com -P 4000 -u user.root -p < migrations/001_initial_schema.sql
mysql -h gateway.region.prod.aws.tidbcloud.com -P 4000 -u user.root -p < migrations/002_assign_image_keys.sql
mysql -h gateway.region.prod.aws.tidbcloud.com -P 4000 -u user.root -p < scripts/seed.sql
```

Or use TiDB Cloud's SQL Editor (web interface).

---

## Error: "Authentication failed"

**Possible causes:**
1. Wrong password in connection string
2. User doesn't have permissions
3. Password contains special characters that need URL encoding

**Fix:**
1. Get a fresh connection string from TiDB Cloud
2. If password has special characters, URL-encode them:
   - `@` → `%40`
   - `#` → `%23`
   - `&` → `%26`
   - etc.

---

## Local Development Issues

### Error: "TIDB_CONNECTION_STRING not set" (local)

Create `.dev.vars` file:
```bash
cp .dev.vars.example .dev.vars
```

Edit `.dev.vars`:
```
TIDB_CONNECTION_STRING="mysql://user.root:password@host:4000/database?sslaccept=strict"
ADMIN_PASSWORD_HASH="$2a$10$your-hash-here"
ENVIRONMENT="development"
```

---

## Still Having Issues?

### Enable Detailed Logging

The updated code now logs detailed errors. Check logs:

```bash
# Real-time logs
npx wrangler tail

# Or check Cloudflare dashboard
# Workers & Pages → Your Worker → Logs
```

### Test Connection Manually

Test your TiDB connection outside of the app:

```bash
# Using MySQL client
mysql -h gateway.region.prod.aws.tidbcloud.com -P 4000 -u user.root -p

# Then run a test query
SELECT 1;
```

If this fails, the issue is with your TiDB setup, not the app.

---

## Quick Checklist

- [ ] `TIDB_CONNECTION_STRING` secret is set
- [ ] Connection string format is correct
- [ ] TiDB cluster is running (not paused)
- [ ] Database tables exist (migrations run)
- [ ] Seed data is loaded
- [ ] Redeployed after setting secrets

---

## Get Help

If you're still stuck:

1. Check Cloudflare logs: `npx wrangler tail`
2. Verify TiDB connection works with MySQL client
3. Check TiDB Cloud console for cluster status
4. Review connection string format carefully
