# UniServe cloud pilot

The Render Blueprint runs the web client and API together and stores accounts, sessions, orders and deliveries in a private PostgreSQL database. The pilot starts with an empty marketplace.

## Provision the pilot

1. In Render, select **New → Blueprint**, choose the UniServe repository, and select **deploy/cloud-pilot** as the Blueprint branch. Render reads `render.yaml` from that branch and builds the web service from it. Review the proposed Singapore web service and database. Both use the free plan. Verify both resource names are available in your workspace before applying. [Render Blueprint reference](https://render.com/docs/blueprint-spec)
2. In the Blueprint prompts, set `INITIAL_ADMIN_EMAIL` to the administrator's email and `INITIAL_ADMIN_PASSWORD` to a unique password generated and saved in your password manager. Use at least 16 characters and at most 72 UTF-8 bytes. Keep both values in Render's environment settings.
3. Apply the Blueprint. The build installs the locked dependencies, generates a PostgreSQL client, and compiles the app. Startup applies pending migrations and creates the initial administrator. Render supplies the port and internal database URL. A registered email or a different existing administrator blocks bootstrap. A restart with the same administrator leaves the stored password intact.
4. Open the service's assigned HTTPS address, check `/api/health`, and sign in as the administrator. After confirming access, remove both `INITIAL_ADMIN_*` values from the service environment and redeploy. Verify the same login still works.
5. Register dedicated customer, rider and shop accounts. Use the administrator to verify the rider and shop. Create a shop item and confirm it appears in the customer's marketplace. Use the assigned HTTPS origin for the Android release build. Test the installed APK over mobile data with Wi-Fi disabled, including login, order creation, assignment and delivery. Confirm the same order survives a service restart before publishing the download.

The free service sleeps after 15 minutes of inactivity, and cold startup can take about a minute. The free database expires after 30 days and has no managed backups. For a longer pilot, arrange persistent database capacity and backups before that deadline. [Render free instance limits](https://render.com/docs/free)

## Maintain the database

`prisma/schema.prisma` defines the application model. `npm run cloud:schema` generates its PostgreSQL variant under `prisma/cloud/`. Keep SQLite migrations under `prisma/migrations/` and PostgreSQL migrations under `prisma/cloud/migrations/`. When changing the model, generate and review a new migration for each provider against disposable development databases. Leave deployed migration files intact.

Run `npm run cloud:build` in a separate deployment checkout because it generates a PostgreSQL Prisma Client. To return that checkout to SQLite development, run `npx prisma generate --schema prisma/schema.prisma` and use the local file database URL. Demo seeding is restricted to local SQLite development.
