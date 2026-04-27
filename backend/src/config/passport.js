const passport = require('passport')
const GoogleStrategy = require('passport-google-oauth20').Strategy
const env = require('./env.js')

passport.use(
  new GoogleStrategy(
    {
      clientID: env.clientId,
      clientSecret: env.clientSecret,
      callbackURL: env.googleCallbackUrl
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const primaryEmail = profile.emails?.[0]?.value

        if (!primaryEmail) {
          return done(new Error('Google account email is not available'), null)
        }

        return done(null, {
          googleId: profile.id,
          email: primaryEmail.toLowerCase().trim(),
          name: profile.displayName || 'Google User',
          authProvider: 'google'
        })
      } catch (error) {
        return done(error, null)
      }
    }
  )
)

module.exports = passport
