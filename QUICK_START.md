# Quick Start Guide

## Prerequisites

1. **TiDB Serverless Cluster** - [Create one at tidbcloud.com](https://tidbcloud.com/)
2. **Cloudflare Account** - For Workers deployment

## Setup Steps

### 1. Set TiDB Connection String

```bash
# Set as Cloudflare secret
npx wrangler secret put TIDB_CONNECTION_STRING

# When prompted, paste your connection string:
# mysql://user.root:password@gateway.region.prod.aws.tidbcloud.com:4000/database?sslaccept=strict
```

### 2. Run Database Migrations

Connect to your TiDB cluster and run these SQL files in order:

1. `migrations/001_initial_schema.sql`
2. `migrations/002_assign_image_keys.sql`
3. `scripts/seed.sql`

You can use:
- TiDB Cloud's SQL Editor (web interface)
- MySQL Workbench
- DBeaver
- Command line: `mysql -h host -P 4000 -u user -p < file.sql`

### 3. Deploy

```bash
# Install dependencies
npm install

# Build and deploy
npm run deploy
```

That's it! Your app is now deployed.

## Local Development

```bash
# Create .dev.vars file
cp .dev.vars.example .dev.vars

# Edit .dev.vars with your TiDB connection string
# TIDB_CONNECTION_STRING="mysql://..."

# Run locally
npm run dev:full

# Visit http://localhost:8787
```

## Your Stack

- ✅ **Cloudflare Workers** - Serverless compute
- ✅ **Durable Objects** - Real-time WebSocket state
- ✅ **TiDB Serverless** - MySQL-compatible database
- ✅ **Workers Assets** - Static files & images (bundled)

## Managing Images

Images are bundled with your app from `public/images/`:

1. Add/update images in `public/images/`
2. Update database `imageKey` field (e.g., `images/1.png`)
3. Rebuild: `npm run build`
4. Deploy: `npx wrangler deploy`

## Admin Access

Default admin password hash in `wrangler.toml` is `"123y"` (placeholder).

To set a secure password:

```bash
# Generate bcrypt hash
npm install -g bcrypt-cli
bcrypt-cli hash your-password 10

# Update wrangler.toml or set as secret
npx wrangler secret put ADMIN_PASSWORD_HASH
```

## Troubleshooting

### Deployment fails with "TIDB_CONNECTION_STRING not found"

Set the secret: `npx wrangler secret put TIDB_CONNECTION_STRING`

### Database connection errors

- Verify connection string format
- Check TiDB cluster is running
- Test connection with MySQL client first

### Images not loading

- Check images exist in `public/images/`
- Verify `imageKey` in database matches filename
- Rebuild: `npm run build`

## Next Steps

See `SETUP.md` for detailed documentation.
See `DEPLOYMENT_STEPS.md` for advanced deployment options.
