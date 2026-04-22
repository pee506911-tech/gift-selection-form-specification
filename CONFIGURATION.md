# Configuration Guide

## Overview

This app uses two methods for configuration:

1. **Environment Variables** (non-sensitive) → `wrangler.toml`
2. **Secrets** (sensitive) → Cloudflare Secrets or `.dev.vars` (local only)

---

## Configuration Files

### 1. `wrangler.toml` (Committed to Git)

Contains **non-sensitive** configuration:

```toml
[vars]
ENVIRONMENT = "development"
ADMIN_PASSWORD_HASH = "$2a$10$hash..."  # Bcrypt hash (not the actual password)
```

**✅ Safe to commit:**
- Environment names
- Bcrypt password hashes (one-way encrypted)
- Feature flags
- Public configuration

**❌ NEVER commit:**
- Database passwords
- API keys
- Connection strings with credentials

### 2. `.dev.vars` (Local Development Only - NOT Committed)

Contains **actual secrets** for local development:

```bash
TIDB_CONNECTION_STRING=mysql://user:password@host:4000/db?sslaccept=strict
ADMIN_PASSWORD_HASH=$2a$10$hash...
ENVIRONMENT=development
```

**This file is gitignored** and only used when running `npm run dev:full` locally.

### 3. Cloudflare Secrets (Production)

For production, secrets are stored securely in Cloudflare:

```bash
npx wrangler secret put TIDB_CONNECTION_STRING
```

---

## Required Configuration

### 1. TIDB_CONNECTION_STRING (Secret)

**What:** Your TiDB Serverless database connection string

**Format:**
```
mysql://user.root:PASSWORD@gateway.region.prod.aws.tidbcloud.com:4000/database?sslaccept=strict
```

**How to get it:**
1. Go to [TiDB Cloud](https://tidbcloud.com/)
2. Select your cluster
3. Click "Connect"
4. Copy the connection string (includes password)

**For Production:**
```bash
npx wrangler secret put TIDB_CONNECTION_STRING
# Paste the connection string when prompted
```

**For Local Development:**
Edit `.dev.vars`:
```bash
TIDB_CONNECTION_STRING=mysql://user.root:YOUR_PASSWORD@gateway.region.prod.aws.tidbcloud.com:4000/test?sslaccept=strict
```

---

### 2. ADMIN_PASSWORD_HASH (Variable or Secret)

**What:** Bcrypt hash of the admin panel password

**Current value in wrangler.toml:**
```toml
ADMIN_PASSWORD_HASH = "$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy"
```
This is the hash for password: `admin123` - **CHANGE THIS!**

**How to generate:**
```bash
# Install bcrypt-cli
npm install -g bcrypt-cli

# Generate hash for your password
bcrypt-cli hash your-secure-password 10

# Example output:
# $2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy
```

**Option A: Store in wrangler.toml (less secure but convenient)**
```toml
[vars]
ADMIN_PASSWORD_HASH = "$2a$10$your-hash-here"
```

**Option B: Store as secret (more secure)**
```bash
npx wrangler secret put ADMIN_PASSWORD_HASH
# Paste the bcrypt hash when prompted
```

**For Local Development:**
Edit `.dev.vars`:
```bash
ADMIN_PASSWORD_HASH=$2a$10$your-hash-here
```

---

### 3. ENVIRONMENT (Variable)

**What:** Current environment name

**Current value:** `"development"`

**Already configured in wrangler.toml:**
```toml
[vars]
ENVIRONMENT = "development"

[env.production]
vars = { ENVIRONMENT = "production" }
```

**No action needed** unless you want to change it.

---

## Setup Instructions

### For Production Deployment:

1. **Set TiDB connection string:**
   ```bash
   npx wrangler secret put TIDB_CONNECTION_STRING
   ```

2. **Update admin password hash in wrangler.toml:**
   ```bash
   # Generate hash
   bcrypt-cli hash your-password 10
   
   # Edit wrangler.toml
   [vars]
   ADMIN_PASSWORD_HASH = "$2a$10$your-new-hash"
   ```

3. **Deploy:**
   ```bash
   npm run deploy
   ```

### For Local Development:

1. **Copy the example file:**
   ```bash
   cp .dev.vars.example .dev.vars
   ```

2. **Edit `.dev.vars` with your values:**
   ```bash
   TIDB_CONNECTION_STRING=mysql://user.root:YOUR_PASSWORD@host:4000/db?sslaccept=strict
   ADMIN_PASSWORD_HASH=$2a$10$your-hash-here
   ENVIRONMENT=development
   ```

3. **Run locally:**
   ```bash
   npm run dev:full
   ```

---

## Verify Configuration

### Check Production Secrets:
```bash
npx wrangler secret list
```

Expected output:
```
TIDB_CONNECTION_STRING
```

### Check Local Configuration:
```bash
cat .dev.vars
```

Should show your connection string and password hash.

---

## Security Best Practices

### ✅ DO:
- Store database credentials as secrets
- Use bcrypt hashes for passwords (not plain text)
- Keep `.dev.vars` in `.gitignore`
- Use different credentials for dev/prod
- Rotate secrets regularly

### ❌ DON'T:
- Commit `.dev.vars` to git
- Put database passwords in `wrangler.toml`
- Share secrets in chat/email
- Use the same password for dev and prod
- Commit API keys or tokens

---

## Environment-Specific Configuration

### Development:
```bash
npm run dev:full
# Uses .dev.vars
```

### Production:
```bash
npm run deploy
# Uses Cloudflare secrets + wrangler.toml vars
```

### Staging (if needed):
```toml
[env.staging]
vars = { ENVIRONMENT = "staging" }
```

Deploy to staging:
```bash
npx wrangler deploy --env staging
```

---

## Troubleshooting

### "TIDB_CONNECTION_STRING not set"

**Production:**
```bash
npx wrangler secret put TIDB_CONNECTION_STRING
```

**Local:**
Check `.dev.vars` exists and has the connection string.

### "Authentication failed"

- Verify password in connection string is correct
- Check for special characters that need URL encoding
- Get a fresh connection string from TiDB Cloud

### Changes not taking effect

**Production:**
```bash
# After updating secrets, redeploy
npm run deploy
```

**Local:**
```bash
# Restart the dev server
# Stop with Ctrl+C, then:
npm run dev:full
```

---

## Quick Reference

| Variable | Type | Where | Required |
|----------|------|-------|----------|
| `TIDB_CONNECTION_STRING` | Secret | Cloudflare / .dev.vars | ✅ Yes |
| `ADMIN_PASSWORD_HASH` | Variable | wrangler.toml / .dev.vars | ✅ Yes |
| `ENVIRONMENT` | Variable | wrangler.toml | ✅ Yes |

---

## Summary

1. **Sensitive data** (passwords, connection strings) → Secrets (Cloudflare) or `.dev.vars` (local)
2. **Non-sensitive data** (environment names, hashes) → `wrangler.toml`
3. **Never commit** `.dev.vars` or actual passwords
4. **Always use** bcrypt hashes for passwords, not plain text
