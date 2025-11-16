-- Performance Optimization: Add Database Indexes
-- Run this migration in Supabase SQL Editor to improve query performance

-- MockApi indexes
CREATE INDEX IF NOT EXISTS "MockApi_userId_organizationId_createdAt_idx" ON "MockApi"("userId", "organizationId", "createdAt");
CREATE INDEX IF NOT EXISTS "MockApi_userId_organizationId_idx" ON "MockApi"("userId", "organizationId");
CREATE INDEX IF NOT EXISTS "MockApi_method_idx" ON "MockApi"("method");
CREATE INDEX IF NOT EXISTS "MockApi_responseCode_idx" ON "MockApi"("responseCode");
CREATE INDEX IF NOT EXISTS "MockApi_name_idx" ON "MockApi"("name");
CREATE INDEX IF NOT EXISTS "MockApi_endpoint_idx" ON "MockApi"("endpoint");
CREATE INDEX IF NOT EXISTS "MockApi_createdAt_idx" ON "MockApi"("createdAt");

-- Organization indexes
CREATE INDEX IF NOT EXISTS "Organization_visibility_idx" ON "Organization"("visibility");
CREATE INDEX IF NOT EXISTS "Organization_name_idx" ON "Organization"("name");
CREATE INDEX IF NOT EXISTS "Organization_createdAt_idx" ON "Organization"("createdAt");

-- RequestHistory indexes
CREATE INDEX IF NOT EXISTS "RequestHistory_userId_createdAt_idx" ON "RequestHistory"("userId", "createdAt");
CREATE INDEX IF NOT EXISTS "RequestHistory_userId_method_idx" ON "RequestHistory"("userId", "method");
CREATE INDEX IF NOT EXISTS "RequestHistory_userId_status_idx" ON "RequestHistory"("userId", "status");
CREATE INDEX IF NOT EXISTS "RequestHistory_userId_createdAt_status_idx" ON "RequestHistory"("userId", "createdAt", "status");
CREATE INDEX IF NOT EXISTS "RequestHistory_method_idx" ON "RequestHistory"("method");
CREATE INDEX IF NOT EXISTS "RequestHistory_status_idx" ON "RequestHistory"("status");
CREATE INDEX IF NOT EXISTS "RequestHistory_url_idx" ON "RequestHistory"("url");

-- Note: Some indexes may already exist from previous migrations
-- The IF NOT EXISTS clause ensures no errors if indexes already exist

