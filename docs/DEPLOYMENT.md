# Deployment Guide

This guide covers deploying MockHub to production using Vercel.

## Prerequisites

- Vercel account connected to GitHub
- Supabase project with production database
- Environment variables configured in Vercel

## Pre-Deployment Checklist

### 1. Environment Variables

Ensure all required environment variables are set in Vercel:

**Required:**
- `DATABASE_URL` - Production database connection string (use connection pooling URL)
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key

**Optional:**
- `JWT_SECRET` - JWT signing secret
- `NEXT_PUBLIC_APP_URL` - Application URL (auto-detected by Vercel)

### 2. Database Connection

**Important**: For production/Vercel, use the **Connection Pooling** URL (port 6543), not the direct connection (port 5432).

Get the connection pooling URL from:
- Supabase Dashboard → Settings → Database → Connection Pooling
- Format: `postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true`

## Deployment Steps

### Automatic Deployment (Recommended)

1. **Push to main branch** - Vercel automatically deploys
2. **Run database migrations** - Use GitHub Actions workflow or manual script

### Manual Deployment

1. **Deploy via Vercel Dashboard:**
   - Go to your Vercel project
   - Click "Deployments" → "Redeploy"
   - Select the branch/commit to deploy

2. **Run database migrations:**
   ```bash
   # Using GitHub Actions
   - Go to Actions → Database Migration
   - Click "Run workflow"
   - Select environment: production
   
   # Or manually via script
   DATABASE_URL="your-production-db-url" ./scripts/migrate-production.sh
   ```

## Database Migrations

### Running Migrations in Production

**Option 1: GitHub Actions (Recommended)**
1. Go to GitHub → Actions
2. Select "Database Migration" workflow
3. Click "Run workflow"
4. Select environment (production/staging)
5. Click "Run workflow"

**Option 2: Manual Script**
```bash
export DATABASE_URL="your-production-connection-string"
npm run db:migrate:deploy
```

**Option 3: Vercel Build Command**
Add to `vercel.json`:
```json
{
  "buildCommand": "npm run build && npm run db:migrate:deploy"
}
```

⚠️ **Warning**: Only run migrations after successful deployment to avoid downtime.

## CI/CD Pipeline

The GitHub Actions workflow automatically:
1. ✅ Runs linting and format checks
2. ✅ Runs all tests with coverage
3. ✅ Builds the application
4. ✅ Deploys to Vercel (on main branch)
5. ✅ Runs database migrations (after deployment)

### Required GitHub Secrets

Add these secrets in GitHub → Settings → Secrets and variables → Actions:

- `DATABASE_URL` - Production database connection string
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
- `VERCEL_TOKEN` - Vercel API token (get from Vercel → Settings → Tokens)
- `VERCEL_ORG_ID` - Vercel organization ID
- `VERCEL_PROJECT_ID` - Vercel project ID

## Post-Deployment

### 1. Verify Deployment

- Check Vercel deployment logs
- Visit your production URL
- Test critical flows (login, create mock, etc.)

### 2. Monitor

- Check Vercel Analytics
- Monitor error logs
- Check database connection health

### 3. Rollback (if needed)

- Go to Vercel → Deployments
- Find previous successful deployment
- Click "..." → "Promote to Production"

## Troubleshooting

### Build Fails

- Check environment variables in Vercel
- Verify `DATABASE_URL` format (use pooling URL)
- Check build logs for specific errors

### Migration Fails

- Verify `DATABASE_URL` is correct
- Check database connection (IP whitelist, password)
- Use direct connection URL (port 5432) for migrations if pooling fails

### Database Connection Issues

- Verify connection pooling URL format
- Check Supabase IP restrictions
- Ensure database is accessible from Vercel

## Resources

- [Vercel Deployment Docs](https://vercel.com/docs)
- [Prisma with Vercel](https://www.prisma.io/docs/guides/deployment/deployment-guides/deploying-to-vercel)
- [Supabase Connection Pooling](https://supabase.com/docs/guides/database/connecting-to-postgres#connection-pooler)

