# UniServe Full-Stack Design

## Goal

Transform the current frontend-only UniServe prototype into a full-stack application with a persistent backend, database-backed authentication, enforced role authorization, separate role interfaces, and repeatable development seed data.

## Product Roles

The system has four distinct roles:

- `CUSTOMER`: browses services, creates orders, tracks deliveries, chats, and rates completed orders.
- `RIDER`: manages online/offline availability, views eligible jobs, accepts deliveries, updates delivery status, chats, and views earnings.
- `SHOP`: manages the shop profile, operating hours, menu items, incoming orders, preparation status, and sales history.
- `ADMIN`: manages users, riders, shops, orders, complaints, approvals, and operational reports.

A user has one role in the initial release. Role authorization is enforced by the backend on every protected endpoint; frontend route visibility is not treated as security.

## Backend Architecture

Add a TypeScript Express API under `server/` using Prisma ORM. SQLite is the default local development database, and the schema remains compatible with PostgreSQL for production deployment.

```text
server/
  src/
    app.ts
    server.ts
    config/
    middleware/
      authenticate.ts
      authorize.ts
      errorHandler.ts
    modules/
      auth/
      users/
      customers/
      riders/
      shops/
      orders/
      complaints/
      chat/
      admin/
    db/
      prisma.ts
      seed.ts
  prisma/
    schema.prisma
```

Authentication uses bcrypt password hashing and HTTP-only session cookies. Google authentication remains outside the production scope until a real provider configuration is supplied.

## Database Model

The initial Prisma schema contains:

- `User`: identity, email, password hash, role, active status, timestamps.
- `Session`: hashed session token, user relation, expiration, timestamps.
- `CustomerProfile`: customer-specific details.
- `RiderProfile`: verification status, availability, current location, earnings.
- `Shop`: owner relation, name, category, location, open status, operating hours.
- `ShopItem`: shop menu/service item, price, availability.
- `Order`: customer, shop, rider, service type, locations, status, payment method, totals.
- `OrderItem`: line items belonging to an order.
- `Delivery`: rider assignment and pickup/delivery timestamps.
- `Complaint`: order/customer context, description, status, resolution.
- `ChatThread`: order-linked conversation participants.
- `ChatMessage`: sender, thread, content, timestamp.
- `Rating`: completed-order rating and optional comment.

Foreign keys and server-side ownership checks prevent cross-role and cross-user data access.

## API Boundaries

### Authentication

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`

### Customer

- `GET /api/customer/shops`
- `GET /api/customer/shops/:shopId/items`
- `POST /api/customer/orders`
- `GET /api/customer/orders`
- `GET /api/customer/orders/:orderId`
- `POST /api/customer/orders/:orderId/rating`
- `POST /api/customer/orders/:orderId/messages`

### Rider

- `GET /api/rider/profile`
- `PATCH /api/rider/availability`
- `GET /api/rider/jobs`
- `POST /api/rider/jobs/:orderId/accept`
- `PATCH /api/rider/deliveries/:orderId/status`
- `POST /api/rider/orders/:orderId/messages`
- `GET /api/rider/earnings`

### Shop

- `GET /api/shop/profile`
- `PATCH /api/shop/profile`
- `GET /api/shop/items`
- `POST /api/shop/items`
- `PATCH /api/shop/items/:itemId`
- `GET /api/shop/orders`
- `PATCH /api/shop/orders/:orderId/status`
- `GET /api/shop/sales`

### Admin

- `GET /api/admin/users`
- `GET /api/admin/riders`
- `GET /api/admin/shops`
- `PATCH /api/admin/users/:userId/status`
- `PATCH /api/admin/shops/:shopId/verification`
- `GET /api/admin/orders`
- `GET /api/admin/complaints`
- `PATCH /api/admin/complaints/:complaintId`
- `GET /api/admin/reports/overview`

## Authorization Rules

- Authentication middleware loads the session and current user.
- Role middleware rejects requests whose role is not allowed for the route.
- Ownership middleware verifies that customers access only their orders, riders access only their assignments, and shops access only their resources.
- Admin endpoints require the `ADMIN` role.
- The frontend receives the authenticated role from `/api/auth/me` and renders only the matching route tree.
- Direct navigation to another role path results in an authorization error or redirect.

## Frontend Structure

Refactor the current single-shell role switch into protected route areas:

```text
src/
  app/
    router.tsx
    auth/
    layouts/
  features/
    customer/
    rider/
    shop/
    admin/
  lib/
    apiClient.ts
    authClient.ts
    queryClient.ts
```

Each role has its own navigation, dashboard, data loading, loading state, empty state, error state, and permitted actions. Shared primitives remain reusable, but role dashboards no longer expose a client-side role switcher as an authorization mechanism.

## Seeding

Provide repeatable commands:

```powershell
npm run db:migrate
npm run db:seed
```

The seed creates:

- One admin account.
- One customer account.
- One verified rider account and one offline rider account.
- One verified shop account and one pending shop account.
- Shops and service items.
- Orders in pending, accepted, in-transit, and delivered states.
- Complaints, chat messages, and ratings.

Seed credentials are for local development only and must be clearly labeled in the README.

## Error Handling

The API returns consistent JSON errors with an error code, human-readable message, and request identifier. The frontend maps authentication, authorization, validation, not-found, and server errors to role-appropriate messages without exposing stack traces or sensitive details.

## Testing

Backend tests cover:

- Registration, login, logout, and session loading.
- Password hashing and invalid credentials.
- Role middleware and ownership checks.
- Customer order creation and access boundaries.
- Rider Online/Offline availability and job acceptance.
- Shop order and menu ownership.
- Admin-only management endpoints.
- Seed idempotency and required reference data.

Frontend tests cover:

- Role-specific route protection.
- API loading and error states.
- Customer, rider, shop, and admin primary workflows.

The project must pass the full test suite, TypeScript build, and browser smoke flows for each role.

## Deployment Boundary

Local development runs the Vite frontend and Express API together. The backend owns the database connection and authentication cookies. Production deployment is not part of the first implementation slice; the application will remain runnable locally with SQLite and environment variables documented for a future PostgreSQL deployment.

## Out Of Scope

- Real Google OAuth configuration.
- Real payment processing or wallet integration.
- Push notifications.
- Production cloud infrastructure.
- Multi-organization tenancy.
- Multiple roles per user.
