-- Migration: Add Organizations and OrganizationMember tables
-- This migration adds organization support to the existing database

-- Create Organization table
CREATE TABLE IF NOT EXISTS "Organization" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "visibility" TEXT NOT NULL DEFAULT 'private',
    "ownerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

-- Create OrganizationMember table
CREATE TABLE IF NOT EXISTS "OrganizationMember" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "organizationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'member',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrganizationMember_pkey" PRIMARY KEY ("id")
);

-- Add organizationId column to MockApi if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'MockApi' AND column_name = 'organizationId'
    ) THEN
        ALTER TABLE "MockApi" ADD COLUMN "organizationId" TEXT;
    END IF;
END $$;

-- Create indexes
CREATE UNIQUE INDEX IF NOT EXISTS "Organization_slug_key" ON "Organization"("slug");
CREATE INDEX IF NOT EXISTS "Organization_ownerId_idx" ON "Organization"("ownerId");
CREATE INDEX IF NOT EXISTS "Organization_slug_idx" ON "Organization"("slug");
CREATE INDEX IF NOT EXISTS "OrganizationMember_organizationId_idx" ON "OrganizationMember"("organizationId");
CREATE INDEX IF NOT EXISTS "OrganizationMember_userId_idx" ON "OrganizationMember"("userId");
CREATE UNIQUE INDEX IF NOT EXISTS "OrganizationMember_organizationId_userId_key" ON "OrganizationMember"("organizationId", "userId");

-- Create index on MockApi organizationId if it doesn't exist
CREATE INDEX IF NOT EXISTS "MockApi_organizationId_idx" ON "MockApi"("organizationId");
CREATE INDEX IF NOT EXISTS "MockApi_organizationId_endpoint_method_idx" ON "MockApi"("organizationId", "endpoint", "method");

-- Add foreign key constraints
DO $$ 
BEGIN
    -- Add Organization ownerId foreign key
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'Organization_ownerId_fkey'
    ) THEN
        ALTER TABLE "Organization" 
        ADD CONSTRAINT "Organization_ownerId_fkey" 
        FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    -- Add OrganizationMember organizationId foreign key
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'OrganizationMember_organizationId_fkey'
    ) THEN
        ALTER TABLE "OrganizationMember" 
        ADD CONSTRAINT "OrganizationMember_organizationId_fkey" 
        FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    -- Add OrganizationMember userId foreign key
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'OrganizationMember_userId_fkey'
    ) THEN
        ALTER TABLE "OrganizationMember" 
        ADD CONSTRAINT "OrganizationMember_userId_fkey" 
        FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    -- Add MockApi organizationId foreign key
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'MockApi_organizationId_fkey'
    ) THEN
        ALTER TABLE "MockApi" 
        ADD CONSTRAINT "MockApi_organizationId_fkey" 
        FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

