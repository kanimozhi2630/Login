import prisma from '../config/database.js'
import { generateOtp } from '../utils/otpGenerator.js'
import { hashOtp, verifyOtp } from '../utils/passwordHasher.js'
import emailService from './emailService.js'

const OTP_EXPIRY_MINUTES = parseInt(process.env.OTP_EXPIRY_MINUTES) || 5
const OTP_MAX_ATTEMPTS = parseInt(process.env.OTP_MAX_ATTEMPTS) || 3
const OTP_RESEND_COOLDOWN_SECONDS = parseInt(process.env.OTP_RESEND_COOLDOWN_SECONDS) || 60

/**
 * OTP Service for handling OTP generation, storage, and validation
 */
class OtpService {
  /**
   * Create and send an OTP for a specific purpose
   * @param {string} email - User's email
   * @param {string} purpose - Purpose of OTP (SIGNUP, LOGIN)
   * @param {string} userId - Optional user ID (for login OTPs)
   * @returns {Promise<object>} Result with success status and message
   */
  async createAndSendOtp(email, purpose, userId = null) {
    try {
      // Check for resend cooldown
      const cooldownResult = await this.checkResendCooldown(email, purpose)
      if (!cooldownResult.canSend) {
        return {
          success: false,
          message: `Please wait ${cooldownResult.remainingSeconds} seconds before requesting another OTP`
        }
      }

      // Generate secure OTP
      const otp = generateOtp()
      
      // Hash the OTP before storing
      const otpHash = await hashOtp(otp)
      
      // Calculate expiration time
      const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000)

      // Store OTP in database
      await prisma.otpVerification.create({
        data: {
          email,
          otpHash,
          purpose,
          expiresAt,
          userId,
          attempts: 0,
          verified: false
        }
      })

      // Send OTP via email
      const emailSent = await emailService.sendOtpEmail(email, otp, purpose)
      
      if (!emailSent) {
        return {
          success: false,
          message: 'Failed to send OTP email. Please try again.'
        }
      }

      return {
        success: true,
        message: 'OTP sent successfully',
        email // Return email for frontend use
      }

    } catch (error) {
      console.error('Error creating OTP:', error)
      return {
        success: false,
        message: 'Failed to create OTP. Please try again.'
      }
    }
  }

  /**
   * Verify an OTP
   * @param {string} email - User's email
   * @param {string} otp - OTP to verify
   * @param {string} purpose - Purpose of OTP (SIGNUP, LOGIN)
   * @returns {Promise<object>} Result with success status and user data if valid
   */
  async verifyOtp(email, otp, purpose) {
    try {
      // Find the most recent unverified OTP for this email and purpose
      const otpRecord = await prisma.otpVerification.findFirst({
        where: {
          email,
          purpose,
          verified: false
        },
        orderBy: {
          createdAt: 'desc'
        }
      })

      if (!otpRecord) {
        return {
          success: false,
          message: 'No valid OTP found. Please request a new OTP.'
        }
      }

      // Check if OTP has expired
      if (new Date() > otpRecord.expiresAt) {
        return {
          success: false,
          message: 'OTP has expired. Please request a new OTP.'
        }
      }

      // Check if maximum attempts reached
      if (otpRecord.attempts >= OTP_MAX_ATTEMPTS) {
        return {
          success: false,
          message: 'Maximum OTP attempts reached. Please request a new OTP.'
        }
      }

      // Verify the OTP
      const isValid = await verifyOtp(otpRecord.otpHash, otp)

      if (!isValid) {
        // Increment attempt count
        await prisma.otpVerification.update({
          where: { id: otpRecord.id },
          data: { attempts: otpRecord.attempts + 1 }
        })

        const remainingAttempts = OTP_MAX_ATTEMPTS - otpRecord.attempts - 1
        return {
          success: false,
          message: `Invalid OTP. ${remainingAttempts} attempts remaining.`
        }
      }

      // Mark OTP as verified
      await prisma.otpVerification.update({
        where: { id: otpRecord.id },
        data: { verified: true }
      })

      return {
        success: true,
        message: 'OTP verified successfully',
        otpRecord
      }

    } catch (error) {
      console.error('Error verifying OTP:', error)
      return {
        success: false,
        message: 'Failed to verify OTP. Please try again.'
      }
    }
  }

  /**
   * Check if user can request a new OTP (resend cooldown)
   * @param {string} email - User's email
   * @param {string} purpose - Purpose of OTP
   * @returns {Promise<object>} Cooldown status
   */
  async checkResendCooldown(email, purpose) {
    try {
      // Find the most recent OTP for this email and purpose
      const recentOtp = await prisma.otpVerification.findFirst({
        where: {
          email,
          purpose
        },
        orderBy: {
          createdAt: 'desc'
        }
      })

      if (!recentOtp) {
        return { canSend: true, remainingSeconds: 0 }
      }

      // Calculate time since last OTP
      const timeSinceLastOtp = Date.now() - recentOtp.createdAt.getTime()
      const cooldownMs = OTP_RESEND_COOLDOWN_SECONDS * 1000

      if (timeSinceLastOtp < cooldownMs) {
        const remainingSeconds = Math.ceil((cooldownMs - timeSinceLastOtp) / 1000)
        return { canSend: false, remainingSeconds }
      }

      return { canSend: true, remainingSeconds: 0 }

    } catch (error) {
      console.error('Error checking resend cooldown:', error)
      return { canSend: true, remainingSeconds: 0 } // Allow sending on error
    }
  }

  /**
   * Clean up expired OTPs (should be run periodically)
   * @returns {Promise<number>} Number of deleted records
   */
  async cleanupExpiredOtps() {
    try {
      const result = await prisma.otpVerification.deleteMany({
        where: {
          expiresAt: {
            lt: new Date()
          }
        }
      })

      console.log(`Cleaned up ${result.count} expired OTPs`)
      return result.count

    } catch (error) {
      console.error('Error cleaning up expired OTPs:', error)
      return 0
    }
  }

  /**
   * Delete all OTPs for a specific email (useful after successful verification)
   * @param {string} email - User's email
   * @returns {Promise<number>} Number of deleted records
   */
  async deleteOtpsForEmail(email) {
    try {
      const result = await prisma.otpVerification.deleteMany({
        where: { email }
      })

      return result.count

    } catch (error) {
      console.error('Error deleting OTPs for email:', error)
      return 0
    }
  }
}

export default new OtpService()
