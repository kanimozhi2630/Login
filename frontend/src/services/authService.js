import api from './api'

export const authService = {
  // Signup
  async initiateSignup(data) {
    const response = await api.post('/auth/signup', data)
    return response.data
  },

  async resendSignupOtp(email) {
    const response = await api.post('/auth/send-signup-otp', { email })
    return response.data
  },

  async verifySignupOtp(data) {
    const response = await api.post('/auth/verify-signup-otp', data)
    return response.data
  },

  // Login
  async loginWithPassword(data) {
    const response = await api.post('/auth/login', data)
    return response.data
  },

  async initiateLogin(email) {
    const response = await api.post('/auth/send-login-otp', { email })
    return response.data
  },

  async verifyLoginOtp(data) {
    const response = await api.post('/auth/verify-login-otp', data)
    return response.data
  },

  // Protected routes
  async getCurrentUser() {
    const response = await api.get('/auth/me')
    return response.data
  },

  async logout() {
    const response = await api.post('/auth/logout')
    return response.data
  },

  async completeProfile(data) {
    const response = await api.post('/auth/complete-profile', data)
    return response.data
  },

  // Google OAuth
  initiateGoogleOAuth() {
    const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000'
    window.location.href = `${backendUrl}/api/auth/google`
  }
}
