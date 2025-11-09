# Routes Configuration

This document lists all routes in the application and their access levels.

## Public Routes

These routes are accessible without authentication:

| Path           | Description  |
| -------------- | ------------ |
| `/`            | Landing page |
| `/auth/login`  | Login page   |
| `/auth/signup` | Signup page  |

## Private Routes

These routes require authentication. Users will be redirected to `/auth/login` if not authenticated:

| Path                 | Description            |
| -------------------- | ---------------------- |
| `/dashboard`         | Main dashboard         |
| `/dashboard/mocks`   | Mock APIs list         |
| `/dashboard/history` | Request history        |
| `/dashboard/test`    | API testing playground |
| `/dashboard/profile` | User profile           |

## Route Configuration

Routes are configured in `lib/routes.ts`. To add a new route:

1. Add the route to the `routes` array
2. Set `access: "public"` or `access: "private"`
3. Add an optional description

Example:

```typescript
{
  path: "/dashboard/settings",
  access: "private",
  description: "User settings",
}
```

## Middleware Protection

The middleware (`middleware.ts`) automatically:

- Redirects unauthenticated users from private routes to `/auth/login`
- Redirects authenticated users from auth pages to `/dashboard`
- Preserves the original path in the redirect query parameter for post-login redirect

## Adding New Routes

1. **Create the page** in `app/[path]/page.tsx`
2. **Add to routes config** in `lib/routes.ts`
3. **Update this document** with the new route
