# Supabase Integration Guide

This project uses Supabase as the PostgreSQL database provider. This guide explains how to set up and configure Supabase.

## Prerequisites

1. Create a Supabase account at [supabase.com](https://supabase.com)
2. Create a new project in Supabase

## Setup Steps

### 1. Get Your Supabase Credentials

1. Go to your Supabase project dashboard
2. Navigate to **Settings** → **API**
3. Copy the following:
   - **Project URL** (for `NEXT_PUBLIC_SUPABASE_URL`)
   - **anon/public key** (for `NEXT_PUBLIC_SUPABASE_ANON_KEY`)

### 2. Get Database Connection Strings

1. Go to **Settings** → **Database**
2. You'll find two connection strings:

   **Direct Connection** (for migrations):

   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
   ```

   **Connection Pooling** (for serverless/server-side):

   ```
   postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true
   ```

### 3. Environment Variables

Add the following to your `.env` file:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://[PROJECT-REF].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# Database Connection
# For local development and migrations, use direct connection
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"

# For production (Vercel/serverless), use connection pooling
# DATABASE_URL="postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true"
```

### 4. Connection Pooling

**Important**: Supabase provides connection pooling to handle serverless environments efficiently.

- **Direct Connection** (port 5432): Use for migrations and local development
- **Connection Pooling** (port 6543): Use for production/serverless environments

For Vercel deployments, use the connection pooling URL in your environment variables.

### 5. Run Prisma Migrations

```bash
# Generate Prisma Client
npm run db:generate

# Push schema to Supabase (for development)
npm run db:push

# Or create and run migrations (recommended for production)
npm run db:migrate
```

## Supabase Features

Currently, this project uses Supabase for:

- ✅ PostgreSQL database (via Prisma)
- ✅ Connection pooling for serverless

Future integrations can include:

- Supabase Auth (alternative to custom JWT)
- Supabase Storage (for file uploads)
- Supabase Realtime (for live updates)
- Supabase Edge Functions

## Troubleshooting

### Connection Issues

1. **Check your connection string format**
   - Direct: `postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres`
   - Pooling: `postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true`

2. **Verify your password**
   - Reset it in Supabase dashboard if needed

3. **Check IP restrictions**
   - Go to **Settings** → **Database** → **Connection Pooling**
   - Ensure your IP is allowed (or disable restrictions for development)

### Migration Issues

- Use the direct connection URL (port 5432) for migrations
- Connection pooling doesn't support all Prisma migration features

## Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Connection Pooling](https://supabase.com/docs/guides/database/connecting-to-postgres#connection-pooler)
- [Prisma with Supabase](https://www.prisma.io/docs/guides/deployment/deployment-guides/deploying-to-vercel#using-supabase)
