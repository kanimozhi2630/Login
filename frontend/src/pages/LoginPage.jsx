import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { authService } from '../services/authService'
import { useAuth } from '../context/AuthContext'
import Button from '../components/common/Button'
import Input from '../components/common/Input'
import Alert from '../components/common/Alert'

function LoginPage() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [showEmailForm, setShowEmailForm] = useState(false)
  const [loginMethod, setLoginMethod] = useState('password') // 'password' or 'otp'
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [errors, setErrors] = useState({})
  const [alert, setAlert] = useState(null)
  const [loading, setLoading] = useState(false)

  const validatePasswordForm = () => {
    const newErrors = {}
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Invalid email format'
    }
    if (!formData.password) {
      newErrors.password = 'Password is required'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const validateOtpForm = () => {
    const newErrors = {}
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Invalid email format'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handlePasswordLogin = async (e) => {
    e.preventDefault()
    
    if (!validatePasswordForm()) {
      return
    }

    setLoading(true)
    setAlert(null)

    try {
      const response = await authService.loginWithPassword({
        email: formData.email,
        password: formData.password
      })
      
      if (response.success) {
        login(response.token, response.user)
        navigate('/dashboard')
      } else {
        setAlert({ type: 'error', message: response.message })
      }
    } catch (error) {
      setAlert({ 
        type: 'error', 
        message: error.response?.data?.message || 'Failed to login. Please try again.' 
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSendOtp = async (e) => {
    e.preventDefault()
    
    if (!validateOtpForm()) {
      return
    }

    setLoading(true)
    setAlert(null)

    try {
      const response = await authService.initiateLogin(formData.email)
      
      if (response.success) {
        navigate('/verify-otp', { 
          state: { 
            email: response.email, 
            purpose: 'LOGIN' 
          } 
        })
      } else {
        setAlert({ type: 'error', message: response.message })
      }
    } catch (error) {
      setAlert({ 
        type: 'error', 
        message: error.response?.data?.message || 'Failed to send OTP. Please try again.' 
      })
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleLogin = () => {
    authService.initiateGoogleOAuth()
  }

  const handleBackToOptions = () => {
    setShowEmailForm(false)
  }

  const handleFormDataChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Login
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Sign in to your account
          </p>
        </div>

        {alert && (
          <Alert 
            type={alert.type} 
            message={alert.message} 
            onClose={() => setAlert(null)} 
          />
        )}

        {!showEmailForm ? (
          <div className="mt-8 space-y-4">
            <Button
              type="button"
              variant="google"
              className="w-full"
              onClick={handleGoogleLogin}
            >
              <div className="flex items-center justify-center">
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Continue with Google
              </div>
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-gray-100 text-gray-500">OR</span>
              </div>
            </div>

            <Button
              type="button"
              variant="secondary"
              className="w-full"
              onClick={() => setShowEmailForm(true)}
            >
              Login with Email
            </Button>

            <div className="text-center">
              <span className="text-sm text-gray-600">
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={() => navigate('/signup')}
                  className="font-medium text-blue-600 hover:text-blue-500"
                >
                  Create Account
                </button>
              </span>
            </div>
          </div>
        ) : (
          <div className="mt-8 space-y-6">
            <button
              type="button"
              onClick={handleBackToOptions}
              className="text-sm text-gray-600 hover:text-gray-800"
            >
              ← Back to login options
            </button>

            {/* Login Method Toggle */}
            <div className="flex space-x-2">
              <button
                type="button"
                onClick={() => setLoginMethod('password')}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  loginMethod === 'password'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Password
              </button>
              <button
                type="button"
                onClick={() => setLoginMethod('otp')}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  loginMethod === 'otp'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                OTP
              </button>
            </div>

            {/* Password Login Form */}
            {loginMethod === 'password' && (
              <form onSubmit={handlePasswordLogin}>
                <Input
                  label="Email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleFormDataChange}
                  placeholder="your@email.com"
                  error={errors.email}
                  required
                />

                <Input
                  label="Password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleFormDataChange}
                  placeholder="••••••••"
                  error={errors.password}
                  required
                />

                <Button
                  type="submit"
                  variant="primary"
                  className="w-full"
                  loading={loading}
                >
                  Login
                </Button>
              </form>
            )}

            {/* OTP Login Form */}
            {loginMethod === 'otp' && (
              <form onSubmit={handleSendOtp}>
                <Input
                  label="Email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleFormDataChange}
                  placeholder="your@email.com"
                  error={errors.email}
                  required
                />

                <Button
                  type="submit"
                  variant="primary"
                  className="w-full"
                  loading={loading}
                >
                  Send OTP
                </Button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default LoginPage
