# System review and proposed marketplace/demo scope

Review date: October 20, 2026. Findings are based on source inspection and the existing test/build commands; no phone-to-laptop demo has been verified.

## Implementation outcome

The user approved the proposed scope, and the findings below have been addressed. The connected application now uses saved, role-scoped workspaces; the older browser-local prototype portals are no longer mounted. Marketplace onboarding/catalog management, orders, preparation, deliveries, messages, ratings, complaints, and admin verification are connected to the API. Simulated authentication helpers and guest/Google entry were removed.

Final verification: 33 tests passed across 12 files; frontend production build and backend compilation passed. Independent code review findings were resolved. Headless Edge signed in through the actual interface in four isolated role sessions and checked layouts at 320px, 390px, and 1440px with no overflow or browser exceptions. LAN HTTP/frontend, health, login, and workspace checks passed through http://10.0.0.42:5173/ on this laptop. Tests migrate/seed separate temporary databases; demo setup preserves existing accounts and workflows.

The demo server was started using `npm run demo`. Physical phone access is still unverified. Windows reports the current Ethernet connection as Public and denied the attempted local-subnet firewall rule because the process lacks Administrator privileges. Run `npm run demo:firewall` in Administrator PowerShell to apply the narrowly scoped rule, then confirm phone access on the same network. The current laptop IP can change; use `npm run demo:urls`.

The remaining sections record the original review and the approved proposal.

## Findings

1. **High: API responses expose password hashes.** Shop orders include complete customer records; rider profiles include complete user records; several admin endpoints include complete owner/user/customer records. Prisma includes return `passwordHash` unless fields are explicitly selected. Use a shared public-user projection and regression tests covering each affected endpoint.
2. **High: portal actions are browser-local.** `src/App.tsx` initializes `createDemoState`, and all portals mutate that React state. Only authentication uses the API. Orders, chats, ratings, shop changes, and delivery updates do not persist or synchronize between phones. Connect each visible action to authorized backend endpoints and fetch role-scoped database state.
3. **High: seed data conflicts with rider acceptance.** The seed creates a delivery for an order still marked PENDING with no order riderId. The accept endpoint then attempts to create another delivery for that order, violating its unique orderId. Seed consistent pending/unassigned or accepted/assigned data. Claim jobs atomically so concurrent riders cannot both claim the same job.
4. **Medium: entrepreneur registration creates no shop.** `auth.service.ts` creates customer/rider profiles, but no SHOP profile. Shop update/item endpoints assume a shop exists. Add seller onboarding with pending admin verification and a clear unverified state.
5. **Medium: entrepreneur UI selects the first demo store.** `EntrepreneurPortal.tsx:38` uses `state.stores[0]` rather than the signed-in owner's shop. Scope seller reads and writes by the authenticated owner, with an empty/onboarding state.
6. **Medium: logout invalidates every device.** `/api/auth/logout` deletes all sessions for the user. Delete only the current token's session so phones using the same account remain independent.
7. **Medium: Google and guest entry are simulated.** `AuthScreen.tsx` directly sets frontend users for these buttons, without a server session. Those users cannot use authenticated APIs. Remove or clearly separate the simulated paths from the shared demo; genuine Google authentication needs its own configured integration.
8. **Medium: delivery state transitions are unrestricted.** The rider endpoint permits any of PICKED_UP, ON_THE_WAY, DELIVERED on any assigned delivery, including backwards updates. Enforce allowed transitions and shop readiness server-side. Shop preparation transitions also need guards.
9. **Demo blocker: frontend binds only to loopback.** `package.json` binds dev/preview to 127.0.0.1. Add an explicit LAN demo command, retain relative /api requests through the Vite proxy, and print accessible network addresses. Phone access additionally depends on Windows firewall and Wi-Fi client isolation.
10. **Test setup blocker: DATABASE_URL missing.** A clean `npm test -- --run` fails six database-backed tests. Tests also rely on seeded shared state. Use an isolated test database with migrations and fixtures; keep tests independent from the live demo database.

## Verification performed

- Frontend build: passed (`npm run build`).
- Backend compilation: passed (`npm run server:build`).
- Existing tests: 15 passed, 6 failed; database-dependent failures report missing DATABASE_URL.
- Node commands needed sandbox escalation because Node could not resolve C:/Users/Josh inside the sandbox.
- Existing user changes were preserved. No application source was changed during this review.

## Proposed implementation for approval

Extend the existing application rather than create a separate marketplace system. Students browse verified entrepreneur shops, search products, choose quantities, and submit orders priced by the server. Sellers create their shop, await admin verification, manage product names/prices/availability and store hours, and prepare orders for their own store. Use the current database schema where possible. Preserve Food, Printing, and Errand workflows while adding marketplace browsing.

Connect customer, seller, courier, and admin interfaces to role-scoped APIs. Refresh visible data approximately every two seconds with no overlapping refreshes, and refresh immediately after writes. Display loading, empty, failed-request, and disconnected states. Disable repeat submissions during mutations and retain form input on failures. Server permissions remain authoritative. Online payment processing, stock accounting, and genuine Google OAuth are outside this proposed scope; payment selection does not imply payment collection.

For the simultaneous demo, run one laptop-hosted backend and database with a LAN-accessible frontend and API proxy. All phones join the same Wi-Fi or hotspot and open the laptop's network URL, each signing into a role account. Provide a startup command, network URL instructions, and a customer-to-seller-to-courier-to-admin walkthrough. Test independent sessions and propagation through the complete order lifecycle. Verify the reachable LAN endpoint from this machine; a physical phone connection must be confirmed on the demo network.

Alternative scopes are (1) a browse-only marketplace with seller listings, which is smaller but omits the shared order workflow; or (2) inventory and online payments, which needs additional data design and payment-provider configuration. The integrated marketplace and shared LAN demo above is recommended for the requested presentation.
