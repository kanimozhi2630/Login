import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { authService } from '../services/authService'
import { useAuth } from '../context/AuthContext'
import Button from '../components/common/Button'
import Input from '../components/common/Input'
import Alert from '../components/common/Alert'

function OtpPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login } = useAuth()
  
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [purpose, setPurpose] = useState('SIGNUP')
  const [error, setError] = useState('')
  const [alert, setAlert] = useState(null)
  const [loading, setLoading] = useState(false)
  const [resendLoading, setResendLoading] = useState(false)
  const [timeLeft, setTimeLeft] = useState(300) // 5 minutes
  const [canResend, setCanResend] = useState(false)

  useEffect(() => {
    // Get email and purpose from location state or sessionStorage
    if (location.state?.email) {
      setEmail(location.state.email)
      setPurpose(location.state.purpose || 'SIGNUP')
    } else {
      // Try to get from sessionStorage
      const pendingSignup = sessionStorage.getItem('pendingSignup')
      if (pendingSignup) {
        const data = JSON.parse(pendingSignup)
        setEmail(data.email)
        setPurpose('SIGNUP')
      } else {
        navigate('/login')
      }
    }
  }, [location.state, navigate])

  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000)
      return () => clearTimeout(timer)
    } else {
      setCanResend(true)
    }
  }, [timeLeft])

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const handleOtpChange = (e) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6)
    setOtp(value)
    setError('')
  }

  const validateOtp = () => {
    if (!otp) {
      setError('OTP is required')
      return false
    }
    if (otp.length !== 6) {
      setError('OTP must be 6 digits')
      return false
    }
    return true
  }

  const handleVerify = async (e) => {
    e.preventDefault()
    
    if (!validateOtp()) {
      return
    }

    setLoading(true)
    setAlert(null)

    try {
      let response
      
      if (purpose === 'SIGNUP' || purpose === 'SIGNUP_FINAL') {
        // Get final signup data if this is the final step
        if (purpose === 'SIGNUP_FINAL') {
          const finalSignupData = sessionStorage.getItem('finalSignupData')
          if (!finalSignupData) {
            setAlert({ type: 'error', message: 'Signup session expired. Please start again.' })
            setLoading(false)
            return
          }
          
          const signupData = JSON.parse(finalSignupData)
          response = await authService.verifySignupOtp({
            email,
            otp,
            ...signupData
          })
        } else {
          // Get pending signup data
          const pendingSignup = sessionStorage.getItem('pendingSignup')
          if (!pendingSignup) {
            setAlert({ type: 'error', message: 'Signup session expired. Please start again.' })
            setLoading(false)
            return
          }
          
          const signupData = JSON.parse(pendingSignup)
          response = await authService.verifySignupOtp({
            email,
            otp,
            ...signupData
          })
        }
      } else {
        response = await authService.verifyLoginOtp({ email, otp })
      }

      if (response.success) {
        // Clear signup data
        sessionStorage.removeItem('pendingSignup')
        sessionStorage.removeItem('finalSignupData')
        
        // Login user
        login(response.token, response.user)
        
        // If new user (no name), redirect to complete profile
        if (response.user.isNewUser) {
          navigate('/complete-profile')
        } else {
          // Navigate to dashboard
          navigate('/dashboard')
        }
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

  const handleResend = async () => {
    if (!canResend) return

    setResendLoading(true)
    setAlert(null)

    try {
      const response = (purpose === 'SIGNUP' || purpose === 'SIGNUP_FINAL') 
        ? await authService.resendSignupOtp(email)
        : await authService.resendLoginOtp(email)

      if (response.success) {
        setAlert({ type: 'success', message: 'New OTP sent successfully' })
        setTimeLeft(300) // Reset timer
        setCanResend(false)
        setOtp('') // Clear OTP input
      } else {
        setAlert({ type: 'error', message: response.message })
      }
    } catch (error) {
      setAlert({ 
        type: 'error', 
        message: error.response?.data?.message || 'Failed to resend OTP. Please try again.' 
      })
    } finally {
      setResendLoading(false)
    }
  }

  const handleBack = () => {
    if (purpose === 'SIGNUP' || purpose === 'SIGNUP_FINAL') {
      navigate('/signup')
    } else {
      navigate('/login')
    }
  }

  if (!email) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Verify Your Email
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            We sent a verification code to:
          </p>
          <p className="mt-1 text-center text-sm font-medium text-blue-600">
            {email}
          </p>
        </div>

        {alert && (
          <Alert 
            type={alert.type} 
            message={alert.message} 
            onClose={() => setAlert(null)} 
          />
        )}

        <form className="mt-8 space-y-6" onSubmit={handleVerify}>
          <div className="flex justify-center space-x-2">
            {[0, 1, 2, 3, 4, 5].map((index) => (
              <input
                key={index}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={otp[index] || ''}
                onChange={(e) => {
                  const newOtp = otp.split('')
                  newOtp[index] = e.target.value
                  setOtp(newOtp.join(''))
                  // Auto-focus next input
                  if (e.target.value && index < 5) {
                    const nextInput = document.getElementById(`otp-${index + 1}`)
                    if (nextInput) nextInput.focus()
                  }
                }}
                onKeyDown={(e) => {
                  // Handle backspace
                  if (e.key === 'Backspace' && !otp[index] && index > 0) {
                    const prevInput = document.getElementById(`otp-${index - 1}`)
                    if (prevInput) prevInput.focus()
                  }
                }}
                id={`otp-${index}`}
                className="w-12 h-12 text-center text-2xl font-bold border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            ))}
          </div>

          {error && (
            <p className="mt-2 text-sm text-red-600 text-center">{error}</p>
          )}

          <div className="text-center">
            <p className="text-sm text-gray-600">
              OTP expires in: <span className="font-medium">{formatTime(timeLeft)}</span>
            </p>
          </div>

          <Button
            type="submit"
            variant="primary"
            className="w-full"
            loading={loading}
          >
            Verify OTP
          </Button>

          <div className="text-center">
            <button
              type="button"
              onClick={handleResend}
              disabled={!canResend || resendLoading}
              className="text-sm text-blue-600 hover:text-blue-500 disabled:text-gray-400 disabled:cursor-not-allowed"
            >
              {resendLoading ? 'Sending...' : canResend ? 'Resend OTP' : `Resend available in ${formatTime(timeLeft)}`}
            </button>
          </div>

          <div className="text-center">
            <button
              type="button"
              onClick={handleBack}
              className="text-sm text-gray-600 hover:text-gray-800"
            >
              ← Back to {(purpose === 'SIGNUP' || purpose === 'SIGNUP_FINAL') ? 'signup' : 'login'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default OtpPage
