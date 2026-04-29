# Buy Best Grocery Platform

Full-stack grocery e-commerce app with a React frontend, an Express + MongoDB backend, Stripe checkout, role-based access, and real-time support chat.

## What Is In This Repo

- `frontend/`: React 19 + TypeScript + Vite storefront and admin UI
- `backend/`: Express 5 + MongoDB API with Socket.IO and Stripe integration

Supported roles:

- `user`
- `admin`
- `support`

## Current Feature Set

- Product browsing, search, filtering, and product detail pages
- Guest and authenticated cart flows
- Address management during checkout
- Coupons, offers, and basic storefront settings
- Cash on delivery and Stripe Checkout payment flows
- Email/password auth with OTP verification
- Refresh-token based session handling with cookies
- Google OAuth login
- Forgot-password and reset-password flows
- Admin product, category, coupon, offer, and inventory tooling
- Support tickets with real-time chat for users and support agents

## Tech Stack

### Frontend

- React 19
- TypeScript
- Vite
- Tailwind CSS 4
- Redux Toolkit
- Axios
- Socket.IO Client
- shadcn/ui

### Backend

- Node.js
- Express 5
- MongoDB + Mongoose
- Passport Google OAuth
- JWT + cookie-based auth
- Nodemailer
- Cloudinary
- Socket.IO
- Stripe

## Project Structure

```text
E-Commerce/
├── backend/
│   ├── src/
│   ├── .env.example
│   ├── package.json
│   └── README.md
├── frontend/
│   ├── src/
│   ├── package.json
│   └── README.md
└── README.md
```

## Local Setup

### 1. Install dependencies

```bash
cd backend
npm install

cd ../frontend
npm install
```

### 2. Configure the backend

Create the backend environment file:

```bash
cp backend/.env.example backend/.env
```

Important variables include:

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

Reference: [backend/.env.example](/Users/pranshudhiman/Desktop/Intern Ship/NodeJs/E-Commerce/backend/.env.example)

### 3. Configure the frontend

The frontend uses one optional env variable:

```env
VITE_API_URL=http://localhost:3000
```

If omitted, it defaults to `http://localhost:3000`.

### 4. Start both apps

Backend:

```bash
cd backend
npm run dev
```

Frontend:

```bash
cd frontend
npm run dev
```

Default local URLs:

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:3000`

## Key Flows

### Authentication

- Login, registration, OTP verification, logout, current-user, refresh-token
- Google OAuth redirect flow
- Password reset via email token
- Session refresh is handled automatically by the frontend Axios clients

### Shopping And Checkout

- Product listing, search, and product detail APIs
- Cart add/update/remove flows
- Address selection and management
- Coupon application
- Cash on delivery checkout
- Stripe Checkout session creation and payment webhook confirmation

### Support

- Users can create and manage support tickets
- Support agents can respond in a dedicated support panel
- Live messaging runs over Socket.IO and uses the auth cookie for socket authentication

## Stripe Notes

Stripe webhook endpoint:

- `POST /api/payment/webhook`

Required variables:

- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`

Local forwarding example:

```bash
stripe listen --forward-to localhost:3000/api/payment/webhook
```

Without webhook delivery, Stripe-backed orders may not finalize correctly.

## Helpful Scripts

### Backend

- `npm run dev`
- `npm start`
- `npm test` currently exits with the default placeholder script

### Frontend

- `npm run dev`
- `npm run build`
- `npm run lint`
- `npm run preview`

## Support Seed

There is a helper script at [backend/src/seed-support.js](/Users/pranshudhiman/Desktop/Intern Ship/NodeJs/E-Commerce/backend/src/seed-support.js) for creating or updating a local support account.

Current default development credentials:

- Email: `support@example.com`
- Password: `password123`

## Notes For Maintenance

- Some backend route and file names intentionally use `catagory` instead of `category`; docs keep the public route names as implemented.
- The frontend expects credentialed API requests, so cookie, CORS, and frontend/backend origin settings must stay aligned.
- Socket.IO support chat uses the same backend server and validates the access-token cookie during connection.
- `RESET_PASSWORD_URL` should point to the frontend reset-password page, usually `http://localhost:5173/reset-password` in local development.
