const express = require('express')
const helmet = require('helmet')
const cors = require('cors')
const cookieParser = require('cookie-parser')
const passport = require('passport')
const env = require('./config/env.js')
const authRouter = require('./routes/auth.routes.js')
const productRouter = require('./routes/product.routes.js')
const cartRouter = require('./routes/cart.routes.js')
const addressRouter = require('./routes/address.routes.js')
const catagoryRouter = require('./routes/catagory.routes.js')
const couponRouter = require('./routes/coupon.routes.js')
const offerRouter = require('./routes/offer.routes.js')
const supportRouter = require('./routes/support.routes.js')

const {
  notFoundHandler,
  errorHandler
} = require('./middlewares/error.middleware.js')

const app = express()

app.use(helmet())
app.use(cors({
  origin(origin, callback) {
    if (!origin || env.corsOrigins.includes(origin)) {
      return callback(null, true)
    }

    return callback(new Error('Not allowed by CORS'))
  },
  credentials: true
}))
app.use(cookieParser())
app.use(express.json())
app.use(passport.initialize())

app.use('/api/auth', authRouter)
app.use('/api/products', productRouter)
app.use('/api/cart', cartRouter)
app.use('/api/addresses', addressRouter)
app.use('/api/catagories', catagoryRouter)
app.use('/api/coupons', couponRouter)
app.use('/api/offers', offerRouter)
app.use('/api/support', supportRouter)

app.use(notFoundHandler)
app.use(errorHandler)

module.exports = app
