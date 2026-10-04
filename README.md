# Next416 Commerce Project

Programmer: Milad Jafari Gavzan

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

- Next.js is pinned to 15.5.27.
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
