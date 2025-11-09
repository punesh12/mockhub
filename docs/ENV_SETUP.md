# Environment Variables Setup

This guide helps you set up the required environment variables for MockHub.

## Quick Setup

1. **Create `.env.local` file** in the root of the project:

   ```bash
   touch .env.local
   ```

2. **Get your Supabase credentials**:
   - Go to [supabase.com](https://supabase.com) and create/login to your project
   - Navigate to **Settings** → **Database**
   - Copy the **Connection string** (use "Direct connection" for local dev)

3. **Add to `.env.local`**:

   ```env
   # Supabase Database Connection
   # Get this from Supabase Dashboard → Settings → Database
   DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"

   # Supabase API Configuration (optional, for future features)
   NEXT_PUBLIC_SUPABASE_URL="https://[PROJECT-REF].supabase.co"
   NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key-here"

   # JWT Secret (generate a random string)
   JWT_SECRET="your-secret-key-change-in-production"
   ```

## Required Variables

### DATABASE_URL (Required)

- **What**: PostgreSQL connection string for Prisma
- **Where to get**: Supabase Dashboard → Settings → Database → Connection string
- **Format**: `postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres`
- **For local dev**: Use "Direct connection" (port 5432)
- **For production**: Use "Connection pooling" (port 6543)

### JWT_SECRET (Required)

- **What**: Secret key for JWT token signing
- **How to generate**: Use a random string generator or run:
  ```bash
  openssl rand -base64 32
  ```
- **Example**: `"a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6"`

### NEXT_PUBLIC_SUPABASE_URL (Optional)

- **What**: Your Supabase project URL
- **Where to get**: Supabase Dashboard → Settings → API → Project URL
- **Format**: `https://[PROJECT-REF].supabase.co`

### NEXT_PUBLIC_SUPABASE_ANON_KEY (Optional)

- **What**: Your Supabase anonymous/public key
- **Where to get**: Supabase Dashboard → Settings → API → anon/public key

## Example `.env.local` File

```env
# Database Connection (Required)
DATABASE_URL="postgresql://postgres:your-password@db.abcdefghijklmnop.supabase.co:5432/postgres"

# JWT Secret (Required)
JWT_SECRET="your-random-secret-key-here"

# Supabase Configuration (Optional - for future features)
NEXT_PUBLIC_SUPABASE_URL="https://abcdefghijklmnop.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

## Getting Supabase Connection String

1. Go to your Supabase project dashboard
2. Click **Settings** (gear icon) in the sidebar
3. Click **Database** in the settings menu
4. Scroll to **Connection string** section
5. Select **URI** tab
6. Copy the connection string
7. Replace `[YOUR-PASSWORD]` with your actual database password
8. Paste into `.env.local` as `DATABASE_URL`

## Troubleshooting

### "DATABASE_URL is not set" Error

**Solution**: Make sure you have:

1. Created `.env.local` file in the project root
2. Added `DATABASE_URL` with your Supabase connection string
3. Restarted your development server after adding the variable

### Connection Refused

**Possible causes**:

- Wrong password in connection string
- IP address not whitelisted in Supabase
- Using wrong connection type (use "Direct connection" for local dev)

**Solution**:

- Verify password in Supabase Dashboard → Settings → Database
- Check IP restrictions in Supabase Dashboard → Settings → Database → Connection Pooling
- Make sure you're using the "Direct connection" string (port 5432) for local development

## Security Notes

⚠️ **Important**:

- Never commit `.env.local` to git (it's already in `.gitignore`)
- Use different `JWT_SECRET` for production
- For production, use connection pooling URL instead of direct connection
- Keep your database password secure

## Next Steps

After setting up `.env.local`:

1. Run `npm run db:generate` to generate Prisma Client
2. Run `npm run db:push` to push schema to database
3. Start the dev server: `npm run dev`

For more details, see [SUPABASE_SETUP.md](./SUPABASE_SETUP.md)
