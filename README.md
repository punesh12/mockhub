# MockHub - 🧩 API Mock & Test Dashboard

A developer-focused **SaaS dashboard** to **create, mock, and test APIs** — all in one place.  
Think of it as a lightweight, beautiful alternative to Postman + Mock Server, built with **Next.js**, **TypeScript**, and **Supabase**.

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database (or Supabase)
- npm or yarn

### Installation

1. Clone the repository:

```bash
git clone <your-repo-url>
cd mockhub
```

2. Install dependencies:

```bash
npm install
```

3. Set up Supabase:
   - Create a Supabase account at [supabase.com](https://supabase.com)
   - Create a new project
   - Get your database connection strings from **Settings** → **Database**
   - See [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) for detailed instructions

4. Set up environment variables:

```bash
cp .env.example .env
```

Update the `.env` file with your Supabase credentials:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://[PROJECT-REF].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# Database Connection (use direct connection for local dev)
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"

# JWT Secret (change this to a secure random string in production)
JWT_SECRET="your-secret-key-change-in-production"
```

**Note**: For production (Vercel/serverless), use the connection pooling URL instead. See [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) for details.

5. Set up the database:

```bash
# Generate Prisma Client
npm run db:generate

# Push schema to database
npm run db:push

# Or run migrations
npm run db:migrate
```

6. Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🧰 Tech Stack

- **Frontend**: Next.js 15, TypeScript, shadcn/ui, Tailwind CSS, Framer Motion
- **State Management**: Zustand / TanStack Query
- **Backend**: Next.js API Routes, Prisma
- **Database**: PostgreSQL / Supabase
- **Auth**: NextAuth (JWT)
- **Mock Generator**: @faker-js/faker
- **Charts**: Recharts

## 📁 Project Structure

```
mockhub/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   │   ├── auth/         # Authentication endpoints
│   │   ├── mocks/        # Mock API CRUD
│   │   ├── test/         # API testing endpoint
│   │   └── history/      # Request history
│   ├── auth/             # Auth pages (login, signup)
│   └── dashboard/        # Dashboard pages
├── components/            # React components
│   └── ui/               # shadcn/ui components
├── lib/                  # Utilities
│   ├── prisma.ts         # Prisma Client instance (Supabase)
│   ├── supabase.ts       # Supabase client configuration
│   ├── auth.ts           # Password hashing utilities
│   ├── auth-utils.ts     # Session management utilities
│   └── utils.ts          # Utility functions
└── prisma/               # Prisma schema
    └── schema.prisma
```

## 🗄️ Database Schema

The project uses Prisma with Supabase (PostgreSQL). Key models:

- **User**: User accounts with authentication
- **MockApi**: Created mock endpoints
- **RequestHistory**: API request/response history

## 📡 API Endpoints

| Method   | Endpoint           | Description                          | Auth |
| -------- | ------------------ | ------------------------------------ | ---- |
| `POST`   | `/api/auth/signup` | Register a new user                  | ❌   |
| `POST`   | `/api/auth/login`  | Authenticate user                    | ❌   |
| `GET`    | `/api/mocks`       | Fetch all mocks for user             | ✅   |
| `POST`   | `/api/mocks`       | Create new mock                      | ✅   |
| `GET`    | `/api/mocks/:id`   | Get mock by ID                       | ✅   |
| `DELETE` | `/api/mocks/:id`   | Delete mock                          | ✅   |
| `POST`   | `/api/test`        | Send API request and return response | ✅   |
| `GET`    | `/api/history`     | Fetch request history                | ✅   |

## 🛠️ Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run db:generate` - Generate Prisma Client
- `npm run db:push` - Push schema to database
- `npm run db:migrate` - Run database migrations
- `npm run db:studio` - Open Prisma Studio

## 🎨 UI Components

This project uses [shadcn/ui](https://ui.shadcn.com/) for UI components. To add new components:

```bash
npx shadcn@latest add [component-name]
```

## 🔗 Supabase Integration

This project is integrated with Supabase for:

- ✅ PostgreSQL database (via Prisma)
- ✅ Connection pooling for serverless environments
- 🔜 Future: Supabase Auth, Storage, Realtime

For detailed Supabase setup instructions, see [SUPABASE_SETUP.md](./SUPABASE_SETUP.md).

## 📝 License

MIT License © 2025

## 🙌 Author

**Punesh Borkar**  
_Senior Frontend Developer @ RapidInnovation.io_
