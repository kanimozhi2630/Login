import crypto from 'crypto'

/**
 * Generate a cryptographically secure 6-digit OTP
 * @returns {string} 6-digit OTP as string
 */
export function generateOtp() {
  // Generate a random buffer and convert to a number
  const buffer = crypto.randomBytes(3) // 3 bytes = 24 bits = max 16,777,215
  const randomNumber = buffer.readUIntBE(0, 3)
  
  // Convert to 6-digit number (000000-999999)
  const otp = randomNumber % 1000000
  
  // Pad with leading zeros to ensure 6 digits
  return otp.toString().padStart(6, '0')
}

/**
 * Generate a cryptographically secure random string
 * @param {number} length - Length of the random string
 * @returns {string} Random string
 */
export function generateRandomString(length = 32) {
  return crypto.randomBytes(Math.ceil(length / 2))
    .toString('hex')
    .slice(0, length)
}

/**
 * Generate a cryptographically secure state parameter for OAuth
 * @returns {string} Random state string
 */
export function generateOAuthState() {
  return generateRandomString(32)
}
