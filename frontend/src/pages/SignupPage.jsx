import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { authService } from '../services/authService'
import Button from '../components/common/Button'
import Input from '../components/common/Input'
import Alert from '../components/common/Alert'

function SignupPage() {
  const navigate = useNavigate()
  const [showEmailForm, setShowEmailForm] = useState(false)
  const [step, setStep] = useState(1) // 1: Email, 2: OTP, 3: Password
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [formData, setFormData] = useState({
    name: '',
    password: '',
    confirmPassword: ''
  })
  const [errors, setErrors] = useState({})
  const [alert, setAlert] = useState(null)
  const [loading, setLoading] = useState(false)

  const validateEmail = () => {
    const newErrors = {}
    if (!email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Invalid email format'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const validateOtp = () => {
    const newErrors = {}
    if (!otp.trim()) {
      newErrors.otp = 'OTP is required'
    } else if (!/^\d{6}$/.test(otp)) {
      newErrors.otp = 'OTP must be 6 digits'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const validatePasswordForm = () => {
    const newErrors = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required'
    } else if (formData.name.length < 2) {
      newErrors.name = 'Name must be at least 2 characters'
    }

    if (!formData.password) {
      newErrors.password = 'Password is required'
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters'
    } else if (!/[A-Z]/.test(formData.password)) {
      newErrors.password = 'Password must contain at least one uppercase letter'
    } else if (!/[a-z]/.test(formData.password)) {
      newErrors.password = 'Password must contain at least one lowercase letter'
    } else if (!/\d/.test(formData.password)) {
      newErrors.password = 'Password must contain at least one number'
    } else if (!/[!@#$%^&*(),.?":{}|<>]/.test(formData.password)) {
      newErrors.password = 'Password must contain at least one special character'
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSendOtp = async (e) => {
    e.preventDefault()
    
    if (!validateEmail()) {
      return
    }

    setLoading(true)
    setAlert(null)

    try {
      const response = await authService.initiateSignup({
        email,
        password: 'temp_password' // Temporary, will be set in step 3
      })
      
      if (response.success) {
        setStep(2)
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

  const handleVerifyOtp = async (e) => {
    e.preventDefault()
    
    if (!validateOtp()) {
      return
    }

    setLoading(true)
    setAlert(null)

    try {
      const response = await authService.verifySignupOtp({
        email,
        otp
      })
      
      if (response.success) {
        setStep(3)
      } else {
        setAlert({ type: 'error', message: response.message })
      }
    } catch (error) {
      setAlert({ 
        type: 'error', 
        message: error.response?.data?.message || 'Failed to verify OTP. Please try again.' 
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCreateAccount = async (e) => {
    e.preventDefault()
    
    if (!validatePasswordForm()) {
      return
    }

    setLoading(true)
    setAlert(null)

    try {
      // Store final signup data for account creation
      sessionStorage.setItem('finalSignupData', JSON.stringify({
        name: formData.name,
        email,
        password: formData.password
      }))

      // Re-send OTP to verify the same email
      const otpResponse = await authService.resendSignupOtp(email)
      
      if (!otpResponse.success) {
        setAlert({ type: 'error', message: otpResponse.message })
        setLoading(false)
        return
      }

      // Navigate to OTP page for final verification
      navigate('/verify-otp', { 
        state: { 
          email, 
          purpose: 'SIGNUP_FINAL',
          isFinalStep: true
        } 
      })
    } catch (error) {
      setAlert({ 
        type: 'error', 
        message: error.response?.data?.message || 'Failed to create account. Please try again.' 
      })
    } finally {
      setLoading(false)
    }
  }

  const handleEmailChange = (e) => {
    setEmail(e.target.value)
    if (errors.email) {
      setErrors(prev => ({ ...prev, email: '' }))
    }
  }

  const handleOtpChange = (e) => {
    setOtp(e.target.value)
    if (errors.otp) {
      setErrors(prev => ({ ...prev, otp: '' }))
    }
  }

  const handleFormDataChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1)
    } else {
      setShowEmailForm(false)
    }
  }

  const handleGoogleSignup = () => {
    authService.initiateGoogleOAuth()
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Create Account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {!showEmailForm && 'Sign up to get started'}
            {showEmailForm && step === 1 && 'Step 1: Verify your email'}
            {showEmailForm && step === 2 && 'Step 2: Enter verification code'}
            {showEmailForm && step === 3 && 'Step 3: Create your password'}
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
              onClick={handleGoogleSignup}
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
              Sign up with Email
            </Button>

            <div className="text-center">
              <span className="text-sm text-gray-600">
                Already registered?{' '}
                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  className="font-medium text-blue-600 hover:text-blue-500"
                >
                  Login
                </button>
              </span>
            </div>
          </div>
        ) : (
          <div className="mt-8 space-y-6">
            <button
              type="button"
              onClick={handleBack}
              className="text-sm text-gray-600 hover:text-gray-800"
            >
              ← Back
            </button>

            {/* Step 1: Email Input */}
            {step === 1 && (
              <form onSubmit={handleSendOtp}>
                <Input
                  label="Email"
                  name="email"
                  type="email"
                  value={email}
                  onChange={handleEmailChange}
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
                  Send Verification OTP
                </Button>
              </form>
            )}

            {/* Step 2: OTP Input */}
            {step === 2 && (
              <form onSubmit={handleVerifyOtp}>
                <div className="text-center mb-4">
                  <p className="text-sm text-gray-600">
                    We sent a verification code to:
                  </p>
                  <p className="text-sm font-medium text-blue-600">
                    {email}
                  </p>
                </div>

                <Input
                  label="Verification Code"
                  name="otp"
                  type="text"
                  value={otp}
                  onChange={handleOtpChange}
                  placeholder="123456"
                  error={errors.otp}
                  required
                />

                <Button
                  type="submit"
                  variant="primary"
                  className="w-full"
                  loading={loading}
                >
                  Verify OTP
                </Button>
              </form>
            )}

            {/* Step 3: Password Input */}
            {step === 3 && (
              <form onSubmit={handleCreateAccount}>
                <Input
                  label="Full Name"
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={handleFormDataChange}
                  placeholder="John Doe"
                  error={errors.name}
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

                <Input
                  label="Confirm Password"
                  name="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={handleFormDataChange}
                  placeholder="••••••••"
                  error={errors.confirmPassword}
                  required
                />

                <Button
                  type="submit"
                  variant="primary"
                  className="w-full"
                  loading={loading}
                >
                  Create Account
                </Button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default SignupPage
