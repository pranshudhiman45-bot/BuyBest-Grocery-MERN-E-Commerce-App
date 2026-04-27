const path = require('path')
const dotenv = require('dotenv')

dotenv.config({ path: path.resolve(__dirname, '../../.env') })

const corsOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean)

module.exports = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT) || 3000,
  frontendUrl:
    process.env.FRONTEND_URL ||
    corsOrigins[0] ||
    'http://localhost:5173',
  mongoUri: process.env.MONGO_URI,
  jwtSecret: process.env.JWT_SECRET,
  accessTokenSecret:
    process.env.ACCESS_TOKEN_SECRET ||
    process.env.ACCES_TOKEN_SECRET ||
    process.env.JWT_SECRET,
  refreshTokenSecret:
    process.env.REFRESH_TOKEN_SECRET ||
    process.env.REFESH_TOKEN_SECRET ||
    process.env.JWT_SECRET,
  corsOrigins,
  clientId: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET,
  emailClientId: process.env.EMAIL_CLIENT_ID || process.env.CLIENT_ID,
  emailClientSecret:
    process.env.EMAIL_CLIENT_SECRET || process.env.CLIENT_SECRET,
  emailAccessToken: process.env.EMAIL_ACCESS_TOKEN,
  emailRefreshToken:
    process.env.EMAIL_REFRESH_TOKEN ||
    process.env.REFRESH_TOKEN ||
    process.env.REFESH_TOKEN,
  emailUser: process.env.EMAIL_USER,
  cloudinaryCloudName: process.env.CLOUDINARY_CLOUD_NAME,
  cloudinaryApiKey: process.env.CLOUDINARY_API_KEY,
  cloudinaryApiSecret: process.env.CLOUDINARY_API_SECRET,
  googleCallbackUrl:
    process.env.GOOGLE_CALLBACK_URL || '/api/auth/google/callback',
  otpExpiryMinutes: Number(process.env.OTP_EXPIRY_MINUTES || 10),
  resetPasswordExpiryMinutes: Number(
    process.env.RESET_PASSWORD_EXPIRY_MINUTES || 15
  ),
  resetPasswordUrl:
    process.env.RESET_PASSWORD_URL ||
    'http://localhost:3000/reset-password'
}
