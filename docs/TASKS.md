# MockHub - Development Tasks

This document outlines all tasks to be completed for the MockHub project.

## ✅ Completed Tasks

- [x] Project setup with Next.js 16, TypeScript, Tailwind CSS
- [x] shadcn/ui configuration with blue theme
- [x] Prisma schema with User, MockApi, and RequestHistory models
- [x] Landing page with modern UI and animations
- [x] Framer Motion integration for animations
- [x] Basic folder structure (app routes, components, lib)

---

## 🔐 Authentication System (Week 1)

### Frontend Pages

- [x] **Signup Page** (`/app/auth/signup/page.tsx`)
  - [x] Create signup form with name, email, password fields
  - [x] Add form validation (email format, password strength)
  - [x] Add error handling and display
  - [x] Add loading states
  - [x] Add success redirect to login
  - [x] Modern UI with shadcn/ui components
  - [x] Add animations and transitions

- [x] **Login Page** (`/app/auth/login/page.tsx`)
  - [x] Create login form with email and password fields
  - [x] Add form validation
  - [x] Add error handling and display
  - [x] Add loading states
  - [x] Add success redirect to dashboard
  - [x] Modern UI with shadcn/ui components
  - [x] Add "Forgot Password" link
  - [x] Add "Forgot Password" functionality

- [x] **Forgot Password Page** (`/app/auth/forgot-password/page.tsx`)
  - [x] Create forgot password form with email field
  - [x] Add form validation
  - [x] Add error handling and display
  - [x] Add loading states
  - [x] Add success message after email sent
  - [x] Add "Back to Login" link
  - [x] Modern UI with shadcn/ui components
  - [x] ES6 arrow function format

- [x] **Reset Password Page** (`/app/auth/reset-password/page.tsx`)
  - [x] Create reset password form
  - [x] Validate reset token from URL hash (Supabase flow)
  - [x] Add password and confirm password fields
  - [x] Add password strength validation
  - [x] Add validation
  - [x] Add error handling
  - [x] Add loading states
  - [x] Add success redirect to login
  - [x] Modern UI with shadcn/ui components
  - [x] ES6 arrow function format

### Backend API Routes

- [x] **Signup API** (`/app/api/auth/signup/route.ts`)
  - [x] Validate request body (name, email, password)
  - [x] Check if user already exists
  - [x] Create user with Supabase Auth (replaces bcrypt)
  - [x] Create user in database
  - [x] Return success response or error

- [x] **Login API** (`/app/api/auth/login/route.ts`)
  - [x] Validate request body (email, password)
  - [x] Authenticate with Supabase Auth
  - [x] Set session cookies (access & refresh tokens)
  - [x] Return user data

- [x] **Logout API** (`/app/api/auth/logout/route.ts`)
  - [x] Sign out from Supabase Auth
  - [x] Clear session cookies

- [x] **Get User API** (`/app/api/auth/me/route.ts`)
  - [x] Get current user session
  - [x] Return user data

- [x] **Forgot Password API** (`/app/api/auth/forgot-password/route.ts`)
  - [x] Validate email address
  - [x] Send password reset email via Supabase Auth
  - [x] Return success response (prevents email enumeration)
  - [x] Add rate limiting for security (separate FORGOT_PASSWORD limit: 10 requests/hour)
  - [x] Configurable redirect URL

- [x] **Reset Password API** (`/app/api/auth/reset-password/route.ts`)
  - [x] Validate reset token (session-based)
  - [x] Validate new password strength
  - [x] Update password via Supabase Auth
  - [x] Return success response
  - [x] Add rate limiting for security

### Supabase Auth Setup (Replaces NextAuth)

- [x] Install and configure Supabase client
- [x] Create Supabase configuration file
- [x] Set up Supabase Auth integration
- [x] Create auth utilities (getServerUser, getServerSession, requireAuth)
- [x] Add middleware for protected routes
- [x] Create route configuration system

### Database & Utilities

- [x] Install bcrypt and @types/bcrypt (installed but using Supabase Auth)
- [x] Set up Supabase PostgreSQL database
- [x] Create database connection utilities
- [x] Test database connection
- [x] Update Prisma schema for Supabase Auth integration

### Components

- [x] Add shadcn/ui Input component
- [x] Add shadcn/ui Label component
- [ ] Add shadcn/ui Form component (optional)
- [ ] Create reusable form components

---

## 🧭 Dashboard (Week 2)

### Dashboard Page

- [x] **Main Dashboard** (`/app/dashboard/page.tsx`)
  - [x] Create basic dashboard page
  - [x] Add authentication check
  - [x] Add loading states
  - [x] Create dashboard layout with sidebar navigation
  - [x] Add header with user profile and logout
  - [x] Add stats cards (total mocks, requests, success rate)
  - [ ] Add recent activity section
  - [x] Add quick actions (Create Mock, Test API)
  - [x] Responsive design
  - [x] Add animations

### Sidebar Navigation

- [x] Create sidebar component
- [x] Add navigation items (Mocks, History, Profile)
- [x] Add active state indicators
- [x] Add collapse/expand functionality
- [x] Add user profile section in sidebar

### Layout Components

- [x] Create route protection system
- [x] Add middleware for protected routes
- [x] Add loading states
- [x] Create dashboard layout wrapper
- [ ] Add error boundaries

---

## 🧩 Mock API Management (Week 2)

### Mock API List Page

- [x] **Mocks List** (`/app/dashboard/mocks/page.tsx`)
  - [x] Display all user's mock APIs in a table/cards
  - [x] Add search functionality
  - [x] Add filter functionality (by method, status code)
  - [x] Add sort by date, name, method
  - [x] Add pagination
  - [x] Add empty state
  - [x] Add loading states

### Create Mock API

- [x] **Create Mock Modal/Page** (`/app/dashboard/mocks/new/page.tsx`)
  - [x] Create form for mock API creation
  - [x] Fields: Name, Endpoint, HTTP Method, Response Code, Response Body
  - [x] Add JSON editor for response body
  - [x] Add mock data generator button
  - [x] Add validation
  - [x] Add preview functionality

### Mock API CRUD API Routes

- [x] **GET /api/mocks** - Fetch all mocks for user
  - [x] Add authentication check
  - [x] Filter by userId
  - [x] Return paginated results
  - [x] Add error handling
  - [x] Auto-create user record if missing

- [x] **POST /api/mocks** - Create new mock
  - [x] Validate request body
  - [x] Check authentication
  - [x] Create mock in database
  - [x] Return created mock
  - [x] Handle duplicate endpoint/method
  - [x] Auto-create user record if missing

- [x] **GET /api/mocks/[id]** - Get mock by ID
  - [x] Validate user owns the mock
  - [x] Return mock data

- [x] **PUT /api/mocks/[id]** - Update mock
  - [x] Validate user owns the mock
  - [x] Update mock in database
  - [x] Return updated mock
  - [x] Handle duplicate endpoint/method checking

- [x] **DELETE /api/mocks/[id]** - Delete mock
  - [x] Validate user owns the mock
  - [x] Delete mock from database
  - [x] Return success response

- [x] **Edit Mock Page** (`/app/dashboard/mocks/[id]/edit/page.tsx`)
  - [x] Fetch existing mock data
  - [x] Pre-fill form with current values
  - [x] Update mock via PUT request
  - [x] Add validation and preview

- [x] **Delete functionality** (`/app/dashboard/mocks/page.tsx`)
  - [x] Add delete button to each mock card
  - [x] Add confirmation dialog
  - [x] Remove mock from list after deletion

- [x] **Mock API Execution** (`/app/api/[...path]/route.ts`)
  - [x] Create catch-all route handler for executing mock APIs
  - [x] Look up mock by endpoint and HTTP method
  - [x] Return configured response with correct status code
  - [x] Handle reserved routes (mocks, auth, test, history)
  - [x] Add error handling for mock not found
  - [x] Display mock URL in mocks list with copy button
  - [x] Add "Open in new tab" button for testing
  - [x] Add CORS support for all HTTP methods (GET, POST, PUT, PATCH, DELETE)
  - [x] Add OPTIONS handler for CORS preflight requests

### Mock Data Generator

- [x] Create mock data generator utility using Faker.js (`/lib/mock-generator.ts`)
- [x] Add UI for generating sample JSON
- [x] Add templates (User, Product, Post, Comment, Order, Custom)
- [ ] Add custom field generator

---

## 🏢 Organizations & Teams (New Feature)

### Database Schema

- [x] **Update Prisma Schema** (`/prisma/schema.prisma`)
  - [x] Create `Organization` model
    - [x] Fields: id, name, slug, description, visibility (private/public), ownerId, createdAt, updatedAt
    - [x] Add indexes for ownerId and slug
  - [x] Create `OrganizationMember` model
    - [x] Fields: id, organizationId, userId, role (owner/admin/member), createdAt
    - [x] Add unique constraint on (organizationId, userId)
    - [x] Add indexes for organizationId and userId
  - [x] Update `MockApi` model
    - [x] Add optional `organizationId` field
    - [x] Add relation to Organization
    - [x] Update indexes to include organizationId
  - [x] Run Prisma migrations (manual SQL migration applied to Supabase)

### Organization Management API Routes

- [x] **GET /api/organizations** - List user's organizations
  - [x] Return organizations where user is owner or member
  - [x] Include member count and role
  - [x] Add pagination
  - [x] Add search functionality (searches name, description, slug - case-insensitive)
  - [x] Filter by visibility (public/private)
  - [x] Support public organization discovery (`?public=true`)
  - [x] Combine search with visibility filter properly

- [x] **POST /api/organizations** - Create new organization
  - [x] Validate request body (name, description, visibility)
  - [x] Generate unique slug from name
  - [x] Create organization with creator as owner
  - [x] Create OrganizationMember record with owner role
  - [x] Return created organization

- [x] **GET /api/organizations/[id]** - Get organization details
  - [x] Check user has access (owner/member or public)
  - [x] Support both UUID and slug-based lookup
  - [x] Return organization with member list
  - [x] Include user's role in response
  - [x] Allow public organizations to be accessed without authentication

- [x] **PUT /api/organizations/[id]** - Update organization
  - [x] Validate user is owner or admin
  - [x] Support both UUID and slug-based lookup
  - [x] Update name, description, visibility
  - [x] Regenerate slug if name changed
  - [x] Return updated organization

- [x] **DELETE /api/organizations/[id]** - Delete organization
  - [x] Validate user is owner
  - [x] Support both UUID and slug-based lookup
  - [x] Delete all organization mocks (cascade)
  - [x] Delete all organization members
  - [x] Delete organization
  - [x] Return success response

### Member Management API Routes

- [x] **GET /api/organizations/[id]/members** - List organization members
  - [x] Check user has access
  - [x] Support both UUID and slug-based lookup
  - [x] Return members with roles
  - [x] Include member details (name, email)

- [x] **POST /api/organizations/[id]/members** - Add member to organization
  - [x] Validate user is owner or admin
  - [x] Support both UUID and slug-based lookup
  - [x] Validate member email exists
  - [x] Check member not already in organization
  - [x] Create OrganizationMember record
  - [ ] Send invitation notification (optional - future)
  - [x] Return created member record

- [x] **PUT /api/organizations/[id]/members/[memberId]** - Update member role
  - [x] Validate user is owner or admin
  - [x] Support both UUID and slug-based lookup
  - [x] Prevent changing owner role
  - [x] Update member role
  - [x] Return updated member

- [x] **DELETE /api/organizations/[id]/members/[memberId]** - Remove member
  - [x] Validate user is owner or admin
  - [x] Support both UUID and slug-based lookup
  - [x] Prevent removing owner
  - [x] Allow members to remove themselves
  - [x] Delete OrganizationMember record
  - [x] Return success response

### Organization Mock APIs

- [x] **Update GET /api/mocks** - Support organization filtering
  - [x] Add optional `organizationId` query parameter
  - [x] Add optional `personalOnly` query parameter
  - [x] Filter mocks by organization if provided
  - [x] Check user has access to organization
  - [x] Return both personal and organization mocks
  - [x] Exclude `responseBody` from list response for performance
  - [x] Include organization data in response

- [x] **Update POST /api/mocks** - Support creating mocks in organizations
  - [x] Add optional `organizationId` field
  - [x] Validate user has access (owner/member)
  - [x] Create mock with organizationId
  - [x] Return created mock with organization data
  - [x] Make `responseBody` optional (defaults to empty object)

- [x] **Update PUT /api/mocks/[id]** - Support organization in updates
  - [x] Include organization data in response
  - [x] Make `responseBody` optional for updates

- [x] **Update Mock API Execution** (`/app/api/[...path]/route.ts`)
  - [x] Look up mocks by endpoint, method, and organization
  - [x] Support organization-scoped endpoints (`/api/org/[slug]/[endpoint]`)
  - [x] Handle public organization mocks without authentication
  - [x] Check access for private organization mocks

### Organization UI Pages

- [x] **Organizations List Page** (`/app/dashboard/organizations/page.tsx`)
  - [x] Display user's organizations (owned and member)
  - [x] Show organization cards with name, description, member count
  - [x] Add "Create Organization" button
  - [x] Add search functionality (searches name, description, slug)
  - [x] Add search debouncing (500ms delay)
  - [x] Add visibility filter (public/private)
  - [x] Add role filter (owner/admin/member) - client-side
  - [x] Add active filter badges with remove functionality
  - [x] Add empty state
  - [x] Add loading states
  - [x] Use slug-based URLs for navigation
  - [x] Fix search API integration

- [x] **Create Organization Page** (`/app/dashboard/organizations/new/page.tsx`)
  - [x] Create form with name, description, visibility fields
  - [x] Add visibility toggle (Private/Public)
  - [x] Add validation
  - [x] Show preview of organization settings
  - [x] Redirect to organization page on success (using slug)

- [x] **Organization Detail Page** (`/app/dashboard/organizations/[id]/page.tsx`)
  - [x] Display organization information
  - [x] Support slug-based URLs
  - [x] Show organization settings link (owner/admin only)
  - [x] Display organization mocks list
  - [x] Show member list with roles
  - [x] Add "Create Mock" button (scoped to organization)
  - [x] Add "Manage Members" section (owner/admin only)
  - [x] Add "Leave Organization" button (members only)
  - [x] Add "Delete Organization" button (owner only)
  - [x] Improved layout and empty states

- [x] **Organization Settings Page** (`/app/dashboard/organizations/[id]/settings/page.tsx`)
  - [x] Support slug-based URLs
  - [x] Tabbed interface (General, Members, Danger Zone)
  - [x] Statistics overview cards (Members, Mocks, Visibility)
  - [x] Edit organization name and description
  - [x] Organization slug display with copy button
  - [x] Organization URL display with copy button
  - [x] Toggle visibility (private/public) with descriptions
  - [x] Unsaved changes indicator
  - [x] Manage members (add, remove, change roles)
  - [x] Member search functionality
  - [x] Member avatars with initials
  - [x] Enhanced empty states
  - [x] Delete organization (owner only)
  - [ ] Transfer ownership (owner only - future)

### Organization Components

- [ ] **OrganizationCard Component** (`/components/organizations/OrganizationCard.tsx`)
  - [ ] Display organization info
  - [ ] Show member count and visibility badge
  - [ ] Add hover effects
  - [ ] Link to organization detail page

- [ ] **OrganizationSelector Component** (`/components/organizations/OrganizationSelector.tsx`)
  - [ ] Dropdown to select organization when creating mock
  - [ ] Show "Personal" and organization options
  - [ ] Display organization name and member count

- [ ] **MemberList Component** (`/components/organizations/MemberList.tsx`)
  - [ ] Display organization members
  - [ ] Show member name, email, role
  - [ ] Add role badges (Owner, Admin, Member)
  - [ ] Add action buttons (edit role, remove) for owners/admins

- [ ] **InviteMemberDialog Component** (`/components/organizations/InviteMemberDialog.tsx`)
  - [ ] Form to invite member by email
  - [ ] Validate email exists in system
  - [ ] Select role (Admin/Member)
  - [ ] Show success/error messages

### Access Control & Permissions

- [x] **Create Organization Access Utilities** (`/lib/organization-auth.ts`)
  - [x] `checkOrganizationAccess(userId, organizationId)` - Check if user can access
  - [x] `checkOrganizationPermission(userId, organizationId, role)` - Check specific role
  - [x] `getUserOrganizationRole(userId, organizationId)` - Get user's role
  - [x] `canEditOrganization(userId, organizationId)` - Check edit permission
  - [x] `canManageMembers(userId, organizationId)` - Check member management permission
  - [x] `canCreateMockInOrganization(userId, organizationId)` - Check mock creation permission
  - [x] `generateUniqueSlug(name)` - Generate unique organization slug

- [x] **Update Mock API Access Control**
  - [x] Check organization access when fetching mocks
  - [x] Validate organization membership when creating/editing mocks
  - [x] Allow public organization mocks to be accessible without auth (API ready)

- [x] **Update API Routes with Organization Checks**
  - [x] Add organization access checks to all organization routes
  - [x] Return appropriate error messages for unauthorized access
  - [x] Support optional authentication for public organizations
  - [ ] Log access attempts for security (future)

### Navigation & Sidebar Updates

- [x] **Update Dashboard Sidebar** (`/components/app-sidebar.tsx`)
  - [x] Add "Organizations" menu item
  - [ ] Show organization count badge (future)
  - [ ] Add submenu for user's organizations (future)
  - [ ] Highlight active organization (future)

- [x] **Update Mocks Page** (`/app/dashboard/mocks/page.tsx`)
  - [x] Add organization filter dropdown
  - [x] Show organization name on mock cards
  - [x] Filter mocks by selected organization (including "Personal" option)
  - [x] Update "Create Mock" to support organization selection

### Public Organization Sharing

- [x] **Public Organization API Support**
  - [x] Allow public organizations to be accessed without authentication
  - [x] Update GET /api/organizations/[id] to support optional auth
  - [x] Update GET /api/organizations to support public discovery (`?public=true`)
  - [x] Create `withOptionalAuth` and `withOptionalAuthParams` wrappers
  - [ ] Public Organization Page (`/app/organizations/[slug]/page.tsx`) - future
    - [ ] Display public organization information
    - [ ] Show public mocks list
    - [ ] Allow viewing mock details
    - [ ] Add "Join Organization" button (if not member)
    - [ ] Show member count (if public)

- [x] **Organization Slug-Based URLs**
  - [x] Support slug-based URLs for all organization routes
  - [x] API routes support both UUID and slug lookup
  - [x] All UI components use slug-based navigation
  - [x] Backward compatible with UUID-based URLs

- [x] **Public Mock API Access**
  - [x] Allow public organization mocks to be accessed without auth
  - [x] Update mock API execution to check organization visibility
  - [x] Support organization-scoped URLs (`/api/org/[slug]/[endpoint]`)

### Integration & Migration

- [x] **Data Migration**
  - [x] Manual SQL migration applied to Supabase
  - [x] Existing mocks remain as personal (no organizationId)
  - [x] Backward compatibility maintained

- [x] **Update Existing Components**
  - [x] Update MockCard to show organization name
  - [x] Update Create Mock form to support organization selection
  - [x] Update mocks list to filter by organization

### Testing

- [ ] **Test Organization CRUD Operations**
  - [ ] Test creating organization
  - [ ] Test updating organization
  - [ ] Test deleting organization
  - [ ] Test member management

- [ ] **Test Access Control**
  - [ ] Test owner permissions
  - [ ] Test admin permissions
  - [ ] Test member permissions
  - [ ] Test public organization access

- [ ] **Test Mock API Integration**
  - [ ] Test creating mocks in organizations
  - [ ] Test accessing organization mocks
  - [ ] Test public organization mock execution

---

## 🧪 API Testing Playground (Week 3)

### API Tester Page

- [x] **API Tester** (`/app/dashboard/test/page.tsx`)
  - [x] Create request builder UI
  - [x] Add HTTP method selector (GET, POST, PUT, DELETE, HEAD, OPTIONS)
  - [x] Add URL input field
  - [x] Add headers editor (key-value pairs)
  - [x] Add query parameters editor
  - [x] Add request body editor (JSON)
  - [x] Add "Send Request" button
  - [x] Add loading states

### Response Display

- [x] Display response status code
- [x] Display response headers
- [x] Display response body (formatted JSON)
- [x] Display response time
- [x] Add syntax highlighting for JSON
- [x] Add copy to clipboard functionality
- [ ] Add download response option

### API Test Route

- [x] **POST /api/test** - Send API request
  - [x] Validate request body (url, method, headers, body)
  - [x] Make HTTP request using axios
  - [x] Capture response time
  - [x] Save to request history
  - [x] Return response data
  - [x] Handle errors gracefully

### Request History Integration

- [x] Automatically save each test to history
- [x] Add "Save to History" toggle
- [x] Add "Load from History" functionality

---

## 📜 Request History (Week 4)

### History Page

- [x] **History Page** (`/app/dashboard/history/page.tsx`)
  - [x] Display all request history in a table
  - [x] Add filters (by status, method)
  - [x] Add search functionality
  - [x] Add pagination
  - [x] Add sorting options
  - [x] Add empty state
  - [x] Add loading states

### History API Route

- [x] **GET /api/history** - Fetch request history
  - [x] Add authentication check
  - [x] Filter by userId
  - [x] Add pagination
  - [x] Add filtering and sorting
  - [x] Return paginated results
  - [x] Auto-create user record if missing

### History Features

- [x] Add "Retry Request" functionality
- [x] Add "View Details" modal
- [x] Add "Delete" functionality
- [x] Add export to JSON/CSV
- [x] Add statistics (success rate, avg response time)
- [x] Add date range filter

### Charts & Analytics

- [x] Add statistics cards (Total, Success Rate, Avg Response Time, Errors)
- [x] Add Recharts integration
- [x] Create response time chart
- [x] Create status code distribution chart
- [x] Create request volume over time chart

---

## ⚙️ Profile & Settings (Week 4)

### Profile Page

- [x] **Profile Page** (`/app/dashboard/profile/page.tsx`)
  - [x] Display user information
  - [x] Add edit profile form
  - [x] Add change password form
  - [ ] Add avatar upload (future)
  - [x] Add account deletion option

### Profile API Routes

- [x] **GET /api/user/profile** - Get user profile
- [x] **PUT /api/user/profile** - Update user profile
- [x] **PUT /api/user/password** - Change password
- [x] **DELETE /api/user/account** - Delete account

---

## 🎨 UI/UX Enhancements

### Components

- [x] Add shadcn/ui Dialog component
- [x] Add shadcn/ui Dropdown Menu component
- [x] Add shadcn/ui Select component
- [x] Add shadcn/ui Tabs component
- [x] Add shadcn/ui Toast component (Sonner)
- [x] Add shadcn/ui Table component
- [x] Add shadcn/ui Badge component
- [x] Add shadcn/ui Skeleton component (for loading states)

### Toast Notifications

- [x] Add Toaster to root layout
- [x] Replace all alert() calls with toast notifications
- [x] Use toast.success() for success messages
- [x] Use toast.error() for error messages

### Dashboard Improvements

- [x] Create GET /api/dashboard/stats endpoint
- [x] Fetch real dashboard statistics
- [x] Add loading skeletons for stats cards
- [x] Dynamic descriptions based on actual data

### Button Variants

- [x] Add success variant (green) for positive actions
- [x] Add warning variant (orange) for cautionary actions
- [x] Add info variant (blue) for informational actions
- [x] Add gradient variant for primary CTAs
- [x] Update all buttons throughout app to use appropriate variants
- [x] Use gradient for primary CTAs (Create, Get Started)
- [x] Use success for save/update/create actions
- [x] Use info for test/retry actions
- [x] Use outline for secondary actions
- [x] Use secondary for helper actions (Add, Generate)
- [x] Use ghost for subtle actions (icons)

### Dark Mode

- [x] Add dark mode toggle
  - [x] Create ThemeToggle component with system/light/dark options
  - [x] Add theme toggle button to UI
- [x] Implement theme persistence
  - [x] Integrate next-themes for theme management
  - [x] Add ThemeProvider to root layout
  - [x] Support system theme preference
  - [x] Persist theme selection in localStorage
- [x] Test all components in dark mode
  - [x] Configure dark mode CSS variables
  - [x] Ensure all components support dark theme

### Animations

- [x] Add page transition animations
  - [x] Component-level animations with Framer Motion
  - [x] Fade-in and slide-up animations on page load
  - [x] Stagger animations for lists and cards
- [x] Add loading skeleton animations
  - [x] Skeleton component with animate-pulse
  - [x] Loading states for dashboard stats and data
- [x] Add micro-interactions throughout
  - [x] Hover effects on buttons and cards
  - [x] Scale transforms on interactive elements
  - [x] whileHover and whileTap animations
  - [x] Smooth transitions on theme toggle
- [x] Optimize animation performance
  - [x] Use Framer Motion for performant animations
  - [x] Implement stagger delays for list animations
  - [x] Use CSS transitions where appropriate

### Responsive Design

- [ ] Test on mobile devices
- [ ] Test on tablets
- [ ] Test on desktop
- [ ] Fix responsive issues

### Code Quality

- [x] Add Prettier for code formatting
- [x] Create Prettier configuration (.prettierrc)
- [x] Create Prettier ignore file (.prettierignore)
- [x] Add format scripts to package.json

---

## 🔧 Backend & Infrastructure

### Database

- [x] Set up PostgreSQL database (Supabase/Neon)
- [x] Integrate Supabase with Prisma
- [x] Configure connection pooling
- [ ] Run Prisma migrations (pending DATABASE_URL setup)
- [ ] Set up database indexes
- [ ] Test database performance
- [ ] Set up database backups

### Environment Variables

- [x] Create environment variable documentation (ENV_SETUP.md)
- [x] Document all required environment variables
- [x] Create Supabase setup guide (SUPABASE_SETUP.md)
- [x] Create `.env.example` file (template for environment variables)
- [x] Set up environment variable validation (`lib/env-validation.ts`)

### Error Handling

- [x] Create global error handler
- [x] Add error logging
- [x] Create custom error types
- [x] Add error boundaries in React

### API Documentation

- [x] Document all API endpoints
  - [x] Created comprehensive API_DOCUMENTATION.md
  - [x] Documented all endpoints with methods, authentication, rate limits
- [x] Add request/response examples
  - [x] Request examples for all endpoints
  - [x] Response examples with status codes
  - [x] Error response examples
- [ ] Create API testing collection (Postman/Insomnia) - Optional

### Security

- [x] Add rate limiting
  - [x] In-memory rate limiting system
  - [x] Different limits for AUTH, API, MOCK_API, API_TEST endpoints
  - [x] Separate FORGOT_PASSWORD rate limit (10 requests/hour)
  - [x] Rate limit headers in responses
  - [x] User ID and IP-based rate limiting
- [x] Add CORS configuration
  - [x] Add CORS headers to mock API responses
  - [x] Add OPTIONS handler for preflight requests
  - [x] Enable cross-origin requests for API testing
- [x] Add input sanitization
  - [x] String sanitization (XSS prevention)
  - [x] URL sanitization
  - [x] JSON sanitization (prototype pollution prevention)
  - [x] Email sanitization
  - [x] Endpoint sanitization (path traversal prevention)
  - [x] SQL input sanitization
- [x] Add SQL injection prevention
  - [x] Prisma ORM (parameterized queries)
  - [x] Input sanitization for SQL-like patterns
  - [x] Input validation with Yup schemas
- [x] Add XSS protection
  - [x] String sanitization utilities
  - [x] HTML entity encoding
  - [x] Input validation
- [ ] Add CSRF protection (future enhancement - Next.js has built-in CSRF protection)

---

## 🧪 Testing

### Unit Tests

- [x] Write tests for API routes (133 tests - Auth: 30, Mocks: 27, Organizations: 52, History: 24)
- [x] Write tests for utilities (187 tests - All utility functions covered)
- [x] Write tests for components (74 tests - Shared components covered)
- [x] Set up Jest and React Testing Library

### Integration Tests

- [x] Test authentication flow (2 tests - Signup → Login → Me → Logout)
- [x] Test mock API CRUD operations (2 tests - Full CRUD flow)
- [ ] Test API testing playground
- [ ] Test request history

### E2E Tests

- [ ] Set up Playwright or Cypress
- [ ] Write E2E tests for critical flows
- [ ] Test user registration and login
- [ ] Test mock API creation and testing

---

## 🚀 Deployment

### Vercel Setup

- [ ] Connect GitHub repository
- [ ] Configure build settings
- [ ] Set up environment variables
- [ ] Configure custom domain (optional)

### Database Setup

- [x] Set up production database (Supabase with connection pooling)
- [x] Run migrations on production (GitHub Actions workflow + migration script)
- [x] Set up database connection pooling (configured in Prisma)
- [x] Add production migration scripts (`db:migrate:deploy`, `scripts/migrate-production.sh`)

### CI/CD

- [x] Set up GitHub Actions (`.github/workflows/ci-cd.yml`)
- [x] Add automated tests (runs on every push/PR)
- [x] Add automated deployment (deploys to Vercel on main branch)
- [x] Add deployment notifications (workflow status notifications)
- [x] Add database migration workflow (`.github/workflows/database-migration.yml`)
- [x] Create deployment documentation (`docs/DEPLOYMENT.md`)

### Monitoring

- [ ] Set up error tracking (Sentry)
- [ ] Set up analytics (Vercel Analytics)
- [ ] Set up uptime monitoring
- [ ] Set up performance monitoring

---

## 📚 Documentation

### README

- [ ] Update README with setup instructions
- [ ] Add screenshots
- [ ] Add feature list
- [ ] Add tech stack details

### API Documentation

- [ ] Document all API endpoints
- [ ] Add request/response schemas
- [ ] Add authentication requirements

### User Guide

- [ ] Create user guide
- [ ] Add video tutorials (optional)
- [ ] Add FAQ section

---

## 📘 Swagger/OpenAPI Documentation for Organizations

### Organization API Documentation

- [x] **Swagger/OpenAPI Export for Organizations**
  - [x] Create API endpoint to generate OpenAPI spec for organization mocks
  - [x] **GET /api/organizations/[id]/openapi** - Generate OpenAPI 3.0 spec
    - [x] Aggregate all mocks in organization
    - [x] Generate paths, methods, responses from mock APIs
    - [x] Include response schemas from mock responseBody
    - [x] Add organization metadata (name, description)
    - [x] Support both JSON and YAML formats
    - [x] Use organization-scoped paths (/api/org/[slug]/[endpoint])
  - [x] Add "View API Docs" button on organization page
  - [x] Add "Download OpenAPI Spec" button (JSON and YAML)
  - [x] Create shareable public URL for organization API docs
  - [x] Support Swagger UI rendering

- [x] **Public API Documentation Page**
  - [x] **GET /app/organizations/[slug]/docs/page.tsx** - Public API docs page
    - [x] Display organization API documentation
    - [x] Render Swagger UI with organization's mocks
    - [x] Show all endpoints, methods, and responses
    - [x] Allow testing endpoints directly from docs
    - [x] Add "Try it out" functionality
    - [x] Support for public organizations (and authenticated access for private)
  - [x] Add copy button for API documentation URL
  - [x] Add share functionality
  - [x] Dark mode support with proper text colors
  - [ ] Add embed option for documentation (future enhancement)

- [x] **Swagger/OpenAPI Import**
  - [x] **POST /api/organizations/[id]/import-openapi** - Import OpenAPI spec
    - [x] Parse OpenAPI/Swagger JSON or YAML
    - [x] Extract paths, methods, responses
    - [x] Create mock APIs from OpenAPI spec
    - [x] Map OpenAPI responses to mock responseBody
    - [x] Support OpenAPI 3.0 (Swagger 2.0 support planned)
    - [x] Handle validation errors gracefully
  - [x] Add "Import from OpenAPI" button on organization page
  - [x] Create import modal with file upload
  - [x] Show preview of mocks to be created
  - [x] Allow selective import (choose which endpoints to import)
  - [x] Show import progress and results

- [x] **OpenAPI Utilities** (`/lib/openapi-utils.ts`)
  - [x] `generateOpenApiSpec(organization, mocks, baseUrl, useOrganizationScopedPaths)` - Generate OpenAPI spec
  - [x] `parseOpenApiSpec(fileContent, fileType)` - Parse OpenAPI/Swagger file
  - [x] `extractMocksFromOpenApi(spec)` - Extract mocks from spec
  - [x] `validateOpenApiSpec(spec)` - Validate OpenAPI spec format
  - [x] `specToJson(spec)` - Convert spec to JSON
  - [x] `specToYaml(spec)` - Convert spec to YAML
  - [x] Support for OpenAPI 3.0 (Swagger 2.0 support planned)
  - [x] ES6 arrow function format

- [x] **UI Components**
  - [x] **Public API Docs Page** (`/app/organizations/[slug]/docs/page.tsx`)
    - [x] Display Swagger UI for organization APIs
    - [x] Support dark mode with proper text colors
    - [x] Add copy/share functionality
  - [x] **ImportOpenApiModal** (`/components/organizations/ImportOpenApiModal.tsx`)
    - [x] File upload for OpenAPI spec
    - [x] Preview of mocks to be created
    - [x] Select endpoints to import
    - [x] Show import progress and results

- [x] **Dependencies**
  - [x] Install `swagger-parser` for parsing OpenAPI specs
  - [x] Install `swagger-ui-react` for documentation rendering
  - [x] Install `yaml` for YAML parsing
  - [x] Install `openapi-types` for TypeScript types

---

## 🎯 Future Enhancements (Optional)

### Advanced Features

- [ ] Public sharing of individual mocks (beyond organizations)
- [ ] Team collaboration & shared collections
- [ ] AI-assisted mock response generation (OpenAI)
- [x] Rate limiting and request analytics (completed)
- [x] Swagger schema import/export (in progress - see above)
- [ ] Chrome extension for quick testing
- [ ] WebSocket support for live API responses
- [ ] Custom domain mapping for premium users

### Performance

- [ ] Add caching layer
- [ ] Optimize database queries
- [ ] Add CDN for static assets
- [ ] Implement lazy loading

---

## 📝 Notes

- Tasks are organized by week based on the development roadmap
- Mark tasks as complete by changing `[ ]` to `[x]`
- Add notes or blockers in the Notes section below
- Update this file as the project progresses

### Current Status

- **Week 1**: ✅ Completed (Landing page, Auth system with Supabase)
- **Week 2**: ✅ Completed (Dashboard ✅, Mock API Management - Full CRUD ✅)
- **Week 3**: ✅ Completed (API Testing Playground ✅)
- **Week 4**: ✅ Completed (Request History ✅, Profile & Settings ✅)
- **UI/UX Enhancements**: ✅ Completed (Toast notifications, Dashboard improvements, Button variants, Dropdown menus, Export functionality, Charts & Analytics, Prettier setup)
- **Mocks List**: ✅ Completed (Filters, sorting, pagination, search)

### Blockers

- None currently

### Next Priority

1. ✅ Complete dashboard layout with sidebar navigation
2. ✅ Mock API Management - Full CRUD (Create, Read, Update, Delete)
3. ✅ Mock API Execution - Users can now call their created mocks
4. ✅ API Testing Playground
5. ✅ Request History Page (Basic features complete)
6. ✅ **Enhance History Page** - COMPLETED
   - ✅ Add "View Details" modal (show full request/response)
   - ✅ Add "Delete" functionality
   - ✅ Add statistics (success rate, avg response time)
   - ✅ Add date range filter
7. ✅ **Profile & Settings Page** - COMPLETED
   - ✅ Display user information
   - ✅ Add edit profile form
   - ✅ Add change password form
   - ✅ Add account deletion option
8. ✅ **Improve Mocks List** - COMPLETED
   - ✅ Add filter functionality (by method, status code)
   - ✅ Add sort by date, name, method
   - ✅ Add pagination with page navigation
   - ✅ Add search with debouncing
9. ✅ **Export Functionality** - COMPLETED
   - ✅ Export history to JSON/CSV
   - ✅ Export mocks to JSON
   - ✅ Create export utility functions
10. ✅ **Charts & Analytics** - COMPLETED
    - ✅ Add Recharts integration
    - ✅ Create response time chart
    - ✅ Create status code distribution chart
    - ✅ Create request volume over time chart
    - ✅ Add chart data API endpoint
11. ✅ **Code Quality** - COMPLETED
    - ✅ Add Prettier for code formatting
    - ✅ Configure Prettier with project settings
12. ✅ **CORS Support** - COMPLETED
    - ✅ Add CORS headers to mock API responses
    - ✅ Add OPTIONS handler for preflight requests
    - ✅ Enable POST, PUT, PATCH, DELETE requests from external clients
13. ✅ **Dark Mode** - COMPLETED
    - ✅ Add dark mode toggle with system/light/dark options
    - ✅ Implement theme persistence with next-themes
    - ✅ Configure dark mode CSS variables
    - ✅ Ensure all components support dark theme
14. ✅ **Animations** - COMPLETED
    - ✅ Component-level animations with Framer Motion
    - ✅ Loading skeleton animations
    - ✅ Micro-interactions throughout the app
    - ✅ Performance-optimized animations
15. ✅ **Organizations & Teams** - MOSTLY COMPLETED
    - ✅ Database schema updates (Organization, OrganizationMember models)
    - ✅ Organization CRUD API routes (with slug support)
    - ✅ Member management API routes (with slug support)
    - ✅ Organization UI pages and components
    - ✅ Access control and permissions system
    - ✅ Integration with existing mock API system
    - ✅ Public organization sharing (API support)
    - ✅ Organization slug-based URLs
    - ✅ Enhanced organization settings page with tabs and statistics
    - ✅ Organization filter on mocks page
    - ✅ Organization name display on mock cards
    - ✅ Organization list page search and filters (search, visibility, role)
    - ✅ Search API integration with debouncing
    - [x] Organization-scoped mock API execution (completed)
16. ✅ **Forgot Password Feature** - COMPLETED
    - ✅ Forgot Password API endpoint
    - ✅ Reset Password API endpoint
    - ✅ Forgot Password page
    - ✅ Reset Password page
    - ✅ Add "Forgot Password" link to login page
    - ✅ Separate rate limiting for forgot password (10 requests/hour)
    - ✅ ES6 arrow function format
    - ✅ Supabase Auth integration with token validation
17. ✅ **Swagger/OpenAPI Documentation for Organizations** - COMPLETED
    - ✅ Generate OpenAPI spec from organization mocks
    - ✅ Public API documentation page for organizations
    - ✅ Import OpenAPI spec to create mocks
    - ✅ Swagger UI integration with dark mode support
    - ✅ Shareable API documentation URLs
    - ✅ Organization-scoped API paths (/api/org/[slug]/[endpoint])
    - ✅ Download OpenAPI specs in JSON/YAML formats
    - ✅ Selective import with preview functionality
