import rateLimit from 'express-rate-limit'

/**
 * Create a rate limiter middleware
 * @param {object} options - Rate limiter options
 * @returns {function} Express middleware
 */
export const createRateLimiter = (options = {}) => {
  const defaultOptions = {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    ...options
  }

  return rateLimit(defaultOptions)
}

/**
 * Stricter rate limiter for authentication endpoints
 */
export const authRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 auth requests per 15 minutes
  message: 'Too many authentication attempts, please try again later.'
})

/**
 * Very strict rate limiter for OTP endpoints
 */
export const otpRateLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 3, // Limit each IP to 3 OTP requests per minute
  message: 'Too many OTP requests, please wait before trying again.'
})
