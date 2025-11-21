/**
 * Mock data generators for tests
 */

import type { User } from "@supabase/supabase-js"

export const createMockUser = (overrides?: Partial<User>): User => {
  return {
    id: "test-user-id",
    email: "test@example.com",
    user_metadata: {
      name: "Test User",
    },
    app_metadata: {},
    aud: "authenticated",
    created_at: new Date().toISOString(),
    ...overrides,
  } as User
}

export const createMockRequest = (overrides?: Partial<Request>): Request => {
  return {
    url: "http://localhost:3000/api/test",
    method: "GET",
    headers: new Headers(),
    ...overrides,
  } as Request
}

