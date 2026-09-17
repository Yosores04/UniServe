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

- React 19 and Vite
- TypeScript
- Express
- Prisma ORM
- SQLite for local development
- Vitest and Supertest
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

The client environment does not need Node.js when the application is deployed as a static website. Build the application on a development computer with Node.js, then upload the contents of the `dist` directory to a static hosting provider such as GitHub Pages, Netlify, or Vercel.

The client can then access the application through the hosting URL using a web browser. The generated files should be served through HTTP or HTTPS rather than opened directly from the local file system, because Vite asset paths require a web server.

## Authentication and Roles

The application uses backend authentication with HTTP-only session cookies. Role permissions are enforced by the API and are not granted by changing frontend state. The four role areas are:

- **Customer:** `/customer`
- **Rider:** `/rider`
- **Shop:** `/shop`
- **Admin:** `/admin`

Local seed accounts are available for development:

| Role | Email | Password |
| --- | --- | --- |
| Admin | `admin@uniserve.local` | `Admin123!` |
| Customer | `customer@uniserve.local` | `Customer123!` |
| Rider | `rider@uniserve.local` | `Rider123!` |
| Shop | `shop@uniserve.local` | `Shop123!` |

These credentials are for local development only. Change them before any deployment.

## Application Data

Orders, users, rider availability, shop statuses, complaints, chat messages, and ratings are stored in the local Prisma database.

The current implementation uses SQLite for local development. PostgreSQL can be used for production by changing `DATABASE_URL` and the Prisma datasource configuration.

## Development Commands

```powershell
npm run dev       # Start the development server
npm run dev:full  # Start the Vite frontend and Express API together
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
  App.tsx                 Application entry point and session state
  components/             Shared interface, authentication, card, and map components
  lib/                    Application state, authentication helpers, and tests
  portals/                Student, courier, entrepreneur, and admin workspaces
  styles.css              Responsive application styling
server/
  src/                    Express API, authentication, RBAC, and role modules
prisma/
  schema.prisma           Database schema
  seed.ts                 Repeatable local development seed
```

## Verification

Run the test suite before delivery or deployment:

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
