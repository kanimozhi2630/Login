import { verifyToken } from '../utils/tokenGenerator.js'
import prisma from '../config/database.js'

/**
 * Authentication middleware to verify JWT token
 */
export async function authenticate(req, res, next) {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      })
    }

    const token = authHeader.substring(7) // Remove 'Bearer ' prefix

    // Verify token
    const decoded = verifyToken(token)
    
    if (!decoded) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token'
      })
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        name: true,
        email: true,
        emailVerified: true,
        createdAt: true
      }
    })

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      })
    }

    // Attach user to request object
    req.user = user
    next()

  } catch (error) {
    console.error('Authentication middleware error:', error)
    return res.status(500).json({
      success: false,
      message: 'Authentication error'
    })
  }
}

/**
 * Optional authentication middleware - doesn't fail if no token
 */
export async function optionalAuthenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next() // Continue without authentication
    }

    const token = authHeader.substring(7)
    const decoded = verifyToken(token)
    
    if (decoded) {
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: {
          id: true,
          name: true,
          email: true,
          emailVerified: true,
          createdAt: true
        }
      })

      if (user) {
        req.user = user
      }
    }

    next()

  } catch (error) {
    console.error('Optional authentication middleware error:', error)
    next() // Continue even if there's an error
  }
}
