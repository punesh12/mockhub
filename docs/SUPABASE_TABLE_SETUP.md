# Supabase Table Setup Guide

This guide will help you create the required tables in Supabase using the Table Editor or SQL Editor.

## Option 1: Using SQL Editor (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor** in the left sidebar
3. Click **New Query**
4. Copy and paste the contents of `database-schema.sql`
5. Click **Run** to execute the SQL

## Option 2: Using Table Editor

### 1. Create User Table

1. Go to **Table Editor** → **New Table**
2. Table name: `User`
3. Add columns:
   - `id` (type: `text`, Primary Key: ✓, Nullable: ✗)
   - `name` (type: `text`, Nullable: ✗)
   - `email` (type: `text`, Unique: ✓, Nullable: ✗)
   - `password` (type: `text`, Nullable: ✓)
   - `createdAt` (type: `timestamptz`, Default: `now()`, Nullable: ✗)

### 2. Create MockApi Table

1. Go to **Table Editor** → **New Table**
2. Table name: `MockApi`
3. Add columns:
   - `id` (type: `text`, Primary Key: ✓, Nullable: ✗, Default: `gen_random_uuid()::text`)
   - `userId` (type: `text`, Foreign Key: `User.id`, Nullable: ✗)
   - `name` (type: `text`, Nullable: ✗)
   - `endpoint` (type: `text`, Nullable: ✗)
   - `method` (type: `text`, Nullable: ✗)
   - `responseBody` (type: `jsonb`, Nullable: ✗)
   - `responseCode` (type: `int4`, Default: `200`, Nullable: ✗)
   - `createdAt` (type: `timestamptz`, Default: `now()`, Nullable: ✗)
4. Add Foreign Key:
   - Column: `userId`
   - References: `User.id`
   - On Delete: `CASCADE`
5. Add Index:
   - Column: `userId`

### 3. Create RequestHistory Table

1. Go to **Table Editor** → **New Table**
2. Table name: `RequestHistory`
3. Add columns:
   - `id` (type: `text`, Primary Key: ✓, Nullable: ✗, Default: `gen_random_uuid()::text`)
   - `userId` (type: `text`, Foreign Key: `User.id`, Nullable: ✗)
   - `url` (type: `text`, Nullable: ✗)
   - `method` (type: `text`, Nullable: ✗)
   - `status` (type: `int4`, Nullable: ✗)
   - `responseTime` (type: `float8`, Nullable: ✗)
   - `responseBody` (type: `jsonb`, Nullable: ✓)
   - `createdAt` (type: `timestamptz`, Default: `now()`, Nullable: ✗)
4. Add Foreign Key:
   - Column: `userId`
   - References: `User.id`
   - On Delete: `CASCADE`
5. Add Indexes:
   - Column: `userId`
   - Column: `createdAt`

## Verify Tables

After creating the tables, verify they exist:

1. Go to **Table Editor**
2. You should see three tables: `User`, `MockApi`, and `RequestHistory`
3. Check that foreign keys and indexes are set up correctly

## Important Notes

- The `User` table's `id` field should match Supabase Auth user IDs
- Foreign keys use `CASCADE` deletion, so deleting a user will delete their mocks and history
- The `responseBody` fields use `jsonb` type for storing JSON data
- Indexes are created for better query performance

## Troubleshooting

If you get errors:

- Make sure the `User` table is created first (other tables depend on it)
- Check that column types match exactly (especially `text` vs `varchar`)
- Verify foreign key relationships are set up correctly
- Ensure UUID extension is enabled (should be by default in Supabase)
