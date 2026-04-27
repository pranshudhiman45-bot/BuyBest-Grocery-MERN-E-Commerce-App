const nodemailer = require('nodemailer')
const env = require('../config/env.js')

const requiredEmailEnvVars = [
  ['EMAIL_USER', env.emailUser],
  ['EMAIL_CLIENT_ID (or CLIENT_ID)', env.emailClientId],
  ['EMAIL_CLIENT_SECRET (or CLIENT_SECRET)', env.emailClientSecret],
  ['EMAIL_REFRESH_TOKEN (or REFRESH_TOKEN / REFESH_TOKEN)', env.emailRefreshToken]
]

const missingEmailEnvVars = requiredEmailEnvVars
  .filter(([, value]) => !value)
  .map(([name]) => name)

const transporter = missingEmailEnvVars.length
  ? null
  : nodemailer.createTransport({
      service: 'gmail',
      auth: {
        type: 'OAuth2',
        user: env.emailUser,
        clientId: env.emailClientId,
        clientSecret: env.emailClientSecret,
        accessToken: env.emailAccessToken,
        refreshToken: env.emailRefreshToken
      }
    })

const getEmailTransportErrorMessage = (error) => {
  if (!error) {
    return 'Unknown email transport error'
  }

  if (error.code === 'EAUTH' && String(error.message || '').includes('invalid_grant')) {
    return [
      'Google rejected the Gmail OAuth refresh token (`invalid_grant`).',
      'This usually means the refresh token was revoked, expired, generated for a different OAuth client, or the Gmail account/app is still in testing mode without the sender added as a test user.',
      'Check `EMAIL_USER`, `EMAIL_CLIENT_ID`, `EMAIL_CLIENT_SECRET`, and regenerate `EMAIL_REFRESH_TOKEN` for the same Google Cloud OAuth app.'
    ].join(' ')
  }

  return error.message || String(error)
}

if (missingEmailEnvVars.length) {
  console.error(
    `Email service is disabled. Missing env vars: ${missingEmailEnvVars.join(', ')}`
  )
} else {
  transporter.verify((error) => {
    if (error) {
      console.error('Error connecting to email server:', getEmailTransportErrorMessage(error))
    } else {
      console.log('Email server is ready to send messages')
    }
  })
}

const sendEmail = async (to, subject, text, html) => {
  if (!transporter) {
    throw new Error(
      `Email transport is not configured. Missing env vars: ${missingEmailEnvVars.join(', ')}`
    )
  }

  try {
    const info = await transporter.sendMail({
      from: `"Best Buy" <${env.emailUser}>`,
      to,
      subject,
      text,
      html
    })

    console.log('Message sent: %s', info.messageId)
    return info
  } catch (error) {
    throw new Error(getEmailTransportErrorMessage(error))
  }
}

const buildEmailTemplate = ({ preheader, title, intro, body, footerNote }) => `
  <!DOCTYPE html>
  <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>${title}</title>
    </head>
    <body style="margin: 0; padding: 0; background: #f4efe6; font-family: Arial, sans-serif; color: #1f2937;">
      <div style="display: none; max-height: 0; overflow: hidden; opacity: 0;">
        ${preheader}
      </div>
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background: linear-gradient(180deg, #f7f1e8 0%, #efe4d2 100%); padding: 32px 16px;">
        <tr>
          <td align="center">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 640px; background: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 18px 45px rgba(74, 47, 24, 0.12);">
              <tr>
                <td style="background: linear-gradient(135deg, #b45309 0%, #7c2d12 100%); padding: 36px 40px; color: #fff7ed;">
                  <div style="font-size: 12px; letter-spacing: 2px; text-transform: uppercase; opacity: 0.85;">Final Project</div>
                  <h1 style="margin: 12px 0 0; font-size: 30px; line-height: 1.2; font-weight: 700;">${title}</h1>
                </td>
              </tr>
              <tr>
                <td style="padding: 36px 40px 28px;">
                  <p style="margin: 0 0 16px; font-size: 17px; line-height: 1.7;">${intro}</p>
                  ${body}
                  <p style="margin: 28px 0 0; font-size: 14px; line-height: 1.7; color: #6b7280;">
                    ${footerNote}
                  </p>
                </td>
              </tr>
              <tr>
                <td style="padding: 0 40px 32px; color: #6b7280; font-size: 13px; line-height: 1.7;">
                  Best regards,<br />
                  <strong style="color: #111827;">Final Project Team</strong>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
  </html>
`

async function sendVerificationOtpEmail(userEmail, name, otp, expiresInMinutes) {
  const subject = 'Your email verification OTP'
  const text = `Hi ${name},\n\nYour OTP for email verification is ${otp}. It will expire in ${expiresInMinutes} minutes.\n\nIf you did not create this account, please ignore this email.\n\nBest regards,\nThe Team`
  const html = buildEmailTemplate({
    preheader: `Your OTP is ${otp}. It expires in ${expiresInMinutes} minutes.`,
    title: 'Verify Your Email',
    intro: `Hi ${name}, thanks for registering. Use the OTP below to verify your email address and continue.`,
    body: `
      <div style="margin: 28px 0; padding: 28px; background: #fff7ed; border: 1px solid #fdba74; border-radius: 20px; text-align: center;">
        <div style="font-size: 13px; letter-spacing: 1.6px; text-transform: uppercase; color: #9a3412; margin-bottom: 10px;">One-Time Password</div>
        <div style="font-size: 34px; font-weight: 700; letter-spacing: 10px; color: #7c2d12;">${otp}</div>
        <div style="margin-top: 12px; font-size: 14px; color: #7c2d12;">Valid for ${expiresInMinutes} minutes</div>
      </div>
      <p style="margin: 0; font-size: 15px; line-height: 1.7; color: #374151;">
        If you did not create this account, you can safely ignore this email.
      </p>
    `,
    footerNote: 'For your security, never share this OTP with anyone.'
  })

  return sendEmail(userEmail, subject, text, html)
}

async function sendWelcomeEmail(userEmail, name) {
  const subject = 'Welcome to Our Service!'
  const text = `Hi ${name},\n\nYour email has been verified successfully and your registration is now complete.\n\nWelcome to our service. We're happy to have you with us.\n\nBest regards,\nThe Team`
  const html = buildEmailTemplate({
    preheader: 'Your registration is complete and your account is ready.',
    title: 'Welcome Aboard',
    intro: `Hi ${name}, your email has been verified successfully and your account is now ready to use.`,
    body: `
      <div style="margin: 28px 0; padding: 26px 28px; background: linear-gradient(135deg, #ecfccb 0%, #d9f99d 100%); border-radius: 20px;">
        <div style="font-size: 18px; font-weight: 700; color: #365314; margin-bottom: 10px;">Registration complete</div>
        <p style="margin: 0; font-size: 15px; line-height: 1.7; color: #3f6212;">
          You now have full access to the website. We’re happy to have you with us and excited for what you’ll build here.
        </p>
      </div>
      <p style="margin: 0; font-size: 15px; line-height: 1.7; color: #374151;">
        If you ever need help, just reach out and we’ll be glad to support you.
      </p>
    `,
    footerNote: 'Thanks for joining us and trusting our platform.'
  })

  return sendEmail(userEmail, subject, text, html)
}

async function sendPasswordResetEmail(userEmail, name, resetLink, expiresInMinutes) {
  const subject = 'Reset your password'
  const text = `Hi ${name},\n\nWe received a request to reset your password. Use the link below to set a new password:\n\n${resetLink}\n\nThis link will expire in ${expiresInMinutes} minutes.\n\nIf you did not request a password reset, you can ignore this email.\n\nBest regards,\nThe Team`
  const html = buildEmailTemplate({
    preheader: 'Use this secure link to reset your password.',
    title: 'Reset Your Password',
    intro: `Hi ${name}, we received a request to reset your password. Click the button below to choose a new one.`,
    body: `
      <div style="margin: 28px 0; text-align: center;">
        <a href="${resetLink}" style="display: inline-block; padding: 14px 28px; background: linear-gradient(135deg, #b45309 0%, #7c2d12 100%); color: #ffffff; text-decoration: none; border-radius: 999px; font-weight: 700;">
          Reset Password
        </a>
      </div>
      <p style="margin: 0 0 12px; font-size: 15px; line-height: 1.7; color: #374151;">
        This link will expire in ${expiresInMinutes} minutes.
      </p>
      <p style="margin: 0; font-size: 15px; line-height: 1.7; color: #374151; word-break: break-all;">
        If the button does not work, use this link:<br />
        <a href="${resetLink}" style="color: #9a3412;">${resetLink}</a>
      </p>
    `,
    footerNote: 'If you did not request this, you can safely ignore this email.'
  })

  return sendEmail(userEmail, subject, text, html)
}

module.exports = {
  sendVerificationOtpEmail,
  sendWelcomeEmail,
  sendPasswordResetEmail
}
