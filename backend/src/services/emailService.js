import nodemailer from 'nodemailer'

/**
 * Email service for sending OTPs and other emails
 */
class EmailService {
  constructor() {
    this.transporter = null
    this.fromEmail = process.env.SMTP_FROM || 'noreply@example.com'
    this.fromName = process.env.SMTP_FROM_NAME || 'Auth System'
    this.initializeTransporter()
  }

  /**
   * Initialize the email transporter
   */
  initializeTransporter() {
    try {
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT) || 587,
        secure: false, // true for 465, false for other ports
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASSWORD,
        },
      })

      // Verify connection configuration
      // Commented out to allow server to start without SMTP
      /* 
      this.transporter.verify((error, success) => {
        if (error) {
          console.error('Email service configuration error:', error.message)
          console.error('Please check your SMTP credentials in .env')
        } else {
          console.log('Email service is ready to send emails')
        }
      })
      */
    } catch (error) {
      console.error('Failed to initialize email service:', error)
    }
  }

  /**
   * Send an OTP email
   * @param {string} to - Recipient email
   * @param {string} otp - The OTP code
   * @param {string} purpose - Purpose of the OTP (SIGNUP, LOGIN)
   * @returns {Promise<boolean>} True if email sent successfully
   */
  async sendOtpEmail(to, otp, purpose = 'verification') {
    try {
      const subject = purpose === 'SIGNUP' 
        ? 'Verify your email address' 
        : 'Your login code'

      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Email Verification</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .container {
              background-color: #f9f9f9;
              border-radius: 8px;
              padding: 30px;
              text-align: center;
            }
            .otp-code {
              font-size: 32px;
              font-weight: bold;
              color: #007bff;
              letter-spacing: 8px;
              margin: 20px 0;
              background-color: #fff;
              padding: 15px;
              border-radius: 4px;
              border: 2px dashed #007bff;
            }
            .warning {
              color: #dc3545;
              font-size: 14px;
              margin-top: 20px;
            }
            .footer {
              margin-top: 30px;
              font-size: 12px;
              color: #666;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h2>${subject}</h2>
            <p>Your verification code is:</p>
            <div class="otp-code">${otp}</div>
            <p>This code will expire in 5 minutes.</p>
            <p class="warning">
              <strong>Important:</strong> Never share this code with anyone. 
              Our team will never ask for your verification code.
            </p>
            <div class="footer">
              <p>If you didn't request this code, please ignore this email.</p>
              <p>&copy; ${new Date().getFullYear()} Auth System. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `

      const info = await this.transporter.sendMail({
        from: `"${this.fromName}" <${this.fromEmail}>`,
        to,
        subject,
        html,
      })

      console.log('Email sent:', info.messageId)
      return true

    } catch (error) {
      console.error('[EMAIL SERVICE ERROR] Failed to send OTP email:', error.message)
      console.error('[EMAIL SERVICE ERROR] SMTP Config:', {
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        user: process.env.SMTP_USER ? 'SET' : 'NOT SET',
        pass: process.env.SMTP_PASSWORD ? 'SET' : 'NOT SET'
      })
      return false
    }
  }

  /**
   * Send a welcome email after successful signup
   * @param {string} to - Recipient email
   * @param {string} name - User's name
   * @returns {Promise<boolean>} True if email sent successfully
   */
  async sendWelcomeEmail(to, name) {
    try {
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Welcome</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .container {
              background-color: #f9f9f9;
              border-radius: 8px;
              padding: 30px;
              text-align: center;
            }
            .success {
              color: #28a745;
              font-size: 48px;
              margin: 20px 0;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="success">✓</div>
            <h2>Welcome to Auth System!</h2>
            <p>Hi ${name},</p>
            <p>Your account has been successfully created and verified.</p>
            <p>You can now log in and start using our services.</p>
            <p>&copy; ${new Date().getFullYear()} Auth System. All rights reserved.</p>
          </div>
        </body>
        </html>
      `

      const info = await this.transporter.sendMail({
        from: `"${this.fromName}" <${this.fromEmail}>`,
        to,
        subject: 'Welcome to Auth System',
        html,
      })

      console.log('Welcome email sent:', info.messageId)
      return true

    } catch (error) {
      console.error('Error sending welcome email:', error)
      return false
    }
  }
}

// Export singleton instance
export default new EmailService()
