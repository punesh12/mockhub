#!/bin/bash

# Production Database Migration Script
# This script runs Prisma migrations on the production database

set -e

echo "🚀 Starting production database migration..."

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
  echo "❌ Error: DATABASE_URL environment variable is not set"
  exit 1
fi

# Generate Prisma Client
echo "📦 Generating Prisma Client..."
npx prisma generate

# Deploy migrations
echo "🔄 Deploying migrations..."
npx prisma migrate deploy

# Verify migration status
echo "✅ Verifying migration status..."
npx prisma migrate status

echo "✅ Migration completed successfully!"

