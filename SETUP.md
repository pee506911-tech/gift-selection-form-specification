# Gift Selection App - Setup Guide

## Overview

The app is now fully connected to the backend! Here's what works:

### ✅ User Form (Frontend)
- Fetches gifts from `/api/forms/:slug/bootstrap`
- Submits selections to `/api/forms/:slug/submissions`
- Shows loading states and error handling
- Displays form status (open/closed)

### ✅ Admin Panel (Frontend)
- Login with password authentication
- View all gifts with images
- Create, edit, and delete gifts
- Upload images to R2
- View submissions with pagination
- Export submissions as CSV

### ✅ Backend (Worker)
- All API endpoints implemented
- Database persistence with D1/TiDB
- Image storage with R2
- Rate limiting and CSRF protection
- Audit logging

## Setup Instructions

### 1. Database Setup

First, create a D1 database:

```bash
# Create D1 database
npx wrangler d1 create gift_selection_db

# Copy the database_id from output and update wrangler.toml
```

Run migrations:

```bash
# Apply migrations
npx wrangler d1 migrations apply gift_selection_db --local

# For production
npx wrangler d1 migrations apply gift_selection_db --remote
```

Seed the database:

```bash
# Seed local database
npx wrangler d1 execute gift_selection_db --local --file=./scripts/seed.sql

# For production
npx wrangler d1 execute gift_selection_db --remote --file=./scripts/seed.sql
```

### 2. R2 Bucket Setup

Create an R2 bucket for images:

```bash
# Create R2 bucket
npx wrangler r2 bucket create gift-images
```

### 3. KV Namespace Setup

Create a KV namespace for sessions:

```bash
# Create KV namespace
npx wrangler kv:namespace create SESSIONS

# Copy the id from output and update wrangler.toml
```

### 4. Admin Password Setup

Generate a bcrypt hash for your admin password:

```bash
# Install bcrypt if needed
npm install -g bcrypt-cli

# Generate hash (replace 'your-password' with your actual password)
bcrypt-cli hash your-password 10
```

Update `wrangler.toml` with the hash:

```toml
[vars]
ADMIN_PASSWORD_HASH = "your-bcrypt-hash-here"
```

### 5. Build and Run

```bash
# Install dependencies
npm install

# Build frontend
npm run build

# Run locally
npm run dev

# Deploy to production
npm run deploy
```

## Usage

### User Flow

1. Visit `http://localhost:8787/` (or your deployed URL)
2. Enter your nickname
3. Select an available gift
4. Review and submit
5. See success confirmation

### Admin Flow

1. Visit `http://localhost:8787/#/admin`
2. Login with your admin password
3. **Gifts Tab**: Create, edit, delete gifts and upload images
4. **Submissions Tab**: View all submissions, export to CSV

## API Endpoints

### Public Endpoints

- `GET /api/forms/:slug/bootstrap` - Get form snapshot with gifts
- `POST /api/forms/:slug/submissions` - Submit gift selection
- `GET /api/health` - Health check

### Admin Endpoints (require Bearer token)

- `POST /api/admin/auth` - Login
- `GET /api/admin/forms/:formId/gifts` - List gifts
- `POST /api/admin/forms/:formId/gifts` - Create gift
- `PUT /api/admin/forms/:formId/gifts/:giftId` - Update gift
- `DELETE /api/admin/forms/:formId/gifts/:giftId` - Delete gift
- `GET /api/admin/forms/:formId/submissions` - List submissions (paginated)
- `GET /api/admin/forms/:formId/submissions/export` - Export CSV
- `POST /api/admin/images/upload` - Upload image to R2

## Environment Variables

Update `wrangler.toml`:

```toml
[vars]
ENVIRONMENT = "development"
ADMIN_PASSWORD_HASH = "your-bcrypt-hash"
```

## Database Schema

The app uses 3 main tables:

1. **forms** - Form configuration
2. **gifts** - Gift items with images
3. **submissions** - User submissions

See `migrations/001_initial_schema.sql` for full schema.

## Troubleshooting

### "Failed to Load" on User Form

- Check that migrations have been applied
- Check that seed data has been loaded
- Verify the form slug matches ('gift-selection')

### Admin Login Fails

- Verify `ADMIN_PASSWORD_HASH` is set correctly in wrangler.toml
- Check browser console for API errors
- Verify the backend is running

### Images Not Showing

- Verify R2 bucket is created and bound
- Check that image files exist in `public/images/`
- Verify the build copied images to `dist/images/`

### Submissions Not Saving

- Check D1 database is created and migrations applied
- Check browser network tab for API errors
- Verify rate limiting isn't blocking requests

## Next Steps

### Optional Enhancements

1. **Real-time Updates**: Implement WebSocket connection for live gift availability
2. **Form Settings**: Add UI to configure form title, status, etc.
3. **Duplicate Nickname Check**: Enforce unique nicknames if needed
4. **Email Notifications**: Send confirmation emails on submission
5. **Analytics**: Track submission metrics and popular gifts

## Architecture

The app follows clean architecture principles:

```
src/
├── domain/          # Business logic (pure functions)
├── application/     # Use cases
├── infrastructure/  # External adapters (DB, R2, etc.)
├── components/      # React UI components
├── lib/            # API client
└── worker/         # Cloudflare Worker entry point
```

All domain logic is testable without infrastructure dependencies.
