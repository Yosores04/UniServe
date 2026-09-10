# UniServe Workflow Expansion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rename the product to UniServe and add balanced, state-backed customer, courier, entrepreneur, and admin workflows while keeping the frontend-only in-memory architecture.

**Architecture:** Extend `DemoState` with only the workflow data needed by the reference requirements. Add pure mutation helpers in `src/lib/demoState.ts`, cover each helper with Vitest tests, and keep UI changes inside the existing portal components and shared `DemoKit.tsx` primitives. No backend, persistence, payment processing, or real OAuth is introduced.

**Tech Stack:** React 19, TypeScript, Vite, Vitest, Lucide React, CSS.

---

### Task 1: Rename the product and shared visual identity

**Files:**
- Modify: `src/components/DemoKit.tsx`
- Modify: `src/components/AuthScreen.tsx`
- Modify: `index.html`
- Modify: `src/lib/portalConfig.ts`
- Modify: `src/styles.css`

- [ ] **Step 1: Update visible branding strings**

Replace user-facing `BukSU Courier` product labels with `UniServe` in the header, authentication screen, portal copy, and HTML document title. Preserve BukSU references only where they describe the university context.

- [ ] **Step 2: Change logo marks**

Change the header mark and auth mark letter from `B` to `U` while preserving the existing navy/gold square treatment.

- [ ] **Step 3: Update portal language**

Keep role labels clear, but replace any product-specific wording that still says BukSU Courier with UniServe wording.

- [ ] **Step 4: Run focused verification**

Run:

```powershell
npm run build
```

Expected: TypeScript compilation and Vite build pass.

- [ ] **Step 5: Commit**

```powershell
git add index.html src/components/DemoKit.tsx src/components/AuthScreen.tsx src/lib/portalConfig.ts src/styles.css
git commit -m "Rename product to UniServe"
```

### Task 2: Extend shared in-memory workflow state

**Files:**
- Modify: `src/types.ts`
- Modify: `src/lib/demoState.ts`
- Modify: `src/lib/demoState.test.ts`

- [ ] **Step 1: Write failing tests for new pure mutations**

Add tests for:

```typescript
expect(setPaymentMethod(state, "order-1001", "E-wallet").orders[0].paymentMethod).toBe("E-wallet");
expect(rateOrder(deliveredState, "order-1001", 5).orders[0].rating).toBe(5);
expect(setStoreOpen(state, "canteen-express", false).stores[0].status).toBe("Closed");
expect(resolveComplaint(state, "complaint-1").complaints[0].status).toBe("Resolved");
```

The tests must also verify invalid status transitions return the original state.

- [ ] **Step 2: Run the focused tests to confirm failure**

Run:

```powershell
npm run test -- --run src/lib/demoState.test.ts
```

Expected: FAIL because the new helpers/types do not yet exist.

- [ ] **Step 3: Add minimal types and initial state**

Extend `PaymentMethod` to include `E-wallet`, add optional `rating` and `chat` fields to `Order`, add store hours and featured-item data, and add `Complaint` records to `DemoState`. Initialize one or two representative complaints and chat messages in `createDemoState`.

- [ ] **Step 4: Implement pure state helpers**

Add guarded helpers:

```typescript
setPaymentMethod(state, orderId, paymentMethod)
rateOrder(state, orderId, rating)
addOrderMessage(state, orderId, sender, message)
setStoreOpen(state, storeId, isOpen)
acceptStoreOrder(state, orderId)
resolveComplaint(state, complaintId)
```

Each helper returns the original state for unknown IDs or invalid status conditions and recalculates stats when order/store state changes.

- [ ] **Step 5: Run focused tests to confirm pass**

Run:

```powershell
npm run test -- --run src/lib/demoState.test.ts
```

Expected: all demo state tests pass.

- [ ] **Step 6: Commit**

```powershell
git add src/types.ts src/lib/demoState.ts src/lib/demoState.test.ts
git commit -m "Add shared UniServe workflow state"
```

### Task 3: Complete customer workflow

**Files:**
- Modify: `src/portals/CustomerPortal.tsx`
- Modify: `src/components/DemoKit.tsx`
- Modify: `src/styles.css`

- [ ] **Step 1: Add customer controls**

Add compact controls for payment selection, order history filtering, completed-order rating, and a chat panel using the shared mutation helpers. Keep cancel and reorder actions, and only show rating after delivery.

- [ ] **Step 2: Add route and request validation**

Prevent placing an order when pickup and drop-off are identical. Show a concise inline message and keep the current form values intact.

- [ ] **Step 3: Add visible interaction feedback**

Show the selected payment method, a saved rating, and new chat messages immediately from local state. Use existing panel and chip styles instead of introducing a modal system.

- [ ] **Step 4: Run customer-focused verification**

Run:

```powershell
npm run build
npm run test -- --run
```

Expected: build passes and all tests pass.

- [ ] **Step 5: Commit**

```powershell
git add src/portals/CustomerPortal.tsx src/components/DemoKit.tsx src/styles.css
git commit -m "Expand customer service workflow"
```

### Task 4: Complete courier and entrepreneur workflows

**Files:**
- Modify: `src/portals/CourierPortal.tsx`
- Modify: `src/portals/EntrepreneurPortal.tsx`
- Modify: `src/components/DemoKit.tsx`
- Modify: `src/styles.css`

- [ ] **Step 1: Add courier verification and earnings history**

Display a verified status, job detail information, per-delivery earnings, and a small completed-delivery history derived from the current state.

- [ ] **Step 2: Add courier confirmation and chat controls**

Use the existing order status flow for pickup and delivery confirmation. Add a compact message input that appends a local chat message to the active order.

- [ ] **Step 3: Add entrepreneur store controls**

Add store open/closed control, operating hours, featured-item editing in local state, new-order acceptance, and sales/order history filtering.

- [ ] **Step 4: Run focused verification**

Run:

```powershell
npm run build
npm run test -- --run
```

Expected: build passes and all tests pass.

- [ ] **Step 5: Commit**

```powershell
git add src/portals/CourierPortal.tsx src/portals/EntrepreneurPortal.tsx src/components/DemoKit.tsx src/styles.css
git commit -m "Expand courier and entrepreneur workflows"
```

### Task 5: Complete admin workflow and final validation

**Files:**
- Modify: `src/portals/AdminPortal.tsx`
- Modify: `src/components/DemoKit.tsx`
- Modify: `src/styles.css`

- [ ] **Step 1: Add admin resource views**

Add compact tabs for users, couriers, and stores. Keep the existing dashboard tiles and connect each tab to visible local data.

- [ ] **Step 2: Add complaints and analytics**

Add a complaint queue with resolve actions, service-type order counts, and fee/rating summaries derived from `DemoState`.

- [ ] **Step 3: Run the complete automated checks**

Run:

```powershell
npm run test -- --run
npm run build
```

Expected: all tests pass and the production build succeeds.

- [ ] **Step 4: Run browser smoke checks**

Verify:

- `UniServe` and the `U` logo appear on auth and dashboard screens.
- Customer payment, order history, rating, and chat controls update visibly.
- Courier availability, job filtering, confirmation, earnings, and chat controls work.
- Entrepreneur store status, order acceptance, menu, and history controls work.
- Admin resource tabs, complaints, analytics, and application actions work.

- [ ] **Step 5: Commit and push**

```powershell
git add src/components/DemoKit.tsx src/portals/AdminPortal.tsx src/styles.css
git commit -m "Complete UniServe role workflows"
git push
```
