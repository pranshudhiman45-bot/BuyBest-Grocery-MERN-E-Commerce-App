# Buy Best Frontend

React 19 + TypeScript + Vite storefront for Buy Best.

## Customer Experience

- Responsive catalog with real search, category shortcuts, filters, sorting, availability, and product details
- Persistent guest cart and MongoDB-backed signed-in cart
- Touch-friendly quantity controls, addresses, coupon input, checkout, and order confirmation
- Account profile, saved addresses, actual order history, order details, and stored status
- Mobile bottom navigation for Home, Categories, Search, Cart, and Account
- Honest loading, error, empty, stock, payment, and signed-out states

The role-aware application also includes product/category/inventory/coupon/order administration and support-ticket views.

## Setup

```bash
npm install
cp .env.example .env
npm run dev
```

Set `VITE_API_URL=http://localhost:3000` for local development. Only the variable name is committed; keep environment-specific values outside source control.

## Validation

```bash
npm run lint
npm run build
```

The main storefront uses a Redux app shell in `src/App.tsx`. Axios clients send credentials and attempt the backend refresh flow for eligible expired sessions. Stripe payment status still depends on the backend's verified webhook state.

Production storefront: `https://buy-best-grocery-mern-e-commerce-ap.vercel.app/`
