# MockHub API Documentation

Complete API reference for MockHub - A platform for creating and managing mock APIs.

## Table of Contents

- [Base URL](#base-url)
- [Authentication](#authentication)
- [Rate Limiting](#rate-limiting)
- [Error Handling](#error-handling)
- [API Endpoints](#api-endpoints)
  - [Authentication](#authentication-endpoints)
  - [User Management](#user-management-endpoints)
  - [Mock APIs](#mock-api-endpoints)
  - [Organizations](#organization-endpoints)
  - [Request History](#request-history-endpoints)
  - [Dashboard](#dashboard-endpoints)
  - [API Testing](#api-testing-endpoints)
  - [Health & Utilities](#health--utilities-endpoints)

---

## Base URL

```
Production: https://your-domain.com/api
Development: http://localhost:3000/api
```

---

## Authentication

Most endpoints require authentication using Supabase Auth. Authentication is handled via HTTP-only cookies set after login.

### Authentication Flow

1. **Sign Up**: `POST /api/auth/signup` - Creates a user account
2. **Login**: `POST /api/auth/login` - Authenticates and sets session cookies
3. **Get Current User**: `GET /api/auth/me` - Returns current authenticated user
4. **Logout**: `POST /api/auth/logout` - Clears session cookies

### Headers

For authenticated requests, include the session cookie automatically (handled by browser):

```http
Cookie: sb-access-token=<token>; sb-refresh-token=<token>
```

---

## Rate Limiting

All endpoints are rate-limited to prevent abuse:

| Endpoint Type | Limit | Window |
|--------------|-------|--------|
| Authentication | 5 requests | 15 minutes |
| API Endpoints | 60 requests | 1 minute |
| Mock API Execution | 100 requests | 1 minute |
| API Testing | 30 requests | 1 minute |

Rate limit headers are included in responses:

```http
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1633024800
```

When rate limit is exceeded, a `429 Too Many Requests` response is returned:

```json
{
  "error": "Too many requests. Please slow down.",
  "retryAfter": 45
}
```

---

## Error Handling

All errors follow a consistent format:

```json
{
  "error": "Error message",
  "details": "Additional details (development only)"
}
```

### HTTP Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized (authentication required)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `409` - Conflict (duplicate resource)
- `429` - Too Many Requests (rate limit exceeded)
- `500` - Internal Server Error
- `503` - Service Unavailable (database connection issues)

---

## API Endpoints

### Authentication Endpoints

#### Sign Up

Create a new user account.

**Endpoint:** `POST /api/auth/signup`

**Request Body:**
```json
{
  "id": "uuid-from-supabase-auth",
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securepassword123"
}
```

**Response:** `201 Created`
```json
{
  "message": "User created successfully in database",
  "user": {
    "id": "uuid",
    "name": "John Doe",
    "email": "john@example.com",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Error Responses:**
- `400` - Validation error
- `409` - User already exists
- `429` - Rate limit exceeded

---

#### Login

Authenticate user and create session.

**Endpoint:** `POST /api/auth/login`

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "securepassword123"
}
```

**Response:** `200 OK`
```json
{
  "message": "Login successful",
  "user": {
    "id": "uuid",
    "email": "john@example.com",
    "name": "John Doe"
  }
}
```

**Cookies Set:**
- `sb-access-token` - Access token (7 days)
- `sb-refresh-token` - Refresh token (30 days)

**Error Responses:**
- `400` - Validation error
- `401` - Invalid credentials
- `429` - Rate limit exceeded

---

#### Get Current User

Get the currently authenticated user.

**Endpoint:** `GET /api/auth/me`

**Authentication:** Required

**Response:** `200 OK`
```json
{
  "user": {
    "id": "uuid",
    "email": "john@example.com",
    "name": "John Doe"
  }
}
```

**Error Responses:**
- `401` - Not authenticated

---

#### Logout

Clear authentication session.

**Endpoint:** `POST /api/auth/logout`

**Authentication:** Required

**Response:** `200 OK`
```json
{
  "message": "Logged out successfully"
}
```

---

### User Management Endpoints

#### Get User Profile

Get user profile information.

**Endpoint:** `GET /api/user/profile`

**Authentication:** Required

**Response:** `200 OK`
```json
{
  "user": {
    "id": "uuid",
    "name": "John Doe",
    "email": "john@example.com",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

---

#### Update User Profile

Update user profile information.

**Endpoint:** `PUT /api/user/profile`

**Authentication:** Required

**Request Body:**
```json
{
  "name": "Jane Doe",
  "email": "jane@example.com"
}
```

**Response:** `200 OK`
```json
{
  "message": "Profile updated successfully",
  "user": {
    "id": "uuid",
    "name": "Jane Doe",
    "email": "jane@example.com",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Error Responses:**
- `400` - Validation error or email already taken
- `401` - Not authenticated

---

#### Change Password

Change user password.

**Endpoint:** `PUT /api/user/password`

**Authentication:** Required

**Request Body:**
```json
{
  "currentPassword": "oldpassword123",
  "newPassword": "newpassword123",
  "confirmPassword": "newpassword123"
}
```

**Response:** `200 OK`
```json
{
  "message": "Password changed successfully"
}
```

**Error Responses:**
- `400` - Validation error or passwords don't match
- `401` - Not authenticated or invalid current password

---

#### Delete Account

Delete user account and all associated data.

**Endpoint:** `DELETE /api/user/account`

**Authentication:** Required

**Response:** `200 OK`
```json
{
  "message": "Account deleted successfully"
}
```

**Error Responses:**
- `401` - Not authenticated

---

### Mock API Endpoints

#### List Mock APIs

Get a paginated list of mock APIs.

**Endpoint:** `GET /api/mocks`

**Authentication:** Required

**Query Parameters:**
- `page` (number, default: 1) - Page number
- `limit` (number, default: 12) - Items per page
- `search` (string) - Search by name or endpoint
- `method` (string) - Filter by HTTP method (GET, POST, etc.)
- `statusCode` (number) - Filter by response status code
- `organizationId` (string) - Filter by organization
- `personalOnly` (boolean) - Show only personal mocks
- `sortBy` (string) - Sort field (name, method, createdAt)
- `sortOrder` (string) - Sort order (asc, desc)

**Example:**
```
GET /api/mocks?page=1&limit=12&method=GET&search=users
```

**Response:** `200 OK`
```json
{
  "mocks": [
    {
      "id": "uuid",
      "name": "Get Users",
      "endpoint": "/users",
      "method": "GET",
      "responseCode": 200,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "organizationId": null,
      "organization": {
        "id": "uuid",
        "name": "My Organization"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 12,
    "total": 50,
    "totalPages": 5
  }
}
```

---

#### Create Mock API

Create a new mock API.

**Endpoint:** `POST /api/mocks`

**Authentication:** Required

**Request Body:**
```json
{
  "name": "Get Users",
  "endpoint": "/users",
  "method": "GET",
  "responseCode": 200,
  "responseBody": {
    "users": [
      { "id": 1, "name": "John" }
    ]
  },
  "organizationId": "uuid-or-null"
}
```

**Response:** `201 Created`
```json
{
  "message": "Mock API created successfully",
  "mock": {
    "id": "uuid",
    "name": "Get Users",
    "endpoint": "/users",
    "method": "GET",
    "responseCode": 200,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "organization": {
      "id": "uuid",
      "name": "My Organization"
    }
  }
}
```

**Error Responses:**
- `400` - Validation error or duplicate endpoint/method
- `401` - Not authenticated
- `403` - No permission to create mocks in organization

---

#### Get Mock API

Get a single mock API by ID.

**Endpoint:** `GET /api/mocks/[id]`

**Authentication:** Required

**Response:** `200 OK`
```json
{
  "mock": {
    "id": "uuid",
    "name": "Get Users",
    "endpoint": "/users",
    "method": "GET",
    "responseCode": 200,
    "responseBody": {
      "users": []
    },
    "createdAt": "2024-01-01T00:00:00.000Z",
    "organization": {
      "id": "uuid",
      "name": "My Organization"
    }
  }
}
```

**Error Responses:**
- `401` - Not authenticated
- `403` - No access to this mock
- `404` - Mock not found

---

#### Update Mock API

Update an existing mock API.

**Endpoint:** `PUT /api/mocks/[id]`

**Authentication:** Required

**Request Body:**
```json
{
  "name": "Get All Users",
  "endpoint": "/users",
  "method": "GET",
  "responseCode": 200,
  "responseBody": {
    "users": []
  }
}
```

**Response:** `200 OK`
```json
{
  "message": "Mock updated successfully",
  "mock": {
    "id": "uuid",
    "name": "Get All Users",
    "endpoint": "/users",
    "method": "GET",
    "responseCode": 200,
    "responseBody": {
      "users": []
    },
    "createdAt": "2024-01-01T00:00:00.000Z",
    "organization": {
      "id": "uuid",
      "name": "My Organization"
    }
  }
}
```

**Error Responses:**
- `400` - Validation error or duplicate endpoint/method
- `401` - Not authenticated
- `403` - No access to this mock
- `404` - Mock not found

---

#### Delete Mock API

Delete a mock API.

**Endpoint:** `DELETE /api/mocks/[id]`

**Authentication:** Required

**Response:** `200 OK`
```json
{
  "message": "Mock deleted successfully"
}
```

**Error Responses:**
- `401` - Not authenticated
- `403` - No access to this mock
- `404` - Mock not found

---

#### Execute Mock API

Execute a mock API by making a request to its endpoint.

**Endpoint:** `GET|POST|PUT|PATCH|DELETE /api/[endpoint]`

**Authentication:** Optional (required for private organization mocks)

**Example:**
```
GET /api/users
POST /api/users
GET /api/org/my-org/users
```

**Response:** Returns the configured mock response with the configured status code.

**Example Response:** `200 OK`
```json
{
  "users": [
    { "id": 1, "name": "John" }
  ]
}
```

**Error Responses:**
- `404` - Mock not found for endpoint/method
- `401` - Authentication required for private organization
- `403` - No access to organization's mocks

**Note:** Organization-scoped mocks can be accessed via `/api/org/[slug]/[endpoint]`

---

### Organization Endpoints

#### List Organizations

Get a paginated list of organizations.

**Endpoint:** `GET /api/organizations`

**Authentication:** Optional (required for private organizations)

**Query Parameters:**
- `page` (number, default: 1) - Page number
- `limit` (number, default: 12) - Items per page
- `search` (string) - Search by name, description, or slug
- `visibility` (string) - Filter by visibility (private, public)
- `public` (boolean) - Show only public organizations (no auth required)

**Example:**
```
GET /api/organizations?page=1&limit=12&search=team
GET /api/organizations?public=true
```

**Response:** `200 OK`
```json
{
  "organizations": [
    {
      "id": "uuid",
      "name": "My Team",
      "slug": "my-team",
      "description": "Team organization",
      "visibility": "public",
      "owner": {
        "id": "uuid",
        "name": "John Doe",
        "email": "john@example.com"
      },
      "members": [
        {
          "id": "uuid",
          "role": "admin",
          "user": {
            "id": "uuid",
            "name": "Jane Doe",
            "email": "jane@example.com"
          }
        }
      ],
      "_count": {
        "members": 5,
        "mocks": 10
      },
      "userRole": "owner",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 12,
    "total": 20,
    "totalPages": 2
  }
}
```

---

#### Create Organization

Create a new organization.

**Endpoint:** `POST /api/organizations`

**Authentication:** Required

**Request Body:**
```json
{
  "name": "My Team",
  "description": "Team organization for API mocks",
  "visibility": "private"
}
```

**Response:** `201 Created`
```json
{
  "message": "Organization created successfully",
  "organization": {
    "id": "uuid",
    "name": "My Team",
    "slug": "my-team",
    "description": "Team organization for API mocks",
    "visibility": "private",
    "owner": {
      "id": "uuid",
      "name": "John Doe",
      "email": "john@example.com"
    },
    "members": [],
    "_count": {
      "members": 1,
      "mocks": 0
    },
    "userRole": "owner",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Error Responses:**
- `400` - Validation error
- `401` - Not authenticated

---

#### Get Organization

Get organization details by ID or slug.

**Endpoint:** `GET /api/organizations/[id]`

**Authentication:** Optional (required for private organizations)

**Response:** `200 OK`
```json
{
  "organization": {
    "id": "uuid",
    "name": "My Team",
    "slug": "my-team",
    "description": "Team organization",
    "visibility": "public",
    "owner": {
      "id": "uuid",
      "name": "John Doe",
      "email": "john@example.com"
    },
    "members": [
      {
        "id": "uuid",
        "role": "admin",
        "user": {
          "id": "uuid",
          "name": "Jane Doe",
          "email": "jane@example.com"
        }
      }
    ],
    "_count": {
      "members": 5,
      "mocks": 10
    },
    "userRole": "owner",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Error Responses:**
- `401` - Authentication required for private organization
- `404` - Organization not found

---

#### Update Organization

Update organization details.

**Endpoint:** `PUT /api/organizations/[id]`

**Authentication:** Required (admin/owner only)

**Request Body:**
```json
{
  "name": "Updated Team Name",
  "description": "Updated description",
  "visibility": "public"
}
```

**Response:** `200 OK`
```json
{
  "message": "Organization updated successfully",
  "organization": {
    "id": "uuid",
    "name": "Updated Team Name",
    "slug": "updated-team-name",
    "description": "Updated description",
    "visibility": "public",
    "owner": {
      "id": "uuid",
      "name": "John Doe",
      "email": "john@example.com"
    },
    "members": [],
    "_count": {
      "members": 5,
      "mocks": 10
    },
    "userRole": "owner",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Error Responses:**
- `400` - Validation error
- `401` - Not authenticated
- `403` - No permission to edit
- `404` - Organization not found

---

#### Delete Organization

Delete an organization (owner only).

**Endpoint:** `DELETE /api/organizations/[id]`

**Authentication:** Required (owner only)

**Response:** `200 OK`
```json
{
  "message": "Organization deleted successfully"
}
```

**Error Responses:**
- `401` - Not authenticated
- `403` - Only owner can delete
- `404` - Organization not found

---

#### List Organization Members

Get members of an organization.

**Endpoint:** `GET /api/organizations/[id]/members`

**Authentication:** Required

**Response:** `200 OK`
```json
{
  "members": [
    {
      "id": "uuid",
      "role": "admin",
      "user": {
        "id": "uuid",
        "name": "Jane Doe",
        "email": "jane@example.com"
      },
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

**Error Responses:**
- `401` - Not authenticated
- `404` - Organization not found or no access

---

#### Invite Member

Invite a user to join the organization.

**Endpoint:** `POST /api/organizations/[id]/members`

**Authentication:** Required (admin/owner only)

**Request Body:**
```json
{
  "email": "newmember@example.com",
  "role": "member"
}
```

**Response:** `201 Created`
```json
{
  "message": "Member invited successfully",
  "member": {
    "id": "uuid",
    "role": "member",
    "user": {
      "id": "uuid",
      "name": "New Member",
      "email": "newmember@example.com"
    },
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Error Responses:**
- `400` - Validation error or user already a member
- `401` - Not authenticated
- `403` - No permission to invite members
- `404` - Organization or user not found

---

#### Update Member Role

Update a member's role in the organization.

**Endpoint:** `PUT /api/organizations/[id]/members/[memberId]`

**Authentication:** Required (admin/owner only)

**Request Body:**
```json
{
  "role": "admin"
}
```

**Response:** `200 OK`
```json
{
  "message": "Member role updated successfully",
  "member": {
    "id": "uuid",
    "role": "admin",
    "user": {
      "id": "uuid",
      "name": "Jane Doe",
      "email": "jane@example.com"
    }
  }
}
```

**Error Responses:**
- `400` - Validation error
- `401` - Not authenticated
- `403` - No permission to update roles
- `404` - Organization or member not found

---

#### Remove Member

Remove a member from the organization.

**Endpoint:** `DELETE /api/organizations/[id]/members/[memberId]`

**Authentication:** Required (admin/owner only)

**Response:** `200 OK`
```json
{
  "message": "Member removed successfully"
}
```

**Error Responses:**
- `401` - Not authenticated
- `403` - No permission to remove members
- `404` - Organization or member not found

---

### Request History Endpoints

#### List Request History

Get paginated request history.

**Endpoint:** `GET /api/history`

**Authentication:** Required

**Query Parameters:**
- `page` (number, default: 1) - Page number
- `limit` (number, default: 20) - Items per page
- `method` (string) - Filter by HTTP method
- `status` (number) - Filter by status code
- `search` (string) - Search by URL
- `startDate` (string) - Start date (ISO format)
- `endDate` (string) - End date (ISO format)
- `sortBy` (string) - Sort field (createdAt, method, status, responseTime)
- `sortOrder` (string) - Sort order (asc, desc)

**Example:**
```
GET /api/history?page=1&limit=20&method=GET&status=200
```

**Response:** `200 OK`
```json
{
  "history": [
    {
      "id": "uuid",
      "url": "https://api.example.com/users",
      "method": "GET",
      "status": 200,
      "responseTime": 0.234,
      "responseBody": {
        "users": []
      },
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  },
  "statistics": {
    "total": 100,
    "successRate": 95.5,
    "avgResponseTime": 0.234,
    "successCount": 95,
    "errorCount": 5
  }
}
```

---

#### Get Request History Details

Get details of a specific request history entry.

**Endpoint:** `GET /api/history/[id]`

**Authentication:** Required

**Response:** `200 OK`
```json
{
  "history": {
    "id": "uuid",
    "url": "https://api.example.com/users",
    "method": "GET",
    "status": 200,
    "responseTime": 0.234,
    "responseBody": {
      "users": []
    },
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Error Responses:**
- `401` - Not authenticated
- `404` - History entry not found

---

#### Delete Request History

Delete a request history entry.

**Endpoint:** `DELETE /api/history/[id]`

**Authentication:** Required

**Response:** `200 OK`
```json
{
  "message": "History entry deleted successfully"
}
```

**Error Responses:**
- `401` - Not authenticated
- `404` - History entry not found

---

#### Get History Charts Data

Get chart data for request history visualization.

**Endpoint:** `GET /api/history/charts`

**Authentication:** Required

**Response:** `200 OK`
```json
{
  "responseTime": [
    {
      "date": "Jan 1",
      "avgResponseTime": 234,
      "minResponseTime": 100,
      "maxResponseTime": 500
    }
  ],
  "requestVolume": [
    {
      "date": "Jan 1",
      "requests": 50,
      "successful": 45,
      "failed": 5
    }
  ],
  "statusCode": [
    {
      "status": "200",
      "count": 45
    },
    {
      "status": "404",
      "count": 5
    }
  ]
}
```

---

### Dashboard Endpoints

#### Get Dashboard Statistics

Get dashboard statistics.

**Endpoint:** `GET /api/dashboard/stats`

**Authentication:** Required

**Response:** `200 OK`
```json
{
  "stats": {
    "totalMocks": 25,
    "totalHistory": 150,
    "successRate": 95.5,
    "activeEndpoints": 10
  }
}
```

**Error Responses:**
- `401` - Not authenticated

---

### API Testing Endpoints

#### Test API Request

Make a test API request and optionally save to history.

**Endpoint:** `POST /api/test`

**Authentication:** Required

**Request Body:**
```json
{
  "url": "https://api.example.com/users",
  "method": "GET",
  "headers": {
    "Authorization": "Bearer token"
  },
  "queryParams": {
    "page": "1",
    "limit": "10"
  },
  "requestBody": {
    "name": "John"
  },
  "saveToHistory": true
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "status": 200,
  "statusText": "OK",
  "headers": {
    "content-type": "application/json"
  },
  "data": {
    "users": []
  },
  "responseTime": 234
}
```

**Error Response:** `200 OK` (with error details)
```json
{
  "success": false,
  "error": {
    "message": "Request failed",
    "code": "ECONNREFUSED",
    "details": null
  },
  "responseTime": 0
}
```

**Error Responses:**
- `400` - Validation error
- `401` - Not authenticated
- `429` - Rate limit exceeded

---

### Health & Utilities Endpoints

#### Health Check

Check API and database health.

**Endpoint:** `GET /api/health`

**Authentication:** Not required

**Response:** `200 OK`
```json
{
  "status": "healthy",
  "database": {
    "connected": true,
    "message": "Database connection successful"
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

**Error Response:** `503 Service Unavailable`
```json
{
  "status": "unhealthy",
  "database": {
    "connected": false,
    "error": "Connection timeout"
  }
}
```

---

#### Test Database Connection

Test database connection (development only).

**Endpoint:** `GET /api/test-db`

**Authentication:** Not required

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Database connection successful",
  "data": {
    "userCount": 10,
    "mockCount": 25,
    "connectionString": "DATABASE_URL is set"
  }
}
```

---

## Organization-Scoped Mock API Execution

Mock APIs can be executed with organization context:

### Personal Mocks
```
GET /api/users
POST /api/users
```

### Organization-Scoped Mocks
```
GET /api/org/my-org/users
POST /api/org/my-org/users
```

**Access Control:**
- **Public Organizations**: Mocks are accessible without authentication
- **Private Organizations**: Authentication required, user must be a member

**Priority:**
1. Personal mocks (no organization)
2. Organization mocks (if user has access)

---

## Input Validation & Sanitization

All inputs are validated and sanitized:

- **Email**: Validated format, sanitized
- **Password**: Minimum 8 characters, uppercase, lowercase, number, special character
- **Name**: 2-100 characters, trimmed
- **Endpoint**: Must start with `/`, max 255 characters, path traversal prevention
- **URL**: Must start with `http://` or `https://`
- **JSON**: Validated and sanitized to prevent prototype pollution
- **XSS Prevention**: All string inputs sanitized

---

## CORS

CORS is enabled for all mock API execution endpoints:

```http
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, HEAD, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
Access-Control-Max-Age: 86400
```

---

## Examples

### Complete Workflow Example

1. **Sign Up**
```bash
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "id": "uuid-from-supabase",
    "name": "John Doe",
    "email": "john@example.com",
    "password": "SecurePass123!"
  }'
```

2. **Login**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "SecurePass123!"
  }' \
  -c cookies.txt
```

3. **Create Mock API**
```bash
curl -X POST http://localhost:3000/api/mocks \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "name": "Get Users",
    "endpoint": "/users",
    "method": "GET",
    "responseCode": 200,
    "responseBody": {
      "users": [
        { "id": 1, "name": "John" }
      ]
    }
  }'
```

4. **Execute Mock API**
```bash
curl http://localhost:3000/api/users
```

---

## Support

For issues or questions:
- Check the [README.md](./README.md) for setup instructions
- Review [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) for common issues
- Open an issue on GitHub

---

**Last Updated:** 2024-01-01

