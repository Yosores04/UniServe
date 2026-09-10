# UniServe

UniServe is a campus services platform for requesting food deliveries, printing services, errands, and marketplace orders. The application provides dedicated workspaces for customers, couriers, campus entrepreneurs, and administrators.

## Overview

The application includes the following user areas:

- **Student Portal:** Submit, track, cancel, and reorder campus service requests.
- **Courier Portal:** Manage availability, review requests, accept assignments, and update delivery progress.
- **Entrepreneur Portal:** Review store orders, update preparation status, and monitor sales information.
- **Admin Portal:** Monitor operations, filter active orders, and review applications.

The current release is a frontend prototype intended for evaluation, presentation, and workflow review. The interface and application flows are implemented locally using React and TypeScript.

## Technology Stack

- React 19
- TypeScript
- Vite
- Vitest
- Lucide React

## System Requirements

For local development or building the application, install the following:

- Node.js 20 LTS or later
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

5. Start the local development server:

```powershell
npm run dev
```

6. Open the local address displayed in the terminal. The default address is:

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

The client environment does not need Node.js when the application is deployed as a static website. Build the application on a development computer with Node.js, then upload the contents of the `dist` directory to a static hosting provider such as GitHub Pages, Netlify, or Vercel.

The client can then access the application through the hosting URL using a web browser. The generated files should be served through HTTP or HTTPS rather than opened directly from the local file system, because Vite asset paths require a web server.

## Authentication

The current authentication interface is intended for workflow presentation and local evaluation. It includes:

- Email sign-in
- Account registration
- Role selection during registration
- Guest access
- A Google sign-in interface for presentation purposes
- Sign-out from the application header

Authentication data is not connected to a server, database, or identity provider in this release. No real Google credentials should be entered. Before production use, authentication must be replaced with a secure identity service and server-side authorization.

## Application Data

Orders, users, courier availability, store statuses, and activity updates are currently maintained in browser memory. Data is reset when the page is refreshed or the reset control is used.

A production implementation will require:

- A backend API
- Persistent database storage
- Secure authentication and password handling
- Role-based authorization
- Server-side order and payment validation
- Production Google OAuth configuration, if Google sign-in is required

## Development Commands

```powershell
npm run dev       # Start the development server
npm run build     # Type-check and create the production build
npm run test      # Run the automated test suite
npm run preview   # Preview the production build
```

## Project Structure

```text
src/
  App.tsx                 Application entry point and session state
  components/             Shared interface, authentication, card, and map components
  lib/                    Application state, authentication helpers, and tests
  portals/                Student, courier, entrepreneur, and admin workspaces
  styles.css              Responsive application styling
```

## Verification

Run the test suite before delivery or deployment:

```powershell
npm run test -- --run
```

Create a production build to verify TypeScript compilation and bundling:

```powershell
npm run build
```

## Repository

The source code is hosted at:

<https://github.com/Yosores04/UniServe>
