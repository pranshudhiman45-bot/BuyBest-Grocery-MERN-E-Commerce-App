const mongoose = require('mongoose')
const bcrypt = require('bcrypt')
const { AUTH_PROVIDERS, USER_ROLES } = require('../constants/auth.constants.js')

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, 'Please provide email'],
      unique: [true, 'Email already exists'],
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        'Please provide a valid email'
      ],
      lowercase: true,
      trim: true
    },
    pendingEmail: {
      type: String
    },
    emailVerifyOtp: {
      type: String
    },
    emailVerifyOtpExpire: {
      type: Date
    },
    name: {
      type: String,
      required: [true, 'Please provide name']
    },
    password: {
      type: String,
      minlength: [6, 'Password must be at least 6 characters long'],
      select: false,
      default: null
    },
    avatar: {
      type: String,
      default: null
    },
    avatarPublicId: {
      type: String,
      default: null
    },
    mobile: {
      type: Number,
      default: null
    },
    role: {
      type: String,
      enum: Object.values(USER_ROLES),
      default: USER_ROLES.USER
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'suspended'],
      default: 'active'
    },
    addresDetails: {
      type: mongoose.Schema.ObjectId,
      ref: 'address'
    },
    shopingCart: {
      type: mongoose.Schema.ObjectId,
      ref: 'cart'
    },
    orderHistory: [
      {
        type: mongoose.Schema.ObjectId,
        ref: 'order'
      }
    ],
    authProvider: {
      type: String,
      enum: Object.values(AUTH_PROVIDERS),
      default: AUTH_PROVIDERS.LOCAL
    },
    googleId: {
      type: String,
      default: null
    },
    lastLoginDate: {
      type: Date,
      default: null
    },
    isVerified: {
      type: Boolean,
      default: false
    },
    otpCode: {
      type: String,
      select: false,
      default: null
    },
    otpExpiresAt: {
      type: Date,
      default: null
    },
    resetPasswordToken: {
      type: String,
      select: false,
      default: null
    },
    refreshToken: {
      type: String,
      select: false,
      default: null
    },
    resetPasswordExpiresAt: {
      type: Date,
      default: null
    }
  },
  { timestamps: true }
)

userSchema.path('password').validate(function validatePassword (value) {
  if (this.authProvider === AUTH_PROVIDERS.GOOGLE) {
    return true
  }

  return typeof value === 'string' && value.length >= 6
}, 'Please provide password')

userSchema.pre('save', async function () {
  if (!this.password || !this.isModified('password')) {
    return
  }

  const salt = await bcrypt.genSalt(10)
  this.password = await bcrypt.hash(this.password, salt)
})

userSchema.methods.comparePassword = async function (password) {
  if (!this.password) {
    return false
  }

  return bcrypt.compare(password, this.password)
}

const userModel = mongoose.model('user', userSchema)

module.exports = userModel
