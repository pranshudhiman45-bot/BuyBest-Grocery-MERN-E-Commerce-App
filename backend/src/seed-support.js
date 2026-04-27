const mongoose = require('mongoose')
const env = require('./config/env.js')
const User = require('./models/user.model.js')
const { USER_ROLES } = require('./constants/auth.constants.js')

const seedSupportUser = async () => {
  try {
    await mongoose.connect(env.mongoUri)
    console.log('Connected to MongoDB for seeding.')

    const email = 'support@example.com'
    const existing = await User.findOne({ email })
    if (existing) {
      existing.role = USER_ROLES.SUPPORT
      await existing.save()
      console.log('Support user already existed. Ensured role is set to support.')
    } else {
      const supportUser = new User({
        name: 'Technical Support',
        email,
        password: 'password123',
        role: USER_ROLES.SUPPORT,
        isVerified: true
      })
      await supportUser.save()
      console.log('Created new support user: support@example.com / password123')
    }

    process.exit(0)
  } catch (error) {
    console.error('Seeding error:', error)
    process.exit(1)
  }
}

seedSupportUser()
