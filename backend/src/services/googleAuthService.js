import { OAuth2Client } from 'google-auth-library'
import prisma from '../config/database.js'
import { generateToken } from '../utils/tokenGenerator.js'

class GoogleAuthService {
  constructor() {
    this.oauth2Client = new OAuth2Client(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_CALLBACK_URL
    )
  }

  /**
   * Generate Google OAuth authorization URL
   * @returns {string} Authorization URL
   */
  getAuthorizationUrl() {
    const scopes = [
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile'
    ]

    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      prompt: 'consent'
    })
  }

  /**
   * Exchange authorization code for tokens and verify user
   * @param {string} code - Authorization code from Google
   * @returns {Promise<object>} User data and tokens
   */
  async exchangeCodeForTokens(code) {
    try {
      const { tokens } = await this.oauth2Client.getToken(code)
      this.oauth2Client.setCredentials(tokens)

      // Verify the ID token
      const ticket = await this.oauth2Client.verifyIdToken({
        idToken: tokens.id_token,
        audience: process.env.GOOGLE_CLIENT_ID
      })

      const payload = ticket.getPayload()
      
      return {
        googleId: payload.sub,
        email: payload.email,
        name: payload.name,
        emailVerified: payload.email_verified,
        picture: payload.picture
      }
    } catch (error) {
      console.error('Google token exchange error:', error)
      throw new Error('Failed to exchange authorization code for tokens')
    }
  }

  /**
   * Handle Google OAuth callback - find or create user
   * @param {string} code - Authorization code from Google
   * @returns {Promise<object>} Result with token and user data
   */
  async handleGoogleCallback(code) {
    try {
      // Exchange code for user data
      const googleUserData = await this.exchangeCodeForTokens(code)

      // Check if OAuth account already exists
      let oauthAccount = await prisma.oAuthAccount.findUnique({
        where: {
          providerAccountId: googleUserData.googleId
        },
        include: {
          user: true
        }
      })

      // If OAuth account exists, login the user
      if (oauthAccount) {
        const token = generateToken({ userId: oauthAccount.user.id })
        
        return {
          success: true,
          token,
          user: {
            id: oauthAccount.user.id,
            name: oauthAccount.user.name,
            email: oauthAccount.user.email,
            emailVerified: oauthAccount.user.emailVerified
          }
        }
      }

      // Check if user exists with this email
      let user = await prisma.user.findUnique({
        where: { email: googleUserData.email }
      })

      if (user) {
        // Link Google account to existing user
        oauthAccount = await prisma.oAuthAccount.create({
          data: {
            userId: user.id,
            provider: 'google',
            providerAccountId: googleUserData.googleId
          }
        })

        // Ensure email is verified
        if (!user.emailVerified) {
          user = await prisma.user.update({
            where: { id: user.id },
            data: { emailVerified: true }
          })
        }

        const token = generateToken({ userId: user.id })
        
        return {
          success: true,
          token,
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            emailVerified: user.emailVerified
          }
        }
      }

      // Create new user
      user = await prisma.user.create({
        data: {
          name: googleUserData.name,
          email: googleUserData.email,
          emailVerified: googleUserData.emailVerified,
          passwordHash: null // No password for OAuth users
        }
      })

      // Create OAuth account
      oauthAccount = await prisma.oAuthAccount.create({
        data: {
          userId: user.id,
          provider: 'google',
          providerAccountId: googleUserData.googleId
        }
      })

      const token = generateToken({ userId: user.id })
      
      return {
        success: true,
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          emailVerified: user.emailVerified
        }
      }

    } catch (error) {
      console.error('Google callback error:', error)
      throw new Error('Failed to process Google authentication')
    }
  }
}

export default new GoogleAuthService()