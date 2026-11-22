# UniServe local Android pilot implementation plan

> For implementation, use superpowers:subagent-driven-development. Track completed steps in the checklist.

**Goal** — Install an APK on the laptop's Pixel 6 emulator, sign in through the local Express API, open the correct workspace and retain the session after restarting.

**Architecture** — Package the Vite build in Capacitor. Keep one API client for authentication and workspace requests. Select the native HTTP transport on Android and preserve the existing browser transport. Express and the existing local SQLite database serve all test devices.

**Stack** — React, Vite, Capacitor Android, Android Studio, Express, Prisma and Vitest.

## 1. Establish the build

- [x] Baseline verified on Windows using `npm.cmd test` (37 tests across 13 files passed) and `npm.cmd run build` (production bundle generated). Use the explicit npm.cmd launcher in this shell.
- [x] Check the current Capacitor toolchain requirements against Node 20.17, the Android Studio JDK and installed SDK platforms 31, 34, 35 and 36. Select matching supported Node, JDK and SDK versions, using a project-specific runtime if an upgrade is needed. Record exact versions in README.md.
- [x] Add matching-major @capacitor/core, @capacitor/android and @capacitor/cli packages to package.json and package-lock.json. Keep the CLI a dev dependency. Create capacitor.config.ts with appName UniServe, proposed development identifier ph.edu.buksu.uniserve.dev, and webDir dist. Bundle assets in the APK.
- [x] Run `npm run build`, `npx cap add android`, then `npx cap sync android`. Track the generated Android project, including its Gradle wrapper. Exclude local.properties, build outputs and signing keys.
- [x] Run `.\android\gradlew.bat -p android assembleDebug`. Expect android/app/build/outputs/apk/debug/app-debug.apk. Inspect the merged release manifest to verify local cleartext access is disabled.

## 2. Connect authentication and workspace requests

- [x] Extend src/lib/apiClient.test.ts with native-transport tests for POST JSON, 401, empty 204, malformed response, timeout and cancellation. Verify a browser request still uses the original relative path and includes cookies. Run `npx vitest run src/lib/apiClient.test.ts` and confirm the new transport cases fail before implementation.
- [x] In src/lib/apiClient.ts use Capacitor platform detection. Send native requests through CapacitorHttp with a trusted configured origin, JSON body and bounded timeouts. Keep the existing ApiError and empty-response contract. Ignore late responses after cancellation. Keep web fetch on the existing Vite proxy.
- [x] Use a dedicated Vite development build mode for the emulator endpoint http://10.0.2.2:3001. Reject missing or non-HTTPS native release origins during packaging. Use android/app/src/debug/AndroidManifest.xml and a debug-only network security configuration for local HTTP. Verify a release package cannot use that URL even after a previous debug build.
- [x] Keep HTTP-only session cookies in the native transport's persistent jar. Exercise src/lib/authClient.ts and src/lib/workspace.ts through the same transport. Verify login, authenticated GET, process restart and logout against a real API before extending mobile navigation.
- [x] Run `npx vitest run src/lib/apiClient.test.ts`, `npm test` and `npm run build`. Expect all baseline tests and added transport tests to pass.

## 3. Install and exercise the APK

- [x] Add a reproducible debug build command to package.json that builds the emulator mode, syncs bundled assets into Android and invokes assembleDebug. Document Windows setup, the APK path and how to rebuild after frontend changes in README.md.
- [x] Prepare local test accounts with `npm run demo:setup`, then start the local API. Start Pixel_6_API_35 from Android Studio Device Manager. Use the SDK platform-tools copy of adb when it is absent from PATH.
- [x] Run `adb devices` and select the emulator serial. For the first test use a virtual phone where UniServe has never been installed. Run `adb -s SERIAL install android/app/build/outputs/apk/debug/app-debug.apk`, substituting the listed serial. Expect Success. Open UniServe from the launcher. On subsequent builds use `install -r` to test updates while retaining app data.
- [x] Sign in as a student, inspect the workspace, force-stop the app from Android Settings, and reopen it. Expect the same signed-in student. Sign out and restart again. Expect the sign-in screen. Invalidate only a disposable test session on the server and verify the next authenticated request returns the user to sign-in.
- [x] Repeat sign-in with a seller, courier and admin. Using separate API sessions for the other roles, place and complete one order. Record APK path, build version, emulator model, observed role destinations and test outcomes.

## Subsequent delivery milestones

| Milestone | Primary files | Acceptance |
| --- | --- | --- |
| Student navigation | src/App.tsx, src/lib/workspaceNavigation.ts, src/portals/live/Marketplace.tsx and OrderDetails.tsx | Home and Orders, four equal service choices, persistent basket during Back, active order tracking, messaging, help, cancellation, reorder and ratings. First-time testers complete the printing and tracking tasks without coaching. |
| Role workflows | src/portals/live/SellerWorkspace.tsx, RiderWorkspace.tsx, AdminWorkspace.tsx and src/components/workspace/WorkspaceShell.tsx | Map every live screen action and API operation to its mobile entry point. Seller sees the queue, assigned courier sees current work, admin can reach approvals and reports from overview. Check role restrictions and Android Back on each route. |
| Interrupted requests and concurrent users | src/lib/workspaceSync.ts, src/portals/live/Marketplace.tsx, server/src/modules/customer/customer.routes.ts, server/src/modules/rider/rider.routes.ts and prisma/schema.prisma | Pause polling in background, refresh on resume, retain drafts on disconnect. Retry checkout with a stable submission ID under a database uniqueness constraint. Two simultaneous courier claims produce one winner. Cover both races with integration tests. |
| Shared pilot and iOS | server/src/server.ts, Prisma schema and provider-specific migrations, Capacitor platform projects | Retain a reproducible local SQLite setup. Verify PostgreSQL migrations in staging, HTTPS and independent accounts. Repeat the delivery over separate networks on physical phones. Distribute a signed Android pilot. Build and verify iOS on macOS before TestFlight. |
