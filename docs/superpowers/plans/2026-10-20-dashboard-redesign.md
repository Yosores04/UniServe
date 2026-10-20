# Dashboard redesign implementation plan

> Use superpowers:subagent-driven-development with independent spec/code review. Preserve the unrelated existing documentation edit. No additional design approval needed: the user approved the proposed redesign.

**Goal:** Replace the old dashboard presentation with a cohesive, responsive interface and focused role sections.

**Architecture:** App owns role-aware section navigation; each live portal renders one selected section. Shared layout, metrics, dialogs, and a replacement stylesheet provide one visual system. Existing API contracts and polling remain unchanged.

**Stack:** React, TypeScript, CSS, Lucide, Vitest, existing headless Edge/CDP smoke runner.

- [x] Add role-section metadata with navigation/authorization tests; implement compact desktop sidebar and mobile navigation in App.
- [x] Reorganize Marketplace, SellerWorkspace, RiderWorkspace, AdminWorkspace into focused sections; add product editor dialog and catalog summaries. Preserve every existing mutation and empty/error state.
- [x] Build accessible shared Modal with focus management and keyboard dismissal; test dialog behavior in real browser.
- [x] Replace accumulated legacy stylesheet with one coherent system for auth, shell, panels, forms, cards, lists, statuses and responsive layouts. Remove misleading hero actions from the mounted app.
- [x] Refine shared order details and marketplace checkout for hierarchy, readable totals and touch controls.
- [x] Extend existing browser verification to cover all sections, modal create/edit/draft behavior, keyboard dismissal, input sizing, and mobile/desktop overflow. Avoid writes to live demo data in visual smoke checks.
- [x] Run full regression suite and both builds; inspect screenshots and obtain independent spec/code review; resolve findings and record verification.
