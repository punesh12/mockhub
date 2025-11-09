# MockHub - 🧩 API Mock & Test Dashboard

A developer-focused **SaaS dashboard** to **create, mock, and test APIs** — all in one place.  
Think of it as a lightweight, beautiful alternative to Postman + Mock Server, built with **Next.js**, **TypeScript**, and **Supabase**.

---

## 🚀 Overview

The **API Mock & Test Dashboard** enables developers to:

- Create mock APIs instantly for testing and frontend prototyping.
- Test real or mock endpoints directly from a web interface.
- Visualize request/response data in a clean, developer-friendly UI.
- Manage history, authentication, and environment variables.

### 🎯 Problem

Developers often rely on multiple tools (Postman, JSON Server, Insomnia) for API testing and mocking.  
This leads to:

- Tool switching and context loss.
- Difficult collaboration across teams.
- No hosted mock API service for quick sharing.

### 💡 Solution

A unified web app where developers can **mock, test, and visualize APIs** with zero setup — accessible anywhere, deployable on Vercel.

---

## 🧱 Core Objectives

| Goal                    | Description                                                                                        |
| ----------------------- | -------------------------------------------------------------------------------------------------- |
| 🧰 Simplify Mocking     | Allow users to quickly create and manage mock APIs with custom endpoints and responses.            |
| ⚡ Real-Time Testing    | Provide an in-browser API testing playground (like Postman) with instant feedback.                 |
| 📜 Request History      | Automatically save API requests and responses for future reference.                                |
| 🧑‍💻 Developer Experience | Deliver a clean, fast, and intuitive dashboard UI with syntax highlighting and JSON visualization. |
| 🔐 Authentication       | Enable user accounts and secure mock data with JWT-based sessions.                                 |

---

## ✨ Key Features

### 1. **Authentication & User Management**

- Sign up, login, and logout with email/password.
- JWT-based authentication via NextAuth.
- Profile management (name, avatar, password reset).

### 2. **Mock API Creation**

- Define endpoint name, HTTP method, and JSON response.
- Auto-generate mock data using Faker.js.
- Get a sharable mock URL (e.g., `mock.punesh.dev/api/123/users`).

### 3. **API Testing Playground**

- Send GET, POST, PUT, DELETE requests.
- Add headers, params, and request body.
- View formatted response (status, headers, duration).
- Save each test to history.

### 4. **Dashboard & History**

- View list of all created APIs and test logs.
- Filter and sort by endpoint, method, and status.
- Display response statistics (average response time, success rate).

### 5. **Environment Variables**

- Define and switch between environments (`DEV`, `STAGE`, `PROD`).
- Replace variables in request URLs dynamically.

### 6. **Mock Data Generator**

- Generate JSON automatically using Faker.js.
- Example:
  ```json
  {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com"
  }
  ```

# 🧩 API Mock & Test Dashboard

A **SaaS tool for developers** to create, mock, and test APIs in one place — a clean, fast, and collaborative alternative to Postman + Mock Server.

---

## 7. 🚀 Advanced (Future Scope)

- 🌍 Public sharing of mocks
- 👥 Team collaboration & shared collections
- 🤖 AI-assisted mock response generation (OpenAI API)
- ⚙️ Rate limiting and request analytics
- 📘 Swagger schema import/export
- 🌓 Dark/light mode theme persistence

---

## 👤 User Stories

| ID  | As a...            | I want to...                          | So that I can...                         |
| --- | ------------------ | ------------------------------------- | ---------------------------------------- |
| US1 | Developer          | Create mock endpoints easily          | Test frontend components without backend |
| US2 | Developer          | Send API requests directly in browser | Verify responses and headers             |
| US3 | Developer          | View past requests                    | Quickly retry or debug previous calls    |
| US4 | Authenticated User | Save and organize my mocks            | Access them across sessions              |
| US5 | Developer          | Generate fake JSON data               | Save time mocking responses              |
| US6 | Admin              | Manage users and endpoints (future)   | Maintain platform integrity              |

---

## 🧩 System Architecture

### **Frontend**

- ⚛️ Next.js (App Router)
- 🟦 TypeScript
- 🎨 shadcn/ui for UI components
- ⚡ React Query / Zustand for state management
- 🎞 Framer Motion for animations

### **Backend**

- 🧠 Next.js API Routes (serverless endpoints)
- 🧩 Prisma ORM for database interaction
- 🗃 PostgreSQL / Supabase for storage
- 🔐 NextAuth (JWT) for authentication

### **Deployment**

- ▲ Hosted on **Vercel**
- 🛢 Database hosted on **Supabase / Neon.tech**
- ⚙️ CI/CD via **GitHub Actions**

---

## 🧮 Database Schema

### **User**

| Field     | Type   | Description      |
| --------- | ------ | ---------------- |
| id        | UUID   | Primary Key      |
| name      | String | Full name        |
| email     | String | Unique email     |
| password  | String | Hashed password  |
| createdAt | Date   | Signup timestamp |

### **MockApi**

| Field        | Type   | Description                   |
| ------------ | ------ | ----------------------------- |
| id           | UUID   | Primary Key                   |
| userId       | UUID   | Linked user                   |
| name         | String | API name                      |
| endpoint     | String | Custom endpoint               |
| method       | String | HTTP method (GET, POST, etc.) |
| responseBody | JSON   | Stored mock data              |
| responseCode | Int    | HTTP code                     |
| createdAt    | Date   | Creation timestamp            |

### **RequestHistory**

| Field        | Type   | Description     |
| ------------ | ------ | --------------- |
| id           | UUID   | Primary Key     |
| userId       | UUID   | Linked user     |
| url          | String | Endpoint tested |
| method       | String | HTTP method     |
| status       | Int    | Response status |
| responseTime | Float  | Duration (ms)   |
| responseBody | JSON   | Stored response |
| createdAt    | Date   | Timestamp       |

---

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

---

## 🧠 Data Flow

[Frontend UI] → (Axios) → [Next.js API Routes] → [Prisma ORM] → [PostgreSQL]
↑
|
[NextAuth JWT]

---

## 🧰 Tech Stack

| Category             | Tool                                                           |
| -------------------- | -------------------------------------------------------------- |
| **Frontend**         | Next.js 15, TypeScript, shadcn/ui, Tailwind CSS, Framer Motion |
| **State Management** | Zustand / React Query                                          |
| **Backend**          | Next.js API Routes, Prisma                                     |
| **Database**         | Supabase / PostgreSQL                                          |
| **Auth**             | NextAuth (JWT)                                                 |
| **Mock Generator**   | @faker-js/faker                                                |
| **Charts**           | Recharts                                                       |
| **Deployment**       | Vercel                                                         |
| **CI/CD**            | GitHub Actions                                                 |
| **Testing**          | Jest + React Testing Library                                   |
| **Linting**          | ESLint + Prettier                                              |

---

## 🎨 UI/UX Overview

### **Pages**

- 🏠 **Landing Page** — overview, CTA to login
- 🔐 **Signup / Login Page** — modern form with validation
- 🧭 **Dashboard** — sidebar navigation (Mocks, History, Profile)
- ⚙️ **Create Mock Modal** — define method, endpoint, response
- 🧪 **API Tester** — test requests and view JSON responses
- 🙍 **Profile Page** — manage user info, logout

### **Design Guidelines**

- 🎨 Primary Color: `#0048FF`
- 🔲 Rounded corners: `1rem`
- 🌫 Shadows: soft, subtle
- 🌗 Dark/Light mode toggle
- 🧱 Use Lucide icons and clean spacing

---

## 🗓 Development Roadmap

| Week | Milestone           | Deliverables                                   |
| ---- | ------------------- | ---------------------------------------------- |
| 1    | Setup & Auth        | Project setup, Prisma + Supabase, JWT auth     |
| 2    | Mock API CRUD       | Create + view mock endpoints                   |
| 3    | API Tester          | Request/Response UI, Axios integration         |
| 4    | Dashboard & History | History logging, response metrics              |
| 5    | Mock Generator      | Integrate Faker.js, UI polish                  |
| 6    | Deployment & Docs   | Deploy to Vercel, finalize README & case study |

---

## 📈 Success Metrics

| Metric                                  | Goal    |
| --------------------------------------- | ------- |
| First Response Render Time              | < 500ms |
| API Creation Latency                    | < 200ms |
| Lighthouse Performance                  | > 90    |
| Avg. Daily Active Users (internal test) | > 20    |
| Deployment Uptime                       | 99%+    |

---

## 🧩 Future Enhancements

- 👥 Team workspaces & permissions
- 🤖 OpenAI integration for auto-generating realistic mock data
- 📦 API import/export (JSON/Swagger)
- 🧩 Chrome extension for quick testing
- 🔁 WebSocket support for live API responses
- 🌐 Custom domain mapping for premium users

---

## 🧾 License

**MIT License © 2025 [Punesh Borkar](mailto:punesh@rapidinnovation.dev)**

---

## 🙌 Author

**Punesh Borkar**  
_Senior Frontend Developer @ RapidInnovation.io_  
[LinkedIn](https://linkedin.com/in/puneshborkar) • [Email](mailto:punesh@rapidinnovation.dev)
