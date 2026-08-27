# BukSU Courier

BukSU Courier is a Vite + React demonstration system for campus deliveries, errands, printing, and student marketplace requests.

## Requirements

- Node.js 20 LTS or newer
- npm (included with Node.js)
- A modern browser such as Chrome, Edge, or Firefox

## Run The System Locally

Open PowerShell or a terminal in the project folder and run:

```powershell
npm install
npm run dev
```

Open the local address shown by Vite, usually:

```text
http://localhost:5173/
```

The development server must remain open while using the system. Stop it with `Ctrl+C`.

## Production Build

To create an optimized version for hosting:

```powershell
npm install
npm run build
```

The deployable files will be created in the `dist` folder. Preview the production build locally with:

```powershell
npm run preview
```

## Client Laptop With No Node.js

The client has two practical options.

### Option A: Install Node.js on the laptop

1. Download the **Node.js LTS** installer from https://nodejs.org/.
2. Install it using the default settings.
3. Restart PowerShell or Command Prompt.
4. Confirm the installation:

   ```powershell
   node --version
   npm --version
   ```

5. Copy the project folder to the laptop.
6. Run `npm install`, then `npm run dev`.
7. Open the local Vite address in the browser.

### Option B: Host the built files without Node.js

Build the project on a computer that has Node.js:

```powershell
npm install
npm run build
```

Upload the contents of `dist` to a static hosting provider such as GitHub Pages, Netlify, or Vercel. The client then opens the hosting URL and does not need Node.js installed.

Do not open `dist/index.html` directly with a `file:///` URL. Vite asset paths are intended to be served over HTTP by a web server or static hosting provider.

## Demo Authentication

Authentication is currently for demonstration only. It does not use a backend, database, real password storage, or real Google OAuth.

- Use **Continue as guest** for the fastest demo.
- Use **Continue with Google Demo** to show the Google sign-in experience.
- Use **Sign up** to select a demo role: student/customer, courier, or entrepreneur.
- Use **Log out** in the header to return to the auth screen.

Never use the demo authentication flow for real accounts or production credentials.

## Available Demo Portals

- **Student Portal:** create, track, cancel, and reorder delivery requests.
- **Courier Portal:** change availability, filter jobs, accept requests, and advance delivery status.
- **Entrepreneur Portal:** manage store order preparation statuses and view sales.
- **Admin Portal:** monitor active orders, filter operations, and approve or reject applications.

## Development Commands

```powershell
npm run dev       # Start the Vite development server
npm run build     # Type-check and create the production build
npm run test      # Run the test suite
npm run preview   # Preview the production build
```

## Project Structure

```text
src/
  App.tsx                 Application entry point and session state
  components/             Shared UI, header, auth, cards, and map components
  lib/                    Demo state, authentication helpers, and tests
  portals/                Student, courier, entrepreneur, and admin views
  styles.css              Shared responsive styling
```

## Important Note

This repository is a frontend demo. Orders, authentication, users, and portal actions are stored only in browser memory and reset when the page is refreshed or the demo is reset. A production version would need a backend API, persistent database, secure authentication, authorization rules, and real Google OAuth configuration.
