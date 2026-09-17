# UniServe Full-Stack Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a persistent UniServe backend, enforce role authorization, separate Customer/Rider/Shop/Admin frontend routes, and provide repeatable database seeding.

**Architecture:** Add an Express TypeScript API under `server/` with Prisma and SQLite for local development. Use Argon2 password hashes and HTTP-only sessions. The React frontend will use protected role route areas and an API client; existing portal components will be migrated incrementally rather than removed in one large rewrite.

**Tech Stack:** React, TypeScript, Vite, Express, Prisma, SQLite, Argon2, Vitest, Supertest.

---

### Task 1: Add backend dependencies and workspace scripts

**Files:**
- Modify: `package.json`
- Modify: `vite.config.ts`
- Create: `server/tsconfig.json`
- Create: `server/src/app.ts`
- Create: `server/src/server.ts`
- Create: `server/src/config/env.ts`
- Test: `server/src/app.test.ts`

- [ ] Add Express, Prisma, Argon2, cookie middleware, Zod, and Supertest dependencies.
- [ ] Add scripts: `server:dev`, `server:build`, `server:test`, `db:migrate`, and `db:seed`.
- [ ] Configure Vite `/api` development proxy to the Express server.
- [ ] Create an Express app factory with JSON parsing, cookie parsing, health endpoint, and centralized error responses.
- [ ] Add a failing health endpoint test, run `npm run server:test`, then implement the endpoint and rerun it.
- [ ] Run `npm run build` and `npm run server:build`.
- [ ] Commit: `Add UniServe backend foundation`.

### Task 2: Create Prisma schema and seed data

**Files:**
- Create: `prisma/schema.prisma`
- Create: `prisma/seed.ts`
- Create: `.env.example`
- Modify: `package.json`
- Create: `server/src/db/prisma.ts`
- Create: `server/src/db/seed.test.ts`

- [ ] Define User, Session, CustomerProfile, RiderProfile, Shop, ShopItem, Order, OrderItem, Delivery, Complaint, ChatThread, ChatMessage, and Rating models with ownership relations and enums.
- [ ] Configure SQLite datasource using `DATABASE_URL`.
- [ ] Configure Prisma seed execution through the package scripts.
- [ ] Implement idempotent seed logic using stable emails and upserts.
- [ ] Seed admin, customer, rider, shop accounts, shops/items, orders, complaints, chats, and ratings.
- [ ] Add seed verification tests for required users, roles, and representative order states.
- [ ] Run `npx prisma migrate dev --name init`, `npm run db:seed`, and `npm run server:test`.
- [ ] Commit: `Add UniServe database schema and seed data`.

### Task 3: Implement authentication and RBAC middleware

**Files:**
- Create: `server/src/modules/auth/auth.service.ts`
- Create: `server/src/modules/auth/auth.routes.ts`
- Create: `server/src/middleware/authenticate.ts`
- Create: `server/src/middleware/authorize.ts`
- Create: `server/src/middleware/errorHandler.ts`
- Create: `server/src/modules/auth/auth.test.ts`
- Modify: `server/src/app.ts`

- [ ] Implement register with Zod validation, Argon2 hashing, role validation, profile creation, and HTTP-only session cookie.
- [ ] Implement login, logout, and current-user endpoints.
- [ ] Hash session tokens before database storage and expire sessions by timestamp.
- [ ] Implement `authenticate` and `authorize(...roles)` middleware.
- [ ] Add tests for valid/invalid credentials, logout, unauthenticated access, role rejection, and session loading.
- [ ] Run `npm run server:test` and `npm run server:build`.
- [ ] Commit: `Implement UniServe authentication and authorization`.

### Task 4: Implement customer and rider APIs

**Files:**
- Create: `server/src/modules/customer/customer.routes.ts`
- Create: `server/src/modules/customer/customer.service.ts`
- Create: `server/src/modules/rider/rider.routes.ts`
- Create: `server/src/modules/rider/rider.service.ts`
- Create: `server/src/modules/customer/customer.test.ts`
- Create: `server/src/modules/rider/rider.test.ts`
- Modify: `server/src/app.ts`

- [ ] Add customer shop/item listing, order creation, owned-order listing/detail, rating, and order chat endpoints.
- [ ] Validate pickup/drop-off differences, shop/item ownership, order totals, and completed-order rating eligibility.
- [ ] Add rider profile, Online/Offline availability, eligible jobs, accept job, delivery status, earnings, and assigned-order chat endpoints.
- [ ] Enforce that riders can only mutate their own assignments and that Offline riders cannot accept jobs.
- [ ] Test cross-role access rejection and cross-user ownership rejection.
- [ ] Run `npm run server:test`.
- [ ] Commit: `Add customer and rider APIs`.

### Task 5: Implement shop and admin APIs

**Files:**
- Create: `server/src/modules/shop/shop.routes.ts`
- Create: `server/src/modules/shop/shop.service.ts`
- Create: `server/src/modules/admin/admin.routes.ts`
- Create: `server/src/modules/admin/admin.service.ts`
- Create: `server/src/modules/shop/shop.test.ts`
- Create: `server/src/modules/admin/admin.test.ts`
- Modify: `server/src/app.ts`

- [ ] Add shop profile/hours/open-status, item CRUD, order listing/status, and sales endpoints.
- [ ] Enforce shop owner scope for profile, item, and order mutations.
- [ ] Add admin user/rider/shop/order/complaint/report endpoints.
- [ ] Add complaint resolution, shop verification, and user status actions.
- [ ] Derive overview metrics from database queries rather than trusting client-provided values.
- [ ] Test shop ownership and admin-only access.
- [ ] Run `npm run server:test` and `npm run server:build`.
- [ ] Commit: `Add shop and admin APIs`.

### Task 6: Add frontend API client and authenticated route shell

**Files:**
- Create: `src/lib/apiClient.ts`
- Create: `src/lib/authClient.ts`
- Create: `src/app/router.tsx`
- Create: `src/app/layouts/RoleLayout.tsx`
- Create: `src/app/auth/LoginPage.tsx`
- Create: `src/app/auth/RegisterPage.tsx`
- Modify: `src/main.tsx`
- Modify: `src/App.tsx`
- Modify: `src/styles.css`

- [ ] Add typed fetch helpers that send cookies, parse API errors, and expose loading-safe request functions.
- [ ] Replace local auth session entry with `/api/auth/me`, login, register, logout, and guest mode clearly separated from production auth.
- [ ] Add protected role route resolution for `/customer`, `/rider`, `/shop`, and `/admin`.
- [ ] Redirect authenticated users away from auth pages and unauthorized roles away from protected areas.
- [ ] Add loading, unauthorized, and API error states.
- [ ] Run frontend tests and `npm run build`.
- [ ] Commit: `Add authenticated frontend route shell`.

### Task 7: Migrate separate role interfaces

**Files:**
- Create: `src/features/customer/CustomerRoutes.tsx`
- Create: `src/features/rider/RiderRoutes.tsx`
- Create: `src/features/shop/ShopRoutes.tsx`
- Create: `src/features/admin/AdminRoutes.tsx`
- Modify: existing portal components under `src/portals/`
- Modify: `src/components/DemoKit.tsx`

- [ ] Replace the shared client-side portal switcher with role-specific navigation and route layouts.
- [ ] Connect Customer screens to shop/order/chat/rating APIs.
- [ ] Connect Rider screens to availability/jobs/delivery/earnings APIs.
- [ ] Connect Shop screens to profile/items/orders/sales APIs.
- [ ] Connect Admin screens to users/riders/shops/orders/complaints/reports APIs.
- [ ] Preserve the current visual system while giving each role distinct navigation and permitted controls.
- [ ] Add frontend tests for route protection and primary role workflows.
- [ ] Run `npm run test`, `npm run build`, and `npm run server:test`.
- [ ] Commit: `Separate UniServe role interfaces`.

### Task 8: Integrate local development and document handoff

**Files:**
- Modify: `package.json`
- Modify: `README.md`
- Modify: `.env.example`
- Create: `server/src/health.test.ts`
- Modify: `.gitignore`

- [ ] Add a root development command that starts Vite and Express together.
- [ ] Document environment setup, migrations, seeding, development accounts, role routes, and security boundaries.
- [ ] Document that seeded credentials are local-only and must be replaced before deployment.
- [ ] Add final health and smoke coverage for frontend/backend startup.
- [ ] Run `npm run test`, `npm run server:test`, `npm run build`, and `npm run server:build`.
- [ ] Run browser smoke flows for login, customer, rider, shop, and admin routes.
- [ ] Commit and push: `Complete UniServe full-stack foundation`.
