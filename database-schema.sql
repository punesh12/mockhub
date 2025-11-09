-- MockHub Database Schema
-- Run this in Supabase SQL Editor or Table Editor

-- Enable UUID extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
-- Note: This table links to Supabase Auth users
-- The 'id' field should match Supabase Auth user IDs
CREATE TABLE IF NOT EXISTS "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL UNIQUE,
    "password" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- MockApi table
CREATE TABLE IF NOT EXISTS "MockApi" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "responseBody" JSONB NOT NULL,
    "responseCode" INTEGER NOT NULL DEFAULT 200,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT "MockApi_userId_fkey" FOREIGN KEY ("userId") 
        REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RequestHistory table
CREATE TABLE IF NOT EXISTS "RequestHistory" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "userId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "status" INTEGER NOT NULL,
    "responseTime" DOUBLE PRECISION NOT NULL,
    "responseBody" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT "RequestHistory_userId_fkey" FOREIGN KEY ("userId") 
        REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS "MockApi_userId_idx" ON "MockApi"("userId");
CREATE INDEX IF NOT EXISTS "RequestHistory_userId_idx" ON "RequestHistory"("userId");
CREATE INDEX IF NOT EXISTS "RequestHistory_createdAt_idx" ON "RequestHistory"("createdAt");

-- Add comments for documentation
COMMENT ON TABLE "User" IS 'User accounts linked to Supabase Auth';
COMMENT ON TABLE "MockApi" IS 'Mock API endpoints created by users';
COMMENT ON TABLE "RequestHistory" IS 'API request history for testing';

