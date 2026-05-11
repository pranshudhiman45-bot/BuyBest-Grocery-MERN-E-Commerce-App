const env = require('../src/config/env.js')

if (!env.stripeSecretKey) {
  console.error('Stripe secret key is missing. Set STRIPE_SECRET_KEY in backend/.env.')
  process.exit(1)
}

if (!env.stripeWebhookSecret) {
  console.error('Stripe webhook secret is missing. Set STRIPE_WEBHOOK_SECRET in backend/.env or Vercel.')
  console.error('Webhook endpoint: /api/payment/webhook')
  process.exit(1)
}

console.log('Stripe webhook config is ready.')
console.log('Webhook endpoint: /api/payment/webhook')
