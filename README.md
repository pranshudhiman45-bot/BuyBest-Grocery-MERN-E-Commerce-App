# Buy Best Grocery Platform

Full-stack grocery e-commerce project for Buy Best with shopping, cart and checkout, admin inventory tools, coupons and offers, authentication, and live support chat.

## Overview

This repository contains two applications:

- `frontend/`: React + TypeScript + Vite single-page app
- `backend/`: Node.js + Express + MongoDB API with Socket.IO

Supported roles:

- `user`
- `admin`
- `support`

## Main Features

- Product catalog with filtering, search, pagination, and product details
- Guest and authenticated cart flows
- Address management for checkout
- Coupon and offer support
- Stripe Checkout for online payments
- Cash on delivery checkout flow
- JWT authentication with refresh-token support
- Google OAuth login
- OTP verification and password reset flows
- Admin inventory, category, coupon, and product management
- Live support tickets with Socket.IO

## Tech Stack

### Frontend

- React 19
- TypeScript
- Vite
- Redux Toolkit
- Tailwind CSS 4
- Axios
- Socket.IO Client
- shadcn/ui

### Backend

- Node.js
- Express 5
- MongoDB + Mongoose
- Passport + Google OAuth
- JWT authentication
- Nodemailer
- Cloudinary
- Socket.IO
- Stripe

## Project Structure

```text
Buy-Best/
├── backend/
│   ├── src/
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── src/
│   ├── package.json
│   └── vite.config.ts
└── README.md
```

## Setup

### 1. Install dependencies

```bash
cd backend && npm install
cd ../frontend && npm install
```

### 2. Configure backend environment

```bash
cp backend/.env.example backend/.env
```

Important backend variables:

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
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `OTP_EXPIRY_MINUTES`
- `RESET_PASSWORD_EXPIRY_MINUTES`
- `RESET_PASSWORD_URL`

See [backend/.env.example](/Users/pranshudhiman/Desktop/Intern%20Ship/NodeJs/E-Commerce/backend/.env.example) for the current template.

### 3. Configure frontend environment

The frontend uses:

```env
VITE_API_URL=http://localhost:3000
```

### 4. Run the apps locally

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

- frontend: `http://localhost:5173`
- backend: `http://localhost:3000`

## Stripe Notes

Online payments use Stripe Checkout.

Required backend variables:

- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`

For local webhook forwarding:

```bash
stripe listen --forward-to localhost:3000/api/payment/webhook
```

Without webhook delivery, Stripe payments may remain in a `pending` state if the customer completes payment but does not return to the frontend.

## Scripts

### Backend

- `npm run dev`
- `npm start`

### Frontend

- `npm run dev`
- `npm run build`
- `npm run lint`
- `npm run preview`

## Support Seed

There is a helper script at [backend/src/seed-support.js](/Users/pranshudhiman/Desktop/Intern%20Ship/NodeJs/E-Commerce/backend/src/seed-support.js) to create or update a support account.

Default seeded credentials for local development:

- email: `support@example.com`
- password: `password123`

## Deployment Notes

- If frontend and backend are deployed on different domains, auth cookies and CORS settings must be configured carefully.
- Socket.IO support chat should be reviewed before production use.
- Stripe webhook setup should be treated as required for reliable order completion.
- The frontend build currently passes, but lint still reports existing issues in older files.
