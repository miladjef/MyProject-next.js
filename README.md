# Coffee Shop Project

Programmer: miladjef

This revision includes the security and stability fixes applied to the original project, including authentication, admin authorization, OTP, ticket ownership, wishlist ownership, discounts, comments, product uploads, cart behavior, broken routes, MongoDB connection handling and Next.js 15 compatibility.

## Setup

1. Run `npm install`.
2. Copy `.env.example` to `.env.local`.
3. Set MongoDB, JWT and SMS provider values.
4. Set `INITIAL_ADMIN_EMAIL` to the email that is allowed to receive the administrator role during registration.
5. Run `npm run dev` for development or `npm run build` followed by `npm start` for production.

## Security notes

The old hard-coded SMS credentials were removed. Replace them with active credentials through environment variables. Access and refresh token secrets must be long random values. Uploaded product images accept JPEG, PNG, WebP and GIF files up to 5 MB.
