import express from 'express'
import { authenticate } from '../middleware/authMiddleware.js'
import { createRateLimiter } from '../middleware/rateLimiter.js'
import { signupValidation, emailValidation, otpValidation } from '../utils/validators.js'
import * as authController from '../controllers/authController.js'

// Create rate limiters for auth endpoints
const authRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per 15 minutes
  message: 'Too many authentication attempts, please try again later.'
})

const otpRateLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 3, // 3 requests per minute
  message: 'Too many OTP requests, please wait before trying again.'
})

const router = express.Router()

// Public routes
router.get('/health', authController.healthCheck)

// Signup routes (with stricter rate limiting)
router.post('/signup', authRateLimiter, signupValidation, authController.initiateSignup)
router.post('/send-signup-otp', otpRateLimiter, emailValidation, authController.resendSignupOtp)
router.post('/verify-signup-otp', authRateLimiter, otpValidation, authController.verifySignupOtp)

// Login routes (with stricter rate limiting)
router.post('/send-login-otp', otpRateLimiter, emailValidation, authController.initiateLogin)
router.post('/verify-login-otp', authRateLimiter, otpValidation, authController.verifyLoginOtp)

// Google OAuth routes
router.get('/google', authController.initiateGoogleOAuth)
router.get('/google/callback', authController.handleGoogleCallback)

// Protected routes
router.get('/me', authenticate, authController.getCurrentUser)
router.post('/logout', authenticate, authController.logout)
router.post('/complete-profile', authenticate, authController.completeProfile)

export default router
