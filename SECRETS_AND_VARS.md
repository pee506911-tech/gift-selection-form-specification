# Required Variables and Secrets

## Secrets (Sensitive - Set via CLI)

### 1. TIDB_CONNECTION_STRING (Required)

Your TiDB Serverless connection string.

**How to set:**
```bash
npx wrangler secret put TIDB_CONNECTION_STRING
```

**When prompted, paste your connection string:**
```
mysql://user.root:password@gateway01.region.prod.aws.tidbcloud.com:4000/database?sslaccept=strict
```

**Where to get it:**
1. Go to [TiDB Cloud](https://tidbcloud.com/)
2. Select your cluster
3. Click "Connect"
4. Copy the connection string

---

## Variables (Non-sensitive - Already in wrangler.toml)

### 1. ENVIRONMENT

Current environment name.

**Current value:** `"development"`

**To change for production:**
Edit `wrangler.toml` or use environment-specific config:
```toml
[env.production]
vars = { ENVIRONMENT = "production" }
```

### 2. ADMIN_PASSWORD_HASH

Bcrypt hash of the admin password.

**Current value:** `"123y"` (placeholder - CHANGE THIS!)

**How to generate a secure hash:**

```bash
# Install bcrypt-cli
npm install -g bcrypt-cli

# Generate hash (replace 'your-secure-password' with your actual password)
bcrypt-cli hash your-secure-password 10

# Example output:
# $2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy
```

**How to set:**

**Option 1: Update wrangler.toml (less secure)**
```toml
[vars]
ADMIN_PASSWORD_HASH = "$2a$10$your-hash-here"
```

**Option 2: Set as secret (more secure - recommended)**
```bash
npx wrangler secret put ADMIN_PASSWORD_HASH
# Paste your bcrypt hash when prompted
```

---

## Summary

### Required Before Deployment:

1. ✅ **TIDB_CONNECTION_STRING** (secret) - Your TiDB connection string
2. ⚠️ **ADMIN_PASSWORD_HASH** (var/secret) - Change from "123y" to a real bcrypt hash

### Optional:

- **ENVIRONMENT** - Already set to "development", change for production if needed

---

## Quick Setup Commands

```bash
# 1. Set TiDB connection string
npx wrangler secret put TIDB_CONNECTION_STRING
# Paste: mysql://user.root:password@host:4000/database?sslaccept=strict

# 2. Generate and set admin password hash
npm install -g bcrypt-cli
bcrypt-cli hash your-secure-password 10
# Copy the output hash

# Option A: Update wrangler.toml with the hash
# OR
# Option B: Set as secret (recommended)
npx wrangler secret put ADMIN_PASSWORD_HASH
# Paste the bcrypt hash

# 3. Deploy
npm run deploy
```

---

## Verify Secrets

To check what secrets are set:

```bash
npx wrangler secret list
```

Expected output:
```
TIDB_CONNECTION_STRING
ADMIN_PASSWORD_HASH (if set as secret)
```

---

## Local Development

For local development, create a `.dev.vars` file:

```bash
# Copy the example
cp .dev.vars.example .dev.vars

# Edit .dev.vars with your values:
TIDB_CONNECTION_STRING="mysql://user.root:password@host:4000/database?sslaccept=strict"
ADMIN_PASSWORD_HASH="$2a$10$your-hash-here"
ENVIRONMENT="development"
```

**Note:** `.dev.vars` is gitignored and only used for local development.
