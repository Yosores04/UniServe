# UniServe

UniServe is a campus services platform for requesting food deliveries, printing services, errands, and marketplace orders. The application provides dedicated workspaces for customers, couriers, campus entrepreneurs, and administrators.

## Overview

The application includes the following user areas:

- **Student Portal:** Submit, track, cancel, and reorder campus service requests.
- **Courier Portal:** Manage availability, review requests, accept assignments, and update delivery progress.
- **Entrepreneur Portal:** Review store orders, update preparation status, and monitor sales information.
- **Admin Portal:** Monitor operations, filter active orders, and review applications.

The application uses a shared Express API and SQLite database. Orders, marketplace products, preparation updates, deliveries, chat, ratings, and approvals persist across browser sessions. Signed-in workspaces refresh approximately every two seconds.

The dashboard uses a desktop sidebar and persistent phone navigation. Students switch between Marketplace and My orders; entrepreneurs use Orders, Products, and Shop settings; couriers use Job board, My deliveries, and History; administrators use Overview, Orders, Approvals, Reports, and People. Sellers add and edit products in focused dialogs. Unsaved shop/checkout drafts remain while switching sections and receiving live updates; reloading or signing out discards unsaved drafts.

## Updating and Running on a Friend's Laptop

These steps assume Windows, Git and Node.js are installed, and the repository is already on the laptop. Open the project folder in VS Code and choose **Terminal > New Terminal**. Run each command separately; continue only if it finishes successfully.

### After an update is published to GitHub

1. If the demo is running, click its terminal and press `Ctrl+C` to stop it.
2. In the project terminal, run:

```powershell
git pull --ff-only
npm ci
npx prisma generate
npm run demo:setup
npm run demo
```

`git pull` downloads published code changes, `npm ci` installs the matching dependencies, `prisma generate` prepares the database client, and `demo:setup` applies database updates and adds any missing demo accounts. Existing passwords, products, and order progress are preserved by the current setup script. Internet access is needed to download updates and dependencies.

If any command reports an error, stop there. If Git reports local changes or says it cannot fast-forward, ask the project developer to resolve it; do not use a reset command or delete files to force the update. The developer must commit and push changes to GitHub before another laptop can download them. Saving files on the developer's laptop does not publish them.

### On days with no code updates

Open the project terminal and run just:

```powershell
npm run demo
```

Keep that terminal open and the laptop awake during the presentation. Use `http://localhost:5173/` on the laptop. Use a printed `Phone` address on the phones.

Each laptop has its own local database. Pulling code from GitHub does not copy another laptop's accounts or order history. Do not delete `.env` or `prisma/dev.db` when updating. All phones in one presentation should connect to the same hosting laptop.

## Connecting Phones to the Laptop's Hotspot

1. Connect the laptop to the available internet connection if Windows needs one to enable its hotspot. Use school Wi-Fi only where sharing is permitted.
2. On the laptop, open **Settings > Network & internet > Mobile hotspot**.
3. Choose the connection to share under **Share my internet connection from**, and select **Wi-Fi** under **Share over**.
4. Check or edit the hotspot's network name and password, then turn **Mobile hotspot** on. If available, turn off its power-saving option for the presentation.
5. On every phone, open Wi-Fi settings and join the **laptop's hotspot name**, using that password. Phones should join the laptop hotspot for this setup, rather than joining school Wi-Fi separately.
6. Start `npm run demo` after enabling the hotspot. If it is already running, leave it running and use a second project terminal to run `npm run demo:urls`.
7. Open the laptop's hotspot `Phone` address in each phone's browser, then sign into the desired role. Keep the laptop on `http://localhost:5173/`.

If several `Phone` addresses are listed, the laptop has multiple network adapters. For phones joined to its hotspot, use the hotspot adapter's address. It may be labelled `Local Area Connection*` followed by a number. If the label is unclear, open the connected Wi-Fi network details on a phone: its **Router** or **Gateway** address should match the laptop hotspot address in the printed list. Add `http://` before it and `:5173/` after it. For example, a gateway of `192.168.137.1` gives `http://192.168.137.1:5173/`; use the actual address shown on the devices.

Windows hotspot availability depends on the laptop's wireless adapter and system/network policies. The application works locally without internet once installed, but that does not guarantee Windows can enable its hotspot without an upstream connection. If hotspot is unavailable, connect the laptop and phones to another permitted shared network.

Windows hotspot settings reference: [Microsoft's mobile hotspot instructions](https://support.microsoft.com/en-gb/windows/experience/connectivity-networking/use-your-windows-device-as-a-mobile-hotspot).

## Automatic Network Configuration and School Wi-Fi

No IP address needs to be entered into the source code or `.env`. The demo listens on the laptop's network interfaces, detects current IPv4 addresses at startup, and prints phone links. API requests use the same address as the website, so there is no separate backend IP to configure. After changing networks or enabling a hotspot, run `npm run demo:urls` to print the updated links and reopen the correct link on each phone. Existing browser tabs do not automatically move to a new IP address.

The script lists candidate addresses; it does not automatically choose which adapter each phone can reach. Windows manages Wi-Fi connections, hotspot passwords, and IP assignment. The application cannot automatically enable a restricted hotspot, grant itself Administrator privileges, or change school network policies.

If using school Wi-Fi directly, join the laptop and all phones to the same network and use the laptop's Wi-Fi `Phone` link. Some school networks block communication between devices even when they use the same Wi-Fi name. In that situation, changing the IP address in the app will not help: use an allowed laptop hotspot/shared network, or ask school IT to permit the demo connection.

If the laptop page works but phones cannot connect, first confirm the hotspot/network and the selected address. Then, once per hosting laptop, open **PowerShell as Administrator**, navigate to the project folder, and run:

```powershell
npm run demo:firewall
```

That rule allows the Node.js demo on port 5173 from the local subnet; it does not override school network restrictions. If it reports Administrator access is required, it has not applied the rule. A school-managed laptop may require IT assistance. Test the actual phones on the presentation network beforehand.

## Simultaneous Demo on Phones

Install dependencies once, then prepare and start the demo from this folder:

```powershell
npm install
npm run demo:setup
npm run demo
```

`demo:setup` creates `.env` only when missing, applies database migrations, and seeds the role accounts and four shops (three verified, one student shop awaiting approval on a fresh setup). Existing passwords, catalog edits, approval decisions, and order progress are preserved. Use Node.js 20.12 or later (a current LTS is recommended).

Keep the terminal and laptop running. Connect the laptop and all phones to the **same Wi-Fi/router or hotspot**, then open a `Phone` URL printed in the terminal, for example `http://10.0.0.42:5173/`. The address can change when the laptop changes networks; run `npm run demo:urls` to see it again. `localhost` on a phone refers to the phone itself, so use the laptop's network address.

Sign in on each device with a different role from the accounts table below. All devices share the laptop's database, with separate login sessions. Orders and changes appear within about two seconds while connected. This uses polling, rather than an instant push connection. No internet connection is needed after installation; the local network must allow devices to communicate.

If Windows asks about Node.js network access, allow it on the trusted demo network. If phones cannot open the URL, open **PowerShell as Administrator**, navigate to this folder, and run `npm run demo:firewall`. This adds a rule limited to Node.js, TCP port 5173, and devices on the local subnet, including when Windows labels the current network Public. Only use this on a network you trust. To remove it afterward, run `Remove-NetFirewallRule -Name UniServe-LAN-Demo-5173` in Administrator PowerShell. Campus/guest Wi-Fi may isolate devices; use a personal router or hotspot in that case. The API stays on laptop loopback port 3001; phones access it through the frontend's `/api` proxy. Do not forward the development port to the public internet.

For a demo walkthrough:

1. On the student phone, sign in as `customer@uniserve.local`, select the entrepreneur's shop (**Student Finds** on a fresh setup), add products, and place a Marketplace order.
2. On the entrepreneur phone, sign in as `entrepreneur@uniserve.local`; the order appears automatically. Choose **Accept & prepare**, then **Ready for pickup**.
3. On the courier phone, sign in as `rider@uniserve.local`, go online, and accept the order. Confirm pickup, choose **On the way**, then **Mark delivered**.
4. Watch the student and admin screens update. Exchange an order message before delivery; afterward, rate the delivery or report a problem.
5. To demonstrate onboarding, register an Entrepreneur account, create a shop, and add products. An admin verifies the shop before it appears to students. New couriers also need admin verification before accepting jobs.

For food orders use `shop@uniserve.local`; for printing/errands use `printing@uniserve.local`. The checkout supports Food, Printing, Errand, and Marketplace requests with product quantities and server-calculated prices. E-wallet selection records a payment preference only; it does not process online payments. Shop hours are displayed as text; sellers control availability with **Open shop / Close shop**.

Press `Ctrl+C` in the demo terminal to stop both services. If port 5173 or 3001 is already occupied, stop the earlier instance before starting another demo. `npm run demo` intentionally uses port 5173 and requires `PORT=3001` in `.env`.

## Technology Stack

- React 19 and Vite
- TypeScript
- Express
- Prisma ORM
- SQLite for local development
- Vitest and Supertest
- Lucide React

## System Requirements

For local development or building the application, install the following:

- Node.js 20.12 or later
- npm, included with Node.js
- A modern web browser such as Google Chrome, Microsoft Edge, or Mozilla Firefox

## Local Installation

1. Install Node.js 20 LTS or a later LTS release from [nodejs.org](https://nodejs.org/).
2. Open PowerShell or Command Prompt.
3. Navigate to the application directory:

```powershell
cd "path\to\UniServe"
```

4. Install the project dependencies:

```powershell
npm install
```

5. Create a local environment file:

```powershell
Copy-Item .env.example .env
```

6. Create the local database and seed the initial accounts:

```powershell
npm run db:migrate
npm run db:seed
```

7. Start the frontend and backend together:

```powershell
npm run dev:full
```

8. Open the local address displayed in the terminal. The default address is:

```text
http://localhost:5173/
```

Keep the terminal window open while using the local application. Press `Ctrl+C` to stop the development server.

## Production Build

To create an optimized build for deployment, run:

```powershell
npm install
npm run build
```

The generated files are placed in the `dist` directory.

To preview the production build locally:

```powershell
npm run preview
```

## Deployment For Client Use

The browser frontend requires the backend and database for login and every live workflow. Static hosting alone is insufficient. For production, host the Express API and persistent database, serve the built frontend, and reverse-proxy `/api` on the same HTTPS origin. Production sessions use secure cookies. The local Vite demo command is intended for a trusted presentation network.

## Authentication and Roles

The application uses backend authentication with HTTP-only session cookies. Role permissions are enforced by the API and are not granted by changing frontend state. The four role areas are:

- **Customer:** `/customer`
- **Rider:** `/rider`
- **Shop:** `/shop`
- **Admin:** `/admin`

Local seed accounts are available for development:

| Role     | Email                     | Password       |
| -------- | ------------------------- | -------------- |
| Admin    | `admin@uniserve.local`    | `Admin123!`    |
| Customer | `customer@uniserve.local` | `Customer123!` |
| Rider    | `rider@uniserve.local`    | `Rider123!`    |
| Shop     | `shop@uniserve.local`     | `Shop123!`     |
| Student entrepreneur | `entrepreneur@uniserve.local` | `Shop123!` |
| Student entrepreneur applicant | `student.seller@uniserve.local` | `Shop123!` |
| Printing / errand shop | `printing@uniserve.local` | `Shop123!` |

These credentials are for local development only. Change them before any deployment.

Student entrepreneurs use the existing seller account type and entrepreneur workspace. On a fresh setup, **Alyssa Reyes** runs **Student Finds**, a verified shop selling notebooks, sticker packs, and crochet keychains. **Miguel Santos** runs **Study Break Bakes**, a student bakery awaiting admin approval. The seed also includes a Marketplace order for Student Finds so its seller queue can be demonstrated immediately. All names and businesses are fictional demo data.

To demonstrate the new scope, sign in as the entrepreneur to manage products and prepare the sample order, or sign in as `student.seller@uniserve.local` to view the pending bakery. An admin can verify the bakery under **Approvals**; it then appears in the student marketplace. Reseeding preserves that approval. For an existing database, only the original generic `Student Entrepreneur` account label and unedited `Marketplace` category are upgraded; personalized names and shop edits are retained.

## Application Data

Orders, users, rider availability, shop statuses, complaints, chat messages, and ratings are stored in the local Prisma database.

The current implementation uses SQLite for local development. PostgreSQL can be used for production by changing `DATABASE_URL` and the Prisma datasource configuration.

## Development Commands

```powershell
npm run dev       # Start the development server
npm run dev:full  # Start the Vite frontend and Express API together
npm run demo:setup # Prepare the LAN demo database and accounts
npm run demo      # Start API + frontend accessible from phones
npm run demo:urls # Print the laptop's current phone URLs
npm run demo:firewall # Allow phone access (Administrator PowerShell, Windows)
npm run demo:check # Optional Windows/Edge browser smoke check; start demo first
npm run build     # Type-check and create the production build
npm run test      # Run the automated test suite
npm run server:test # Run backend API tests
npm run server:build # Compile the backend
npm run db:migrate # Apply Prisma migrations
npm run db:seed   # Seed local role accounts and test data
npm run preview   # Preview the production build
```

## Project Structure

```text
src/
  App.tsx                 Authenticated live workspace and session state
  components/             Shared interface, authentication, card, and map components
  lib/                    Application state, authentication helpers, and tests
  portals/live/           Connected marketplace, seller, courier, and admin screens
  styles.css              Responsive application styling
server/
  src/                    Express API, authentication, RBAC, and role modules
prisma/
  schema.prisma           Database schema
  seed.ts                 Repeatable local development seed
scripts/
  demo*.mjs               Demo setup, server lifecycle, and network URLs
```

## Verification

Run the test suite before delivery or deployment:

Tests create, migrate, and seed a separate temporary SQLite database. They do not reset the live demo database.

```powershell
npm run test -- --run
```

Create a production build to verify TypeScript compilation and bundling:

```powershell
npm run build
npm run server:test -- --run
npm run server:build
```

## Repository

The source code is hosted at:

<https://github.com/Yosores04/UniServe>
