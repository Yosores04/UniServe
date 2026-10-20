# Marketplace and simultaneous LAN demo implementation plan

> **For agentic workers:** Use superpowers:subagent-driven-development for implementation and independent review. Preserve existing uncommitted user edits.

**Goal:** Implement the approved marketplace, saved cross-device workflows, review fixes, and a repeatable phone demo.

**Architecture:** Express/Prisma remains authoritative. A role-scoped `/api/workspace` endpoint returns safe database snapshots; React refreshes them every two seconds without overlapping requests. Mutations use existing role endpoints with added onboarding, products, cancellation, chat, and verification actions.

**Tech stack:** React, TypeScript, Vite, Express, Prisma SQLite, Vitest, Supertest.

**Approved specification:** `docs/system-review-2026-10-20.md`, approved by the user October 20, 2026.

## Task 1: Server workflows and regression coverage

- [x] Add an isolated database migration/seed setup to `vitest.config.ts` and `server/test` so tests cannot mutate `prisma/dev.db`.
- [x] Write failing integration tests for seller onboarding/products, safe role-scoped workspace data, independent sessions, cancellation and chat ownership, job claim conflicts, and ordered delivery/preparation transitions. Run `npm test -- --run` and confirm meaningful failures.
- [x] Implement `/api/workspace` and action endpoints in focused server modules. Use public user field selections everywhere. Scope each read/write by the session; calculate totals on the server; enforce order transitions and atomic claims. Keep marketplace service type compatible with the existing String schema.
- [x] Correct inconsistent seed assignments; add student-marketplace and printing seed shops without changing existing account passwords. Load environment configuration reliably on server startup.
- [x] Run integration tests and `npm run server:build`; independently review API scope and security.

## API contract

`GET /api/workspace`: `{ shops, orders, rider, riders, users, complaints }`. Shops include items; orders include safe customer, shop, items, rating, delivery, and chatThread.messages with safe sender. SHOP sees only its shop/orders; CUSTOMER sees verified shops and own orders; RIDER sees pending jobs plus own assignments and own profile; ADMIN sees all. Empty collections are arrays; missing rider is null.

Actions: existing login/register/logout, customer POST orders, POST order rating/messages; add POST customer order cancel and complaint; PATCH rider availability, POST job accept, PATCH delivery status, POST delivery messages; POST shop profile onboarding, PATCH profile, POST items, PATCH items/:itemId, PATCH orders/:orderId/status; admin shop verification, rider verification, user status, complaint resolution.

Money: integer pesos, order input `{shopId,serviceType,pickupPoint,dropoffPoint,customerNote,paymentMethod,items:[{shopItemId,quantity}]}`. Shop creation `{name,category,location,operatingHours}`. Product `{name,price,available?}`. `rider` includes verified/availability; new riders need admin verification.

## Task 2: Connected React portals

- [x] Add shared API types/client, workspace polling with cleanup and stale-response protection, and tests for synchronization and mutation errors.
- [x] Connect `src/App.tsx` to the live workspace and retain server-authenticated navigation. Replace simulated Google/guest entry with honest authentication messaging; prevent duplicate auth submissions.
- [x] Add focused customer marketplace, seller catalog/onboarding, courier queue/delivery, admin verification/directory, and shared order/chat components under `src/portals/live`. Reuse existing layout/classes and keep input state during refreshes/errors.
- [x] Support Food, Printing, Errand, and Marketplace requests; product search, quantities, price totals, open/available restrictions, cancel, reorder, chat, ratings, complaints, seller preparation, rider transitions, and verification. Display real loading, empty, busy, and connection states; no demo data in live metrics.
- [x] Run client tests and `npm run build`; review empty and unauthorized cases.

## Task 3: LAN demo and verification

- [x] Add explicit LAN startup/setup commands and network URL output under `scripts`; keep API proxied from the phone's origin. Pin demo port and preserve local-only default commands.
- [x] Update README to explain full-stack hosting, same-Wi-Fi/hotspot access, firewall/client-isolation troubleshooting, accounts, and complete demo walkthrough. Remove inaccurate static-only deployment guidance.
- [x] Run all tests and both builds. Start the demo services, verify health/login/workspace through the frontend proxy and LAN address with independent sessions. Report physical-phone verification limits accurately.
- [x] Request independent spec compliance and code review, resolve findings, and record fresh final verification.
