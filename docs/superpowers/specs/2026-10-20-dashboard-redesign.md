# UniServe dashboard redesign

Approved direction: modern campus dashboard, blue/navy identity with restrained gold, compact navigation and metrics, and focused role workflows. User approved implementation on October 20, 2026.

Replace the oversized marketing hero with a workspace heading and a desktop sidebar. On phones, show the current workspace title with a persistent bottom navigation. Use a system font stack, regular body text, clear heading hierarchy, 44px controls, rounded white surfaces, neutral page background, accessible focus and status indicators. No remote fonts or assets are required for offline demos.

Customer sections: Marketplace and My orders. Marketplace contains shop discovery and a focused product/checkout view; order history is separate. Seller sections: Orders, Products, Shop settings. Default to Orders; catalog rows open an accessible modal editor; keep unsaved drafts and failed submissions intact. Courier sections: Job board, My deliveries, History, with an availability summary. Admin sections: Overview, Orders, Approvals, Reports, People; prioritize approvals and active operations and present accounts as readable rows.

Use existing authenticated APIs and role-scoped polling. Changes preserve current account permissions, pricing, order transitions, chat, ratings, complaints, and demo commands. Place success/errors near the relevant action where possible; global connection status remains unobtrusive and failures readable. Avoid disabling unrelated navigation while a mutation is saving. Product dialogs must trap focus, close with Escape when idle, restore trigger focus, and stay within phone viewports.

Verify all role navigation, empty states, modal keyboard behavior, draft retention during refresh, ordering controls, styling of every input, no horizontal overflow at 320/390/1440px, and both production builds plus existing regression tests.

## Implementation verification

Implemented the shared shell, persistent mobile navigation, focused role sections, product dialogs, refreshed authentication, and a replacement stylesheet. Navigation remains available while requests save. Section changes retain form drafts and synchronize with browser history; each role resolves invalid sections to its own default.

Verification: 35 automated tests passed across 13 test files; frontend production build and backend compilation passed. The Edge browser check signed in four separate accounts and exercised all 13 sections at 320px, 390px, and 1440px. It verified no horizontal overflow, controls at least 44px high, mobile form fonts at least 16px, settings/product draft retention through polling and navigation, in-dialog errors on a simulated rejected save, initial focus, Tab/Shift+Tab trapping, Escape dismissal, and trigger focus restoration. The simulated failure did not write to the demo database.

Independent review findings about small controls and mobile input zoom were addressed. Browser testing also caught and verified fixes for conflicting autofocus and a navigation/dialog focus timing race. Physical phone verification remains separate from emulated browser sizes. No backend API or database schema change was needed.
