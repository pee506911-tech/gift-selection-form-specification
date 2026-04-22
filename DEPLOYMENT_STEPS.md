# TiDB Deployment Steps

## Setup TiDB Serverless

### 1. Create TiDB Serverless Cluster

1. Go to [TiDB Cloud](https://tidbcloud.com/)
2. Sign up or log in
3. Create a new Serverless cluster
4. Copy your connection string (it will look like):
   ```
   mysql://user.root:password@gateway01.region.prod.aws.tidbcloud.com:4000/test?sslaccept=strict
   ```

### 2. Set Up Database Schema

Connect to your TiDB cluster and run the migrations:

```bash
# You can use MySQL client or TiDB Cloud's SQL editor
mysql -h gateway01.region.prod.aws.tidbcloud.com -P 4000 -u user.root -p

# Then run the SQL from migrations/001_initial_schema.sql
# And migrations/002_assign_image_keys.sql
# And scripts/seed.sql
```

Or use a database client like DBeaver, TablePlus, or MySQL Workbench.

### 3. Set Connection String as Secret

```bash
# Set your TiDB connection string as a Cloudflare secret
npx wrangler secret put TIDB_CONNECTION_STRING

# When prompted, paste your connection string:
# mysql://user.root:password@gateway01.region.prod.aws.tidbcloud.com:4000/test?sslaccept=strict
```

### 4. Build and Deploy

```bash
# Build the frontend
npm run build

# Deploy to Cloudflare
npx wrangler deploy
```

## Local Development with TiDB

For local development, you can:

1. Use your TiDB Serverless cluster (recommended for testing)
2. Or run TiDB locally with Docker

### Option 1: Use TiDB Serverless Locally

```bash
# Set the connection string in .dev.vars file
echo 'TIDB_CONNECTION_STRING="mysql://user.root:password@gateway01.region.prod.aws.tidbcloud.com:4000/test?sslaccept=strict"' > .dev.vars

# Run locally
npm run dev:full
```

### Option 2: Run TiDB Locally with Docker

```bash
# Start TiDB
docker run -d --name tidb -p 4000:4000 pingcap/tidb:latest

# Set local connection string
echo 'TIDB_CONNECTION_STRING="mysql://root@localhost:4000/test"' > .dev.vars

# Create database and run migrations
mysql -h 127.0.0.1 -P 4000 -u root < migrations/001_initial_schema.sql
mysql -h 127.0.0.1 -P 4000 -u root < migrations/002_assign_image_keys.sql
mysql -h 127.0.0.1 -P 4000 -u root < scripts/seed.sql

# Run locally
npm run dev:full
```

## Architecture

Your stack now uses:
- ✅ **Cloudflare Workers** - Compute
- ✅ **Durable Objects** - Real-time state & WebSocket
- ✅ **TiDB Serverless** - MySQL-compatible database
- ✅ **Workers Assets** - Static files & images

## Troubleshooting

### "Connection failed" errors

- Verify your TiDB connection string is correct
- Check that the secret is set: `npx wrangler secret list`
- Ensure your TiDB cluster is running and accessible

### "Table doesn't exist" errors

- Run all migrations in order
- Verify the database name in your connection string matches

### Local development not working

- Check `.dev.vars` file exists and has the correct connection string
- Ensure TiDB is accessible from your local machine
- Try connecting with a MySQL client first to verify credentials

