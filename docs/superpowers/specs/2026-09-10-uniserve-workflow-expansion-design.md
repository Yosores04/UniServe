# UniServe Workflow Expansion Design

## Goal

Rename the product to UniServe and expand the existing frontend prototype into a more complete campus-services workflow while preserving the current lightweight visual style and in-memory state model.

## Scope

This release remains frontend-only. No backend, database, real payment processing, persistent accounts, or production OAuth will be introduced. All new actions update the existing React state and reset when the page is refreshed or the application is reset.

## Branding

- Replace visible BukSU Courier product labels with UniServe.
- Change the compact brand mark and authentication mark from `B` to `U`.
- Update the document title and relevant user-facing copy.
- Preserve the current navy, gold, blue, and light-surface visual language.

## Customer Workflow

Add compact controls for:

- Browsing and selecting campus services/stores.
- Viewing recent order history.
- Reordering, cancelling eligible requests, and rating completed deliveries.
- Selecting a simulated COD or e-wallet payment method.
- Viewing a lightweight customer-courier chat history.
- Confirming the final delivery state where appropriate.

Existing order creation, tracking timeline, and route selection remain intact.

## Courier Workflow

Add compact controls for:

- Showing courier verification status.
- Setting availability and filtering eligible jobs.
- Viewing pickup, drop-off, customer note, and estimated earnings.
- Recording pickup and delivery confirmation through the existing order status flow.
- Viewing a small earnings history.
- Viewing a lightweight customer/store chat history.

Existing acceptance and status advancement remain intact.

## Entrepreneur Workflow

Add compact controls for:

- Toggling store open/closed status.
- Displaying operating hours.
- Managing a small featured-item list in memory.
- Accepting new orders before preparation begins.
- Filtering order and sales history.
- Continuing to update preparation status.

## Admin Workflow

Add compact controls for:

- Switching between users, couriers, and stores views.
- Monitoring active couriers and current orders.
- Filtering a complaint/report queue and resolving an item.
- Viewing basic order, fee, service-type, and rating summaries.
- Continuing to approve or reject applications.

## Architecture

- Keep `DemoState` as the shared source of truth.
- Add narrowly scoped state helpers in `src/lib/demoState.ts` for new mutations.
- Extend types only where the new workflow state requires it.
- Keep portal-specific presentation in the existing portal files and shared visual primitives in `DemoKit.tsx`.
- Keep authentication behavior separate from operational state.

## Interaction Rules

- Every visible action must update state or change a visible local view.
- Actions that are not valid for the current status must be disabled or omitted.
- Destructive actions remain limited to appropriate statuses.
- New controls should use the existing compact panels, segmented controls, filters, and action buttons rather than adding dense modal layers.

## Validation

- Add state-level tests for each new mutation and guard.
- Run the complete Vitest suite.
- Run the TypeScript/Vite production build.
- Smoke-test branding, customer actions, courier actions, entrepreneur controls, and admin filters in the browser.

## Out Of Scope

- Backend APIs and persistent storage.
- Real payment collection.
- Real-time messaging infrastructure.
- Production identity providers or Google OAuth.
- Full inventory, accounting, complaint-management, or analytics systems.
