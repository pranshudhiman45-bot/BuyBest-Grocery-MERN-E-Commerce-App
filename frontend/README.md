# Buy Best Frontend

React + TypeScript + Vite frontend for the Buy Best grocery e-commerce platform.

## Features

- Product browsing and product detail pages
- Guest and authenticated cart flows
- Checkout page with coupon support
- Stripe Checkout redirect for online payments
- Role-aware views for users, admins, and support staff
- Live support chat with Socket.IO
- Responsive UI across desktop and mobile

## Stack

- React 19
- TypeScript
- Vite
- Tailwind CSS 4
- Redux Toolkit
- Axios
- Socket.IO Client
- shadcn/ui

## Setup

### Install

```bash
npm install
```

### Environment

By default, the frontend points to `http://localhost:3000`.

Optional variable:

```env
VITE_API_URL=http://localhost:3000
```

### Run

Development:

```bash
npm run dev
```

Production build:

```bash
npm run build
```

Preview build:

```bash
npm run preview
```

Default local frontend URL:

- `http://localhost:5173`

## Production Notes

- The frontend makes credentialed API requests, so backend CORS and cookie settings must match your deployment setup.
- Stripe payment completion depends on the backend Stripe configuration and webhook delivery.
- Support chat depends on the backend Socket.IO server being reachable from the deployed frontend.
