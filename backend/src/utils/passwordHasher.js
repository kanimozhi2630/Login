import argon2 from 'argon2'

/**
 * Hash a password using Argon2
 * @param {string} password - Plain text password
 * @returns {Promise<string>} Hashed password
 */
export async function hashPassword(password) {
  try {
    return await argon2.hash(password, {
      type: argon2.argon2id,
      memoryCost: 65536, // 64 MB
      timeCost: 3,       // Number of iterations
      parallelism: 4,    // Number of parallel threads
      hashLength: 32,    // Hash length in bytes
    })
  } catch (error) {
    console.error('Password hashing error:', error)
    throw new Error('Failed to hash password')
  }
}

/**
 * Verify a password against a hash
 * @param {string} hash - Hashed password
 * @param {string} password - Plain text password to verify
 * @returns {Promise<boolean>} True if password matches
 */
export async function verifyPassword(hash, password) {
  try {
    return await argon2.verify(hash, password)
  } catch (error) {
    console.error('Password verification error:', error)
    return false
  }
}

/**
 * Hash an OTP using Argon2
 * @param {string} otp - Plain text OTP
 * @returns {Promise<string>} Hashed OTP
 */
export async function hashOtp(otp) {
  try {
    return await argon2.hash(otp, {
      type: argon2.argon2id,
      memoryCost: 16384, // 16 MB (lower for OTPs)
      timeCost: 2,       // Fewer iterations for OTPs
      parallelism: 2,
      hashLength: 16,    // Shorter hash for OTPs
    })
  } catch (error) {
    console.error('OTP hashing error:', error)
    throw new Error('Failed to hash OTP')
  }
}

/**
 * Verify an OTP against a hash
 * @param {string} hash - Hashed OTP
 * @param {string} otp - Plain text OTP to verify
 * @returns {Promise<boolean>} True if OTP matches
 */
export async function verifyOtp(hash, otp) {
  try {
    return await argon2.verify(hash, otp)
  } catch (error) {
    console.error('OTP verification error:', error)
    return false
  }
}
