const express = require('express')

const env = require('../config/env.js')
const asyncHandler = require('../utils/async-handler.js')
const AppError = require('../utils/app-error.js')
const { authMiddleware } = require('../middlewares/auth.middleware.js')
const {
  stripe,
  createStripeCheckoutSession,
  finalizeStripeSessionOrders,
  getStripeSessionStatus,
  markStripeSessionOrdersFailed
} = require('../services/checkout.service.js')

const router = express.Router()

const handleStripeWebhook = async (req, res) => {
  if (!stripe) {
    return res.status(500).json({ message: 'Stripe is not configured on the server' })
  }

  if (!env.stripeWebhookSecret) {
    return res.status(500).json({ message: 'Stripe webhook secret is missing' })
  }

  let event

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      req.headers['stripe-signature'],
      env.stripeWebhookSecret
    )
  } catch (error) {
    return res.status(400).send(`Webhook Error: ${error.message}`)
  }

  try {
    const session = event.data.object

    if (
      event.type === 'checkout.session.completed' ||
      event.type === 'checkout.session.async_payment_succeeded'
    ) {
      if (session.payment_status === 'paid') {
        await finalizeStripeSessionOrders(session.id)
        console.log(`Stripe session finalized: ${session.id}`)
      } else {
        console.log(
          `Stripe session ${session.id} completed with payment_status=${session.payment_status}; waiting for paid event.`
        )
      }
    }

    if (
      event.type === 'checkout.session.expired' ||
      event.type === 'checkout.session.async_payment_failed'
    ) {
      await markStripeSessionOrdersFailed(session.id)
      console.log(`Stripe session marked failed: ${session.id}`)
    }
  } catch (error) {
    console.error(error)
    return res.status(error.statusCode || 500).json({ message: error.message || 'Webhook processing failed' })
  }

  return res.json({ received: true })
}

router.use(authMiddleware)

router.post('/create-checkout-session', asyncHandler(async (req, res) => {
  const { paymentMethod = 'credit_card', addressId, couponCode } = req.body

  if (paymentMethod !== 'credit_card' && paymentMethod !== 'upi') {
    throw new AppError('Stripe checkout is available only for online payments', 400)
  }

  const session = await createStripeCheckoutSession(req.user, {
    addressId,
    couponCode,
    paymentMethod
  })

  res.status(200).json(session)
}))

router.get('/session-status/:sessionId', asyncHandler(async (req, res) => {
  const session = await getStripeSessionStatus(req.params.sessionId)

  if (session.metadata?.userId !== req.user._id.toString()) {
    throw new AppError('This Stripe session does not belong to the current user', 403)
  }

  if (session.payment_status === 'paid') {
    await finalizeStripeSessionOrders(session.id)
  } else if (session.status === 'expired') {
    await markStripeSessionOrdersFailed(session.id)
  }

  res.status(200).json({
    sessionId: session.id,
    status: session.status,
    paymentStatus: session.payment_status
  })
}))

module.exports = router
module.exports.handleStripeWebhook = handleStripeWebhook
