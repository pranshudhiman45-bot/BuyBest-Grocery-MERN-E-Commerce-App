const nodemailer = require('nodemailer')
const path = require('path')
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

const sendEmail = async (to, subject, text, html, attachments = []) => {
  if (!transporter) {
    throw new Error(
      `Email transport is not configured. Missing env vars: ${missingEmailEnvVars.join(', ')}`
    )
  }

  try {
    const info = await transporter.sendMail({
      from: `"Buy Best" <${env.emailUser}>`,
      to,
      subject,
      text,
      html,
      attachments
    })

    console.log('Message sent: %s', info.messageId)
    return info
  } catch (error) {
    throw new Error(getEmailTransportErrorMessage(error))
  }
}

const brandLogoPath = path.resolve(__dirname, '../../../frontend/src/assests/image.png')
const brandLogoCid = 'buybest-logo'
const brandLogoAttachment = [
  {
    filename: 'buy-best-logo.png',
    path: brandLogoPath,
    cid: brandLogoCid
  }
]

const buildEmailTemplate = ({ preheader, title, intro, body, footerNote }) => 
  `
  <!DOCTYPE html>
  <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>${title}</title>
    </head>
    <body style="margin:0; padding:0; background:#f5f1e8; font-family:Arial, sans-serif; color:#1f2937;">
      <div style="display:none; max-height:0; overflow:hidden; opacity:0; mso-hide:all;">
        ${preheader}
      </div>
      <table width="100%" cellpadding="0" cellspacing="0" style="padding:24px 16px; background:#f5f1e8;">
        <tr>
          <td align="center">
            <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px; background:#ffffff; border-radius:20px; padding:32px 28px; box-shadow:0 12px 36px rgba(15,23,42,0.08);">
              <tr>
                <td style="text-align:center; padding-bottom:20px;">
                  <img
                    src="cid:${brandLogoCid}"
                    alt="Buy Best"
                    width="64"
                    height="64"
                    style="display:block; margin:0 auto 14px; width:64px; height:64px; border-radius:18px;"
                  />
                  <div style="display:inline-block; padding:6px 12px; border-radius:999px; background:#f7f4ee; font-size:12px; font-weight:700; letter-spacing:0.08em; text-transform:uppercase; color:#6b7280;">
                    Buy Best
                  </div>
                </td>
              </tr>
              <tr>
                <td style="font-size:28px; line-height:1.2; font-weight:700; color:#111827; padding-bottom:12px; text-align:center;">
                  ${title}
                </td>
              </tr>
              <tr>
                <td style="font-size:15px; line-height:1.7; color:#6b7280; padding-bottom:24px; text-align:center;">
                  ${intro}
                </td>
              </tr>
              <tr>
                <td style="padding:24px; background:#fcfaf6; border:1px solid #eee7da; border-radius:16px; font-size:14px; color:#374151; line-height:1.7;">
                  ${body}
                </td>
              </tr>
              <tr>
                <td style="padding-top:20px; font-size:12px; line-height:1.7; color:#9ca3af; text-align:center;">
                  ${footerNote}
                </td>
              </tr>
              <tr>
                <td style="padding-top:8px; font-size:12px; color:#9ca3af; text-align:center;">
                  Buy Best Team
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
      <div style="margin:4px 0 20px; text-align:center;">
        <div style="display:inline-block; padding:16px 22px; background:#ffffff; border:1px solid #e5ded1; border-radius:14px; font-size:30px; font-weight:700; letter-spacing:8px; color:#111827;">
          ${otp}
        </div>
        <div style="margin-top:10px; font-size:13px; color:#6b7280;">
          Valid for ${expiresInMinutes} minutes
        </div>
      </div>
      <p style="margin:0; font-size:14px; color:#4b5563;">
        If you did not create this account, you can safely ignore this email.
      </p>
    `,
    footerNote: 'For your security, never share this OTP with anyone.'
  })

  return sendEmail(userEmail, subject, text, html, brandLogoAttachment)
}

async function sendWelcomeEmail(userEmail, name) {
  const subject = 'Welcome to Our Service!'
  const text = `Hi ${name},\n\nYour email has been verified successfully and your registration is now complete.\n\nWelcome to our service. We're happy to have you with us.\n\nBest regards,\nThe Team`
  const html = buildEmailTemplate({
    preheader: 'Your registration is complete and your account is ready.',
    title: 'Welcome Aboard',
    intro: `Hi ${name}, your email has been verified successfully and your account is now ready to use.`,
    body: `
      <p style="margin:0 0 12px; font-size:14px; color:#4b5563; line-height:1.7;">
        You now have full access to the website. We’re happy to have you with us and excited for what you’ll build here.
      </p>
      <p style="margin:0; font-size:14px; color:#4b5563; line-height:1.7;">
        If you ever need help, just reach out and we’ll be glad to support you.
      </p>
    `,
    footerNote: 'Thanks for joining us and trusting our platform.'
  })

  return sendEmail(userEmail, subject, text, html, brandLogoAttachment)
}

async function sendPasswordResetEmail(userEmail, name, resetLink, expiresInMinutes) {
  const subject = 'Reset your password'
  const text = `Hi ${name},\n\nWe received a request to reset your password. Use the link below to set a new password:\n\n${resetLink}\n\nThis link will expire in ${expiresInMinutes} minutes.\n\nIf you did not request a password reset, you can ignore this email.\n\nBest regards,\nThe Team`
  const html = buildEmailTemplate({
    preheader: 'Use this secure link to reset your password.',
    title: 'Reset Your Password',
    intro: `Hi ${name}, we received a request to reset your password. Click the button below to choose a new one.`,
    body: `
      <div style="margin:20px 0; text-align:center;">
        <a href="${resetLink}" style="display:inline-block; padding:12px 22px; background:#111827; color:#ffffff; text-decoration:none; border-radius:999px; font-size:14px; font-weight:700;">
          Reset Password
        </a>
      </div>
      <p style="margin:0 0 10px; font-size:13px; color:#6b7280;">
        This link will expire in ${expiresInMinutes} minutes.
      </p>
      <p style="margin:0; font-size:13px; color:#6b7280; word-break:break-all;">
        ${resetLink}
      </p>
    `,
    footerNote: 'If you did not request this, you can safely ignore this email.'
  })

  return sendEmail(userEmail, subject, text, html, brandLogoAttachment)
}

module.exports = {
  sendVerificationOtpEmail,
  sendWelcomeEmail,
  sendPasswordResetEmail
}
