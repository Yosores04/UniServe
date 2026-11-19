# UniServe mobile app

Build one installable app for campus orders. Returning users land on the work associated with their signed-in role. Android is the first development target. Keep the same service rules and capabilities for iOS.

## Student journey

Home and Orders are the persistent destinations. Account access stays in the header. Put an active order with a Track order button first on Home, then give Food, Printing, Errands, and Marketplace equal prominence. Carry the selected service through provider selection and checkout. Display shop availability before the student starts a basket.

After the first item is selected, keep View basket within reach. The review screen shows quantities, campus drop-off, service instructions, fees, total and payment preference. The existing e-wallet selection records preference only. Back preserves the draft. Place order opens that order's status screen. Display the latest confirmed state, messages, help and eligible actions. Past orders support reorder, ratings and issue reporting according to existing rules.

## Role destinations

| Role | Starting screen | Other tasks |
| --- | --- | --- |
| Seller | Incoming and in-progress orders, with the next preparation action | History, products and availability, shop registration, profile, hours, open/closed status and sales |
| Courier | Assigned delivery when present, otherwise available jobs and online status | Accept a job, review pickup and drop-off, message, confirm pickup, mark on the way and delivered, review history and earnings |
| Admin | Operations overview with direct links to pending work | Filter orders, review shops and courier applications, handle reports, manage people and view operational figures |

Sign-in restores the server-assigned role. Registration keeps the existing customer, courier and shop paths and approval rules. Before shipping, inventory the actions in the live role screens and API routes and verify that each has a mobile entry point and the same permission checks.

## Application boundaries

- Package React's built assets in Capacitor. Use mobile navigation and the Android back gesture to move through service, basket and order screens. Returning from order details restores the prior list position and filter.
- Route mobile requests through one API client with an environment-specific endpoint. Keep Express authoritative for account roles, pricing, eligibility and status changes. For the bundled app, use a native HTTP transport with a persistent cookie jar for the existing HTTP-only session. Verify login, cold restart, expiry and logout on device before building the role screens.
- Begin with foreground polling at the existing interval. Pause while backgrounded and refresh on resume. Preserve drafts during network interruptions and label stale status. Give checkout a per-submission identifier and deduplicate retries on the server. Competing courier claims must yield one assignment.
- Use the existing SQLite database for the local development loop. The shared pilot uses HTTPS, a separately configured Express service and managed PostgreSQL. Prepare provider-specific migrations and pilot accounts before testing across networks.

## Windows development and acceptance

1. In Android Studio Device Manager, start the existing Pixel_6_API_35 virtual phone. For command-line launches, set ANDROID_AVD_HOME to the user's .android/avd directory if the emulator lists no devices. Use a phone-sized browser viewport for quick layout checks.
2. Run the development API on the laptop. The Android emulator reaches host loopback through `10.0.2.2`. Configure the debug app for the local API on port 3001. Limit local HTTP allowances to debug builds. Release builds use HTTPS.
3. Build and install the debug APK. From a clean install, sign in, place a test order and reopen it after backgrounding and restarting. Use separate laptop browser sessions for the seller, courier and admin so all four roles share one test database.
4. Ask first-time users to request printing, find its status, and message a participant without guidance. Record first taps, backtracking and requests for help. Revise any screen where users consistently lose their place.
5. Exercise every existing role action. Check duplicate checkout after a disconnect, simultaneous courier acceptance, cancellation eligibility and expired sessions. Repeat the full delivery on physical phones against staging before distributing the signed pilot APK.

The first runnable milestone is a locally installed debug APK that signs in to the laptop API, opens the correct role and restores the session on relaunch. iOS simulator and signing checks follow on macOS with Xcode.
