# Buy Best Backend

Express 5 and MongoDB API for the Buy Best storefront, authentication, checkout, order management, admin tools, and support chat.

## API Groups

- `/api/auth` — registration, OTP verification, login, refresh, logout, Google OAuth, password reset, and profile
- `/api/products` — catalog listing, search, details, and admin product management
- `/api/catagories` — persisted category management (the legacy spelling is retained for compatibility)
- `/api/cart` — authenticated add, update, remove, list, and clear operations
- `/api/addresses` — user-owned delivery-address CRUD
- `/api/coupons` — persisted promotional data shown on the Offers page and at checkout
- `/api/payment` — COD checkout, Stripe Checkout, session status, cancellation, and webhook processing
- `/api/orders` — user order history/detail/cancellation and admin status management
- `/api/settings` — persisted storefront settings
- `/api/support` — user tickets and support-agent workflows

## Safety Properties

- Checkout rebuilds totals from current MongoDB products instead of trusting client or cart snapshot prices.
- Stock is reserved for created orders and restored if an eligible order is cancelled.
- Order items retain product snapshots so history remains readable after catalog edits.
- User order endpoints enforce ownership; admin order updates enforce role and status-transition rules.
- Address mobile and postal codes are validated before persistence.
- Stripe completion is based on verified webhook/session state, not a client-side success timer.

## Setup

```bash
npm install
cp .env.example .env
npm run dev
```

Use `.env.example` as the authoritative list of required variable names. Store values only in an ignored `.env` or deployment secret manager.

## Scripts

- `npm run dev` — development server with Node watch mode
- `npm start` — production server
- `npm test` — Node test suite, including catalog quality checks
- `npm run catalog:sync` — dry-run the canonical catalog synchronization
- `npm run catalog:sync -- --apply` — back up and apply catalog synchronization
- `npm run check:socket` — support socket diagnostic
- `npm run check:stripe-webhook` — Stripe webhook diagnostic
- `npm run check:stripe-flow` — Stripe flow diagnostic

## External Integrations

- Google OAuth requires client credentials and the exact deployed callback URL.
- Email OTP/reset delivery uses the configured Gmail API or mail provider credentials.
- Cloudinary is used by admin image upload flows.
- Stripe Checkout requires a secret key and verified webhook secret.
- Socket.IO shares the API server and authenticates ticket-room access.

Production API: `https://buybest-grocery-mern-e-commerce-app.onrender.com`
