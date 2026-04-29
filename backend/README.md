# Buy Best Backend API

Express + MongoDB backend for the Buy Best grocery e-commerce platform.

## Stack

- Node.js
- Express 5
- MongoDB with Mongoose
- JWT auth with refresh tokens
- Passport Google OAuth
- Socket.IO
- Nodemailer
- Cloudinary
- Stripe

## Main Responsibilities

- Authentication and user profile APIs
- Product, category, and coupon management
- Cart and checkout APIs
- Address management
- Stripe Checkout session creation and payment verification
- Support ticket APIs
- Real-time support messaging with Socket.IO

## Setup

### Install

```bash
npm install
```

### Environment

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
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`

### Run

Development:

```bash
npm run dev
```

Production:

```bash
npm start
```

Default local API URL:

- `http://localhost:3000`

## Stripe

Stripe Checkout is used for online payments.

Webhook endpoint:

- `/api/payment/webhook`

For reliable order completion in production, configure:

- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`

Local webhook forwarding example:

```bash
stripe listen --forward-to localhost:3000/api/payment/webhook
```

## Notes

- This backend expects the frontend origin to be allowed through `CORS_ORIGIN`.
- If frontend and backend are deployed on different domains, cookie and CORS configuration must be reviewed carefully.
- Socket support chat works over the same HTTP server used by the REST API.
