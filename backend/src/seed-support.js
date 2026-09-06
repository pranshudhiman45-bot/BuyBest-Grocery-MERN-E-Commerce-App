const mongoose = require('mongoose')
const env = require('./config/env.js')
const User = require('./models/user.model.js')
const { USER_ROLES } = require('./constants/auth.constants.js')

const seedSupportUser = async () => {
  try {
    if (!env.supportEmail || !env.supportPassword) {
      throw new Error('SUPPORT_EMAIL and SUPPORT_PASSWORD are required to seed a support account.')
    }

    if (env.supportPassword.length < 12) {
      throw new Error('SUPPORT_PASSWORD must contain at least 12 characters.')
    }

    await mongoose.connect(env.mongoUri)
    console.log('Connected to MongoDB for seeding.')

    const email = env.supportEmail.trim().toLowerCase()
    const existing = await User.findOne({ email })
    if (existing) {
      existing.role = USER_ROLES.SUPPORT
      await existing.save()
      console.log('Support user already existed. Ensured role is set to support.')
    } else {
      const supportUser = new User({
        name: 'Technical Support',
        email,
        password: env.supportPassword,
        role: USER_ROLES.SUPPORT,
        isVerified: true
      })
      await supportUser.save()
      console.log(`Created support user: ${email}`)
    }

    process.exit(0)
  } catch (error) {
    console.error('Seeding error:', error)
    process.exit(1)
  }
}

seedSupportUser()
