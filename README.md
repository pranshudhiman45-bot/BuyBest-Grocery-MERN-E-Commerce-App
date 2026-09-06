# Buy Best Grocery Platform

Buy Best is a full-stack grocery storefront built for realistic browsing, account, cart, address, checkout, order-history, and admin workflows.

## Applications

- `frontend/`: React 19, TypeScript, Vite 8, Tailwind CSS 4, Redux Toolkit, Axios, Socket.IO Client, and shadcn/ui
- `backend/`: Node.js, Express 5, MongoDB/Mongoose, Passport Google OAuth, JWT/cookies, Stripe, Cloudinary, Nodemailer, and Socket.IO

Roles are `user`, `admin`, and `support`.

## Working Product Flows

- Browse a persisted grocery catalog by category, subcategory, brand, price, availability, and merchandising status
- Search product names, brands, categories, subcategories, and tags
- Keep a guest cart in local storage or an authenticated cart in MongoDB
- Sign in, manage a profile and delivery addresses, and access order history
- Revalidate live price and stock on the server before checkout
- Place Cash on Delivery orders or start a real Stripe Checkout session
- Read the stored order status and cancel an order while it is still in the `placed` state
- Manage the same products, categories, inventory, coupons, and orders used by the storefront
- Create support tickets and exchange authenticated real-time messages

The application does not synthesize ratings, reviews, delivery-driver locations, sales metrics, or payment success. Stripe orders are finalized from verified Stripe events; COD orders remain explicitly COD.

## Local Setup

```bash
cd backend
npm install
cp .env.example .env
npm run dev
```

In another terminal:

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

Default local URLs are `http://localhost:3000` for the API and `http://localhost:5173` for the storefront. Set `VITE_API_URL=http://localhost:3000` for a fully local pair.

Only environment-variable names belong in the checked-in `.env.example` files. Never commit MongoDB, Google, email, Cloudinary, JWT, support-account, or Stripe secret values.

## Catalog Maintenance

The canonical realistic grocery catalog is in `backend/src/data/catalog.js`. Preview the database changes first:

```bash
cd backend
npm run catalog:sync
```

Apply them only after reviewing the dry run:

```bash
npm run catalog:sync -- --apply
```

The apply command writes a permission-restricted JSON backup to the operating system's temporary directory before changing products, categories, carts, or storefront settings.

## Validation

```bash
cd backend
npm test

cd ../frontend
npm run lint
npm run build
```

## Payment Notes

Stripe requires both `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET`. The webhook endpoint is `POST /api/payment/webhook`; without verified webhook delivery, online orders do not become paid.

For development without a payment provider, Cash on Delivery provides an honest, persistent order flow.

## Support Account

`backend/src/seed-support.js` creates or updates a support account only when `SUPPORT_EMAIL` and `SUPPORT_PASSWORD` are explicitly configured. It contains no default credentials and never prints the password.

## Deployment

- Storefront: `https://buy-best-grocery-mern-e-commerce-ap.vercel.app/`
- API: `https://buybest-grocery-mern-e-commerce-app.onrender.com`

Production CORS, cookie, OAuth callback, password-reset, Stripe webhook, and frontend API URLs must all use the deployed origins.
