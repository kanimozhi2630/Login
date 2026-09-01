import prisma from '../config/database.js'
import { generateToken } from '../utils/tokenGenerator.js'
import { hashPassword, verifyPassword } from '../utils/passwordHasher.js'
import { asyncHandler } from '../middleware/errorHandler.js'
import authService from '../services/authService.js'
import googleAuthService from '../services/googleAuthService.js'

/**
 * Initiate signup with OTP
 */
export const initiateSignup = asyncHandler(async (req, res) => {
  const { name, email, password, confirmPassword } = req.body

  // Store user data temporarily (in production, use a more secure method)
  // For this hackathon, we'll store it in memory or require client to send it back
  
  const result = await authService.initiateSignup({ name, email, password })
  
  res.status(result.success ? 200 : 400).json(result)
})

/**
 * Verify signup OTP and complete registration
 */
export const verifySignupOtp = asyncHandler(async (req, res) => {
  const { email, otp } = req.body

  const result = await authService.completeSignup(email, otp)
  
  res.status(result.success ? 200 : 400).json(result)
})

/**
 * Resend signup OTP
 */
export const resendSignupOtp = asyncHandler(async (req, res) => {
  const { email } = req.body

  const result = await authService.resendOtp(email, 'SIGNUP')
  
  res.status(result.success ? 200 : 400).json(result)
})

/**
 * Initiate login with OTP
 */
export const initiateLogin = asyncHandler(async (req, res) => {
  const { email } = req.body

  const result = await authService.initiateLogin(email)
  
  res.status(result.success ? 200 : 400).json(result)
})

/**
 * Verify login OTP and complete authentication
 */
export const verifyLoginOtp = asyncHandler(async (req, res) => {
  const { email, otp } = req.body

  const result = await authService.completeLogin(email, otp)
  
  res.status(result.success ? 200 : 400).json(result)
})

/**
 * Resend login OTP
 */
export const resendLoginOtp = asyncHandler(async (req, res) => {
  const { email } = req.body

  const result = await authService.resendOtp(email, 'LOGIN')
  
  res.status(result.success ? 200 : 400).json(result)
})

/**
 * Get current authenticated user
 */
export const getCurrentUser = asyncHandler(async (req, res) => {
  res.json({
    success: true,
    user: req.user
  })
})

/**
 * Logout user
 */
export const logout = asyncHandler(async (req, res) => {
  // In a JWT-based system, logout is handled client-side by removing the token
  // If using database-backed sessions, we would delete the session here
  
  res.json({
    success: true,
    message: 'Logged out successfully'
  })
})

/**
 * Complete user profile (add name)
 */
export const completeProfile = asyncHandler(async (req, res) => {
  const { name } = req.body
  const userId = req.user.id

  const user = await prisma.user.update({
    where: { id: userId },
    data: { name }
  })

  res.json({
    success: true,
    message: 'Profile completed successfully',
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      emailVerified: user.emailVerified
    }
  })
})

/**
 * Health check for authentication
 */
export const healthCheck = asyncHandler(async (req, res) => {
  res.json({
    success: true,
    message: 'Authentication system is operational',
    timestamp: new Date().toISOString()
  })
})

/**
 * Initiate Google OAuth flow
 */
export const initiateGoogleOAuth = asyncHandler(async (req, res) => {
  const authUrl = googleAuthService.getAuthorizationUrl()
  res.redirect(authUrl)
})

/**
 * Handle Google OAuth callback
 */
export const handleGoogleCallback = asyncHandler(async (req, res) => {
  const { code } = req.query

  if (!code) {
    return res.redirect(`${process.env.FRONTEND_URL}/login?error=google_auth_failed`)
  }

  try {
    const result = await googleAuthService.handleGoogleCallback(code)

    if (result.success) {
      // Redirect to frontend with token as query parameter
      const redirectUrl = `${process.env.FRONTEND_URL}/dashboard?token=${result.token}&user=${encodeURIComponent(JSON.stringify(result.user))}`
      res.redirect(redirectUrl)
    } else {
      res.redirect(`${process.env.FRONTEND_URL}/login?error=google_auth_failed`)
    }
  } catch (error) {
    console.error('Google callback error:', error)
    res.redirect(`${process.env.FRONTEND_URL}/login?error=google_auth_failed`)
  }
})
