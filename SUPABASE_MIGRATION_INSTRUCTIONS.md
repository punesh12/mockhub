# How to Apply Organization Schema to Supabase

Since Prisma migrations are having connection issues, you can apply the schema changes directly in Supabase's SQL Editor.

## Option 1: Run SQL in Supabase SQL Editor (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor** in the left sidebar
3. Click **New Query**
4. Copy and paste the contents of `add_organizations_migration.sql`
5. Click **Run** to execute the migration

## Option 2: Use Prisma Migrate (Alternative)

If you want to use Prisma migrations, try:

```bash
# First, ensure you're connected
npx prisma db pull

# Then create and apply migration
npx prisma migrate dev --name add_organizations
```

## Option 3: Use Prisma DB Push (Quick but not for production)

```bash
npx prisma db push --accept-data-loss
```

⚠️ **Warning**: `db push` is for development only and may cause data loss.

## What the Migration Does

The migration will:
1. Create `Organization` table
2. Create `OrganizationMember` table  
3. Add `organizationId` column to `MockApi` table
4. Create all necessary indexes
5. Add foreign key constraints

## Verify Migration

After running the migration, verify it worked:

```bash
npx prisma db pull
npx prisma generate
```

This will sync your Prisma schema with the database and regenerate the client.

