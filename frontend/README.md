# Buy Best Frontend

React + TypeScript + Vite frontend for the Buy Best grocery e-commerce experience, including storefront, checkout, admin views, and support chat.

## Stack

- React 19
- TypeScript
- Vite
- Tailwind CSS 4
- Redux Toolkit
- Axios
- Socket.IO Client
- shadcn/ui
- Framer Motion

## Current UI Areas

- Home storefront with category-driven browsing
- Product details
- Cart and checkout
- Offers page
- About page
- Login and registration modal flow
- Forgot-password and reset-password flow
- Admin panel
- User support page
- Support agent panel

## Local Setup

Install dependencies:

```bash
npm install
```

Create a local env file:

```bash
cp .env.example .env
```

Frontend env value:

```env
VITE_API_URL=http://localhost:3000
```

For your deployed backend, this can be set to:

```env
VITE_API_URL=https://buybest-grocery-mern-e-commerce-app.onrender.com
```

If `VITE_API_URL` is not provided, the app falls back to `http://localhost:3000`.

Run locally:

```bash
npm run dev
```

Build for production:

```bash
npm run build
```

Preview a production build:

```bash
npm run preview
```

Default local frontend URL:

- `http://localhost:5173`

## How The Frontend Talks To The Backend

- API calls are made with Axios using `withCredentials: true`
- The app automatically attempts token refresh on eligible `401` responses
- Auth state is also mirrored in local storage for the current user shell experience
- Support chat depends on the backend Socket.IO server and authenticated cookies

## Key Integration Expectations

- Backend base URL should match `VITE_API_URL`
- Backend CORS must allow the frontend origin
- Backend cookies must support cross-origin requests if frontend and backend are deployed separately
- Stripe payment completion still depends on the backend webhook being configured correctly

## Available Scripts

- `npm run dev`
- `npm run build`
- `npm run lint`
- `npm run preview`

## Maintenance Notes

- Routing is app-shell driven inside [src/App.tsx](/Users/pranshudhiman/Desktop/Intern Ship/NodeJs/E-Commerce/frontend/src/App.tsx) rather than using a traditional multi-page React Router setup for the main storefront flow.
- The app contains role-aware views for regular users, admins, and support staff.
- Keep `.env` local and use [frontend/.env.example](/Users/pranshudhiman/Desktop/Intern Ship/NodeJs/E-Commerce/frontend/.env.example) as the shared template.
- `npm run build` is the best quick validation for the frontend; linting may still surface pre-existing issues in older files depending on current branch state.
