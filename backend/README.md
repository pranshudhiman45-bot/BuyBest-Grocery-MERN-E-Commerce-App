# Buy Best Backend API

Express + MongoDB backend for the Buy Best grocery storefront, checkout flow, authentication system, and support chat.

## Stack

- Node.js
- Express 5
- MongoDB with Mongoose
- Passport Google OAuth
- JWT + cookie-based auth
- Nodemailer
- Cloudinary
- Socket.IO
- Stripe

## What This Service Handles

- User registration, login, OTP verification, logout, and token refresh
- Google OAuth login flow
- Forgot-password and reset-password flows
- Product catalog APIs and product search
- Category, coupon, and offer management
- Cart APIs and checkout preparation
- Address CRUD for delivery
- App settings and inventory-related admin data
- Stripe Checkout session creation and webhook processing
- Support tickets and real-time support messaging

## API Mount Points

The server currently mounts these route groups:

- `/api/auth`
- `/api/products`
- `/api/cart`
- `/api/addresses`
- `/api/catagories`
- `/api/coupons`
- `/api/offers`
- `/api/support`
- `/api/settings`
- `/api/payment`

Stripe webhook endpoint:

- `POST /api/payment/webhook`

## Environment Setup

Install dependencies:

```bash
npm install
```

Create the env file:

```bash
cp .env.example .env
```

Important variables:

- `PORT`
- `MONGO_URI`
- `CORS_ORIGIN`
- `FRONTEND_URL`
- `ACCESS_TOKEN_SECRET`
- `REFRESH_TOKEN_SECRET`
- `JWT_SECRET`
- `CLIENT_ID`
- `CLIENT_SECRET`
- `GOOGLE_CALLBACK_URL`
- `EMAIL_USER`
- `EMAIL_CLIENT_ID`
- `EMAIL_CLIENT_SECRET`
- `EMAIL_REFRESH_TOKEN`
- `EMAIL_ACCESS_TOKEN`
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `OTP_EXPIRY_MINUTES`
- `RESET_PASSWORD_EXPIRY_MINUTES`
- `RESET_PASSWORD_URL`

Current deployment example:

```env
CORS_ORIGIN=https://buy-best-grocery-mern-e-commerce-ap.vercel.app,http://localhost:5173
FRONTEND_URL=https://buy-best-grocery-mern-e-commerce-ap.vercel.app
RESET_PASSWORD_URL=https://buy-best-grocery-mern-e-commerce-ap.vercel.app/reset-password
GOOGLE_CALLBACK_URL=https://buybest-grocery-mern-e-commerce-app.onrender.com/api/auth/google/callback
```

Default local API URL:

- `http://localhost:3000`

## Running The Server

Development:

```bash
npm run dev
```

Production:

```bash
npm start
```

## Auth And Sessions

- Browser clients authenticate with cookies and call the refresh endpoint when access tokens expire.
- In production, the backend requires dedicated `ACCESS_TOKEN_SECRET` and `REFRESH_TOKEN_SECRET` values.
- Socket.IO connections also rely on the access-token cookie for authentication.

## Stripe

Stripe Checkout is used for online payments.

Required variables:

- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`

Local webhook forwarding example:

```bash
stripe listen --forward-to localhost:3000/api/payment/webhook
```

If webhook delivery is missing, payment completion state can drift from the actual Stripe session result.

## Support Chat

- Socket.IO is initialized on the same HTTP server as the REST API.
- Support agents join a dedicated support room automatically.
- Ticket rooms are protected so only the ticket owner or a support agent can join and send messages.

## Operational Notes

- `CORS_ORIGIN` accepts a comma-separated list and is parsed into the allowed origin list.
- The public route is `/api/catagories` because that is how it is currently implemented in the codebase.
- `npm test` is still the default placeholder script and does not run an automated backend test suite yet.
- The seed helper at [src/seed-support.js](/Users/pranshudhiman/Desktop/Intern Ship/NodeJs/E-Commerce/backend/src/seed-support.js) can create or update the local support account.
- Current production backend URL: `https://buybest-grocery-mern-e-commerce-app.onrender.com`
