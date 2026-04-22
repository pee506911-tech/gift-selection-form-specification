#!/bin/bash

# Local development setup script
# This script sets up the local D1 database for development

echo "🚀 Setting up local development environment..."

# Apply migrations
echo "📦 Applying database migrations..."
npx wrangler d1 migrations apply gift_selection_db --local

# Seed database
echo "🌱 Seeding database with initial data..."
npx wrangler d1 execute gift_selection_db --local --file=./scripts/seed.sql

echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Build the frontend: npm run build"
echo "2. Start the dev server: npm run dev:full"
echo "3. Visit http://localhost:8787"
echo "4. Admin panel: http://localhost:8787/#/admin"
echo ""
echo "Note: Default admin password is 'admin' (configured in wrangler.toml)"
