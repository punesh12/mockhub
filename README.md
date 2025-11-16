# MockHub - 🧩 API Mock & Test Dashboard

A modern, developer-focused **SaaS dashboard** to **create, mock, and test APIs** — all in one place.  
Think of it as a lightweight, beautiful alternative to Postman + Mock Server, built with **Next.js 16**, **TypeScript**, and **Supabase**.

![MockHub](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)
![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-green?style=for-the-badge&logo=supabase)

## ✨ Features

### 🎯 Core Features
- **Mock API Management** - Create, edit, and delete mock APIs with custom endpoints, methods, and response codes
- **API Testing Playground** - Test any API endpoint directly from the dashboard with support for all HTTP methods
- **Request History** - Track and analyze all API requests with detailed request/response logs
- **Organizations & Teams** - Collaborate with your team by creating organizations and sharing mock APIs
- **Public/Private Organizations** - Control visibility of your organization's mocks
- **Role-Based Access Control** - Owner, Admin, and Member roles with granular permissions
- **Organization-Scoped APIs** - Create mock APIs within organizations with slug-based URLs (`/api/org/[slug]/[endpoint]`)

### 📊 Analytics & Insights
- **Dashboard Statistics** - View total mocks, success rate, average response time, and error count
- **Interactive Charts** - Request volume over time, response time trends, and status code distribution
- **Request History Analytics** - Filter by date range, method, status code, and endpoint
- **Export Functionality** - Export mocks and history to JSON/CSV formats

### 🎨 User Experience
- **Modern UI** - Built with shadcn/ui and Tailwind CSS
- **Dark Mode** - Full dark mode support with system preference detection
- **Responsive Design** - Works seamlessly on desktop, tablet, and mobile devices
- **Smooth Animations** - Powered by Framer Motion for delightful interactions
- **Real-time Feedback** - Toast notifications for all user actions

### 🔐 Security & Authentication
- **Supabase Authentication** - Secure user authentication with email/password
- **Session Management** - JWT-based session handling with secure cookies
- **Access Control** - Organization-level permissions and private/public visibility
- **CORS Support** - Full CORS support for cross-origin API testing

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18+ (recommended: 20+)
- **PostgreSQL Database** (via Supabase)
- **npm** or **yarn** package manager

### Installation

1. **Clone the repository:**

```bash
git clone <your-repo-url>
cd mockhub-1
```

2. **Install dependencies:**

```bash
npm install
# or
yarn install
```

3. **Set up Supabase:**

   - Create a Supabase account at [supabase.com](https://supabase.com)
   - Create a new project
   - Get your database connection strings from **Settings** → **Database**
   - See [docs/SUPABASE_SETUP.md](./docs/SUPABASE_SETUP.md) for detailed instructions

4. **Set up environment variables:**

   Create a `.env.local` file in the root directory:

```bash
cp .env.example .env.local  # If .env.example exists
# Or create manually
touch .env.local
```

Add the following environment variables:

```env
# Database Connection (Required)
# Get from Supabase Dashboard → Settings → Database → Connection string
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"

# JWT Secret (Required)
# Generate with: openssl rand -base64 32
JWT_SECRET="your-secret-key-change-in-production"

# Supabase Configuration (Optional - for future features)
NEXT_PUBLIC_SUPABASE_URL="https://[PROJECT-REF].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key-here"
```

**Note**: For production (Vercel/serverless), use the connection pooling URL (port 6543) instead of direct connection. See [docs/SUPABASE_SETUP.md](./docs/SUPABASE_SETUP.md) for details.

5. **Set up the database:**

```bash
# Generate Prisma Client
npm run db:generate

# Push schema to database
npm run db:push

# Or run migrations
npm run db:migrate
```

**Note**: If you're using Supabase, you may need to manually run the SQL migrations. See [docs/SUPABASE_TABLE_SETUP.md](./docs/SUPABASE_TABLE_SETUP.md) for instructions.

6. **Run the development server:**

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🧰 Tech Stack

### Frontend
- **Next.js 16** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui** - High-quality React components
- **Framer Motion** - Animation library
- **Recharts** - Chart library for analytics
- **next-themes** - Dark mode support

### Backend
- **Next.js API Routes** - Serverless API endpoints
- **Prisma** - Type-safe database ORM
- **Supabase** - PostgreSQL database and authentication
- **JWT** - Token-based authentication

### State Management & Utilities
- **TanStack Query** - Data fetching and caching
- **Zustand** - Lightweight state management
- **React Hook Form** - Form management
- **Zod** - Schema validation
- **Axios** - HTTP client

## 📁 Project Structure

```
mockhub-1/
├── app/                          # Next.js App Router
│   ├── api/                     # API routes
│   │   ├── auth/               # Authentication endpoints
│   │   │   ├── login/          # POST /api/auth/login
│   │   │   ├── signup/         # POST /api/auth/signup
│   │   │   ├── logout/         # POST /api/auth/logout
│   │   │   └── me/             # GET /api/auth/me
│   │   ├── mocks/              # Mock API CRUD
│   │   │   ├── route.ts        # GET, POST /api/mocks
│   │   │   └── [id]/           # GET, PUT, DELETE /api/mocks/:id
│   │   ├── organizations/      # Organization management
│   │   │   ├── route.ts        # GET, POST /api/organizations
│   │   │   └── [id]/           # GET, PUT, DELETE /api/organizations/:id
│   │   ├── test/               # API testing endpoint
│   │   ├── history/            # Request history
│   │   └── [...path]/          # Catch-all for mock API execution
│   ├── auth/                   # Auth pages
│   │   ├── login/              # Login page
│   │   └── signup/             # Signup page
│   ├── dashboard/              # Dashboard pages
│   │   ├── page.tsx            # Main dashboard
│   │   ├── mocks/              # Mock API management
│   │   ├── test/               # API testing playground
│   │   ├── history/            # Request history
│   │   ├── organizations/      # Organization management
│   │   └── profile/            # User profile
│   └── layout.tsx              # Root layout
├── components/                  # React components
│   ├── ui/                     # shadcn/ui components
│   ├── shared/                 # Shared components
│   │   └── components/         # Reusable components
│   │       ├── Modal.tsx       # Reusable modal component
│   │       ├── ConfirmationModal.tsx
│   │       ├── MockCard.tsx
│   │       └── ...
│   └── organizations/          # Organization-specific components
├── lib/                         # Utilities and helpers
│   ├── prisma.ts               # Prisma Client instance
│   ├── supabase.ts             # Supabase client
│   ├── supabase-auth.ts        # Authentication utilities
│   ├── api-auth.ts             # API authentication wrappers
│   ├── organization-auth.ts    # Organization access control
│   └── utils.ts                # General utilities
├── prisma/                      # Prisma configuration
│   └── schema.prisma           # Database schema
└── docs/                        # Documentation
    ├── ENV_SETUP.md            # Environment variables guide
    ├── SUPABASE_SETUP.md       # Supabase setup guide
    ├── ROUTES.md               # Routes documentation
    └── TASKS.md                # Development tasks
```

## 📡 API Endpoints

### Authentication

| Method | Endpoint              | Description                    | Auth |
|--------|----------------------|--------------------------------|------|
| `POST` | `/api/auth/signup`   | Register a new user             | ❌   |
| `POST` | `/api/auth/login`    | Authenticate user               | ❌   |
| `POST` | `/api/auth/logout`   | Logout user                     | ✅   |
| `GET`  | `/api/auth/me`       | Get current user                | ✅   |

### Mock APIs

| Method   | Endpoint              | Description                      | Auth |
|----------|----------------------|----------------------------------|------|
| `GET`    | `/api/mocks`         | Fetch all mocks for user         | ✅   |
| `POST`   | `/api/mocks`         | Create new mock                  | ✅   |
| `GET`    | `/api/mocks/:id`     | Get mock by ID                   | ✅   |
| `PUT`    | `/api/mocks/:id`     | Update mock                      | ✅   |
| `DELETE` | `/api/mocks/:id`     | Delete mock                      | ✅   |
| `*`      | `/api/[endpoint]`    | Execute mock API                 | ⚠️   |
| `*`      | `/api/org/[slug]/[endpoint]` | Execute org-scoped mock | ⚠️   |

### Organizations

| Method   | Endpoint                                    | Description                    | Auth |
|----------|--------------------------------------------|--------------------------------|------|
| `GET`    | `/api/organizations`                       | List organizations              | ✅   |
| `POST`   | `/api/organizations`                       | Create organization            | ✅   |
| `GET`    | `/api/organizations/:id`                   | Get organization details        | ⚠️   |
| `PUT`    | `/api/organizations/:id`                   | Update organization             | ✅   |
| `DELETE` | `/api/organizations/:id`                   | Delete organization            | ✅   |
| `GET`    | `/api/organizations/:id/members`           | List members                   | ✅   |
| `POST`   | `/api/organizations/:id/members`           | Add member                     | ✅   |
| `PUT`    | `/api/organizations/:id/members/:memberId` | Update member role             | ✅   |
| `DELETE` | `/api/organizations/:id/members/:memberId` | Remove member                 | ✅   |

### Request History

| Method   | Endpoint            | Description              | Auth |
|----------|---------------------|--------------------------|------|
| `GET`    | `/api/history`      | Fetch request history    | ✅   |
| `DELETE` | `/api/history/:id`  | Delete history item      | ✅   |
| `GET`    | `/api/history/charts` | Get chart data        | ✅   |

### Testing

| Method | Endpoint      | Description                    | Auth |
|--------|---------------|--------------------------------|------|
| `POST` | `/api/test`   | Send API request and get response | ✅   |

**Legend:**
- ✅ Requires authentication
- ❌ Public endpoint
- ⚠️ Optional authentication (public orgs)

## 🛠️ Available Scripts

| Script              | Description                          |
|---------------------|--------------------------------------|
| `npm run dev`       | Start development server             |
| `npm run build`     | Build for production                 |
| `npm run start`     | Start production server               |
| `npm run lint`      | Run ESLint                           |
| `npm run format`    | Format code with Prettier             |
| `npm run format:check` | Check code formatting             |
| `npm run db:generate` | Generate Prisma Client             |
| `npm run db:push`   | Push schema to database               |
| `npm run db:migrate` | Run database migrations              |
| `npm run db:studio` | Open Prisma Studio                   |

## 🎨 UI Components

This project uses [shadcn/ui](https://ui.shadcn.com/) for UI components. To add new components:

```bash
npx shadcn@latest add [component-name]
```

### Custom Components

- **Modal** - Reusable modal component with theme support
- **ConfirmationModal** - Confirmation dialogs for destructive actions
- **MockCard** - Display mock API cards with actions
- **StatCard** - Statistics cards for dashboard
- **FilterBadge** - Active filter badges
- **SearchBar** - Search input with debouncing
- **Pagination** - Pagination component

## 🔗 Supabase Integration

This project is integrated with Supabase for:

- ✅ **PostgreSQL Database** - Managed PostgreSQL via Prisma
- ✅ **Connection Pooling** - Serverless-optimized connection pooling
- ✅ **Authentication** - User authentication and session management
- 🔜 **Future**: Storage, Realtime, Edge Functions

For detailed Supabase setup instructions, see [docs/SUPABASE_SETUP.md](./docs/SUPABASE_SETUP.md).

## 🗄️ Database Schema

The project uses Prisma with Supabase (PostgreSQL). Key models:

- **User** - User accounts with authentication
- **MockApi** - Created mock endpoints (can be associated with organizations)
- **RequestHistory** - API request/response history
- **Organization** - Team organizations with visibility settings
- **OrganizationMember** - Organization membership with roles

See `prisma/schema.prisma` for the complete schema definition.

## 🚦 Routes

### Public Routes
- `/` - Landing page
- `/auth/login` - Login page
- `/auth/signup` - Signup page

### Private Routes (Require Authentication)
- `/dashboard` - Main dashboard
- `/dashboard/mocks` - Mock APIs list
- `/dashboard/mocks/new` - Create new mock
- `/dashboard/mocks/:id/edit` - Edit mock
- `/dashboard/test` - API testing playground
- `/dashboard/history` - Request history
- `/dashboard/organizations` - Organizations list
- `/dashboard/organizations/:slug` - Organization details
- `/dashboard/organizations/:slug/settings` - Organization settings
- `/dashboard/profile` - User profile

See [docs/ROUTES.md](./docs/ROUTES.md) for complete route documentation.

## 🧪 Testing

### Manual Testing

1. **Create a Mock API:**
   - Navigate to `/dashboard/mocks/new`
   - Fill in the form (name, endpoint, method, response code, body)
   - Save and test the mock at `/api/[your-endpoint]`

2. **Test an API:**
   - Navigate to `/dashboard/test`
   - Enter any API endpoint
   - Select HTTP method and add headers/body
   - Click "Send Request" to test

3. **Create an Organization:**
   - Navigate to `/dashboard/organizations`
   - Click "Create Organization"
   - Add members and create organization-scoped mocks

### API Testing

You can test mock APIs directly using curl or any HTTP client:

```bash
# Test a mock API
curl -X GET http://localhost:3000/api/users

# Test with POST
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{"name": "John Doe"}'

# Test organization-scoped mock
curl -X GET http://localhost:3000/api/org/my-org/users
```

## 📚 Documentation

- **[Environment Setup](./docs/ENV_SETUP.md)** - Detailed environment variable setup
- **[Supabase Setup](./docs/SUPABASE_SETUP.md)** - Supabase configuration guide
- **[Routes](./docs/ROUTES.md)** - Complete routes documentation
- **[Tasks](./docs/TASKS.md)** - Development tasks and roadmap

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 🐛 Troubleshooting

### Database Connection Issues

- Ensure `DATABASE_URL` is correctly set in `.env.local`
- For Supabase, use the direct connection string for local development
- Check that your Supabase project is active

### Authentication Issues

- Verify `JWT_SECRET` is set in `.env.local`
- Clear browser cookies and try logging in again
- Check Supabase authentication settings

### Prisma Issues

- Run `npm run db:generate` to regenerate Prisma Client
- Ensure database schema is up to date with `npm run db:push`
- Check Prisma logs for detailed error messages

See [docs/TROUBLESHOOTING.md](./docs/TROUBLESHOOTING.md) for more troubleshooting tips.

## 📝 License

MIT License © 2025

## 🙌 Author

**Punesh Borkar**  
_Senior Frontend Developer @ RapidInnovation.io_

---

Made with ❤️ using Next.js, TypeScript, and Supabase
