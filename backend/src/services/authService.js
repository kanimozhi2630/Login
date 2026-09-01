import prisma from '../config/database.js'
import { generateToken } from '../utils/tokenGenerator.js'
import { hashPassword } from '../utils/passwordHasher.js'
import otpService from './otpService.js'
import emailService from './emailService.js'

/**
 * Authentication Service for handling user authentication business logic
 */
class AuthService {
  constructor() {
    // Temporary storage for signup data (not production-ready)
    // In production, use Redis or encrypted session storage
    this.pendingSignups = new Map()
  }
  /**
   * Initiate signup process with OTP
   * @param {object} userData - User registration data
   * @returns {Promise<object>} Result with success status and message
   */
  async initiateSignup(userData) {
    try {
      const { name, email, password } = userData

      // Check if email already exists
      const existingUser = await prisma.user.findUnique({
        where: { email }
      })

      if (existingUser) {
        return {
          success: false,
          message: 'Email is already registered'
        }
      }

      // Store signup data temporarily (expires in 10 minutes)
      this.pendingSignups.set(email, {
        name,
        email,
        password,
        timestamp: Date.now()
      })

      // Clean up expired entries
      this.cleanupPendingSignups()

      // Create and send OTP
      const otpResult = await otpService.createAndSendOtp(email, 'SIGNUP')

      if (!otpResult.success) {
        this.pendingSignups.delete(email)
        return otpResult
      }

      return {
        success: true,
        message: 'OTP sent to your email. Please verify to complete registration.',
        email: otpResult.email
      }

    } catch (error) {
      console.error('Error initiating signup:', error)
      return {
        success: false,
        message: 'Failed to initiate signup. Please try again.'
      }
    }
  }

  /**
   * Complete signup process with OTP verification
   * @param {string} email - User's email
   * @param {string} otp - Verification OTP
   * @returns {Promise<object>} Result with success status, token, and user data
   */
  async completeSignup(email, otp) {
    try {
      // Get pending signup data
      const pendingSignup = this.pendingSignups.get(email)

      if (!pendingSignup) {
        return {
          success: false,
          message: 'Signup session expired. Please start the signup process again.'
        }
      }

      // Verify OTP
      const otpResult = await otpService.verifyOtp(email, otp, 'SIGNUP')

      if (!otpResult.success) {
        return otpResult
      }

      const { name, password } = pendingSignup

      // Hash password
      const passwordHash = await hashPassword(password)

      // Create user
      const user = await prisma.user.create({
        data: {
          name,
          email,
          passwordHash,
          emailVerified: true
        }
      })

      // Clean up pending signup data
      this.pendingSignups.delete(email)

      // Clean up OTPs
      await otpService.deleteOtpsForEmail(email)

      // Send welcome email
      await emailService.sendWelcomeEmail(email, name)

      // Generate JWT token
      const token = generateToken({ userId: user.id })

      return {
        success: true,
        message: 'Account created successfully',
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          emailVerified: user.emailVerified
        }
      }

    } catch (error) {
      console.error('Error completing signup:', error)
      return {
        success: false,
        message: 'Failed to complete signup. Please try again.'
      }
    }
  }

  /**
   * Initiate login process with OTP
   * @param {string} email - User's email
   * @returns {Promise<object>} Result with success status and message
   */
  async initiateLogin(email) {
    try {
      // Passwordless flow: accept any valid email, don't check if user exists
      // OTP verification proves email ownership
      
      // Create and send OTP
      const otpResult = await otpService.createAndSendOtp(email, 'LOGIN')

      if (!otpResult.success) {
        return otpResult
      }

      return {
        success: true,
        message: 'OTP sent to your email',
        email: otpResult.email
      }

    } catch (error) {
      console.error('Error initiating login:', error)
      return {
        success: false,
        message: 'Failed to initiate login. Please try again.'
      }
    }
  }

  /**
   * Complete login process with OTP verification
   * @param {string} email - User's email
   * @param {string} otp - Login OTP
   * @returns {Promise<object>} Result with success status, token, and user data
   */
  async completeLogin(email, otp) {
    try {
      // Verify OTP
      const otpResult = await otpService.verifyOtp(email, otp, 'LOGIN')

      if (!otpResult.success) {
        return otpResult
      }

      // Get user from database
      let user = await prisma.user.findUnique({
        where: { email }
      })

      // If user doesn't exist, create them (passwordless signup)
      if (!user) {
        user = await prisma.user.create({
          data: {
            email,
            emailVerified: true
          }
        })
        console.log(`[NEW USER] Created user for email: ${email}`)
      }

      // Clean up OTPs
      await otpService.deleteOtpsForEmail(email)

      // Generate JWT token
      const token = generateToken({ userId: user.id })

      return {
        success: true,
        message: 'Login successful',
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          emailVerified: user.emailVerified,
          isNewUser: !user.name // Flag to indicate if user needs to complete profile
        }
      }

    } catch (error) {
      console.error('Error completing login:', error)
      return {
        success: false,
        message: 'Failed to complete login. Please try again.'
      }
    }
  }

  /**
   * Resend OTP for signup or login
   * @param {string} email - User's email
   * @param {string} purpose - Purpose of OTP (SIGNUP, LOGIN)
   * @returns {Promise<object>} Result with success status and message
   */
  async resendOtp(email, purpose) {
    try {
      let userId = null

      // For login, get user ID
      if (purpose === 'LOGIN') {
        const user = await prisma.user.findUnique({
          where: { email }
        })

        if (!user) {
          return {
            success: false,
            message: 'If an account exists with this email, you will receive an OTP.'
          }
        }

        userId = user.id
      }

      // Create and send new OTP
      const otpResult = await otpService.createAndSendOtp(email, purpose, userId)

      return otpResult

    } catch (error) {
      console.error('Error resending OTP:', error)
      return {
        success: false,
        message: 'Failed to resend OTP. Please try again.'
      }
    }
  }

  /**
   * Clean up expired pending signups
   */
  cleanupPendingSignups() {
    const now = Date.now()
    const EXPIRY_TIME = 10 * 60 * 1000 // 10 minutes

    for (const [email, data] of this.pendingSignups.entries()) {
      if (now - data.timestamp > EXPIRY_TIME) {
        this.pendingSignups.delete(email)
      }
    }
  }
}

export default new AuthService()
