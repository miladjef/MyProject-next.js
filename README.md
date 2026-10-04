# Next416 Commerce Project

Programmer: Miladjef

This revision completes the project in four stabilization phases.

## Phase 1: Security and authentication

- Password login verifies bcrypt asynchronously and correctly.
- JWT payloads use the user id and a token version.
- Old sessions are invalidated after password or role changes.
- Banned accounts are rejected by server-side authentication.
- Administrator creation is removed from public registration and moved to a dedicated CLI command.
- OTP values are generated cryptographically, stored as HMAC hashes, expire automatically and have attempt limits.
- SMS provider credentials are read from environment variables.
- Rate limiting covers sign in, sign up, OTP, comments, contact, tickets, quote and order creation.
- Admin APIs perform role checks inside the API route.
- Ticket and wishlist ownership checks are enforced server-side.

## Phase 2: Commerce core

- Product inventory, SKU and lifecycle status are supported.
- Order and Payment models are included.
- Checkout quote recalculates product prices on the server.
- Stock is reserved atomically during order creation.
- Cancelled orders return reserved stock.
- Discount usage is consumed on order creation rather than code validation.
- Discount expiry, minimum order amount, active status and per-user limits are supported.
- Shipping cost is included in the server quote.
- User and administrator order pages use real order data.

## Phase 3: Admin and user experience

- Product create, update and delete operations are connected to the admin panel.
- User edit, role change, soft delete and ban operations are connected.
- Discount create, enable or disable and delete operations are connected.
- Article model, public article pages and admin article management are included.
- User avatar upload and removal are included.
- Password change and SMS password reset are included.
- Ticket attachments are uploaded and validated.
- Product page gallery, description, stock state and share links use real product data.
- Navbar cart and wishlist counters use real client and server state.
- Pagination is enabled for main product, user, comment, ticket, discount, article and order lists.

## Phase 4: Stability and maintenance

- Next.js is pinned to 15.5.27 and the production-hardening revision aligns the React stack with React 19.
- ESLint is invoked directly instead of `next lint`.
- Uploads verify file signatures instead of trusting browser MIME values.
- MongoDB models include indexes and length or enum constraints for key fields.
- Draft and archived products are blocked from public product APIs.
- Dashboard sales and user growth charts use database data.
- Internal JavaScript and JSX syntax and internal import resolution were checked after the changes.

## Setup

1. Run `npm install`.
2. Copy `.env.example` to `.env.local`.
3. Set MongoDB, JWT, OTP and SMS provider values.
4. Set `ADMIN_NAME`, `ADMIN_EMAIL`, `ADMIN_PHONE` and `ADMIN_PASSWORD`.
5. Run `npm run admin:create` once to create or update the administrator account.
6. Run `npm run dev` for development.
7. Run `npm run build` and `npm start` for production.

## Environment

`AccessTokenSecretKey` and `OTP_SECRET` should each contain a long random value. Do not commit `.env.local`.

Uploaded images are stored under `public/uploads`. For a serverless deployment, replace the local upload adapter with persistent object storage.

## Production hardening revision

This revision adds an additional production hardening layer after the original four phases.

- React and React DOM are aligned with React 19 and React Leaflet 5.
- Recharts is upgraded to the React 19 compatible 3.x line.
- Session cookies use a host-only secure cookie in production, HttpOnly and SameSite Strict.
- Unsafe cross-site API mutations are rejected by middleware.
- Security headers include CSP, HSTS in production, Referrer Policy, Permissions Policy and nosniff.
- OTP responses no longer disclose whether a phone number belongs to an account.
- Changing the account phone number requires verification of the new phone.
- Changing email requires reauthentication when the account has a password.
- Rate-limit increments are atomic at the MongoDB layer.
- Order creation supports idempotency keys and MongoDB transactions when the deployment supports transactions.
- Order and payment transitions are validated by a state machine.
- Orders keep recipient, tracking and status-history snapshots.
- Product deletion is now archival rather than physical deletion.
- Products support slugs, categories, brands, image alt text and galleries.
- Product pages include canonical metadata and Product structured data.
- Articles include Article structured data. The root layout includes Organization structured data.
- Sitemap and robots metadata routes are included.
- Public latest-product and latest-article queries are cached with server revalidation.
- Dashboard aggregates run inside MongoDB instead of loading all matching documents into Node.js.
- Global loading and error boundaries are included.
- A health endpoint is available at `/api/health`.
- Docker and GitHub Actions CI definitions are included.
- Node tests cover order-state rules, slug generation and security regressions.

## Existing database migration

After deploying this revision over an existing database, run:

`npm run catalog:backfill`

This fills missing product slugs without deleting or rewriting historical product ids. Old product URLs based on MongoDB ids continue to work.

For production order transactions, use MongoDB Atlas, a replica set, or a sharded cluster. A standalone MongoDB instance cannot provide multi-document transactions. The application retains compensation logic for order creation on standalone development databases, while a transaction-capable deployment is the recommended production configuration.

## Verification commands

Run these commands after dependency installation:

`npm test`

`npm run lint`

`npm run build`

`npm run check`

The project intentionally does not contain secrets. Configure `.env.local` from `.env.example` before running the application.

## Final review additions

- Discount deletion is archival so historical orders and per-user usage counters remain consistent.
- Invalid category and brand filters return an empty result instead of matching uncategorized products.
- Product and article cache tags are invalidated after admin mutations.
- Article image replacement keeps the old file until the database save succeeds.
- Malformed percent-encoded product and article URLs are decoded safely.
- Leaflet uses a local marker asset instead of the previous external marker URL.
- The production Docker image uses Next.js standalone output and runs as a non-root user.
- CI starts MongoDB before lint, test and build verification.
- The supported runtime baseline is Node.js 20 or newer.
