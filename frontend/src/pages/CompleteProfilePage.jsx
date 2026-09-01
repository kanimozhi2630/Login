import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { authService } from '../services/authService'
import Button from '../components/common/Button'
import Input from '../components/common/Input'
import Alert from '../components/common/Alert'

function CompleteProfilePage() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [alert, setAlert] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    setName(e.target.value)
    setError('')
  }

  const validateName = () => {
    if (!name.trim()) {
      setError('Name is required')
      return false
    }
    if (name.trim().length < 2) {
      setError('Name must be at least 2 characters')
      return false
    }
    return true
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateName()) {
      return
    }

    setLoading(true)
    setAlert(null)

    try {
      const response = await authService.completeProfile({ name })
      
      if (response.success) {
        setAlert({ type: 'success', message: 'Profile completed successfully!' })
        setTimeout(() => {
          navigate('/dashboard')
        }, 1000)
      } else {
        setAlert({ type: 'error', message: response.message })
      }
    } catch (error) {
      setAlert({ 
        type: 'error', 
        message: error.response?.data?.message || 'Failed to complete profile. Please try again.' 
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Complete Your Profile
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Just one more step to get started
          </p>
        </div>

        {alert && (
          <Alert 
            type={alert.type} 
            message={alert.message} 
            onClose={() => setAlert(null)} 
          />
        )}

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <Input
            label="Full Name"
            name="name"
            type="text"
            value={name}
            onChange={handleChange}
            placeholder="Enter your full name"
            error={error}
            required
          />

          <Button
            type="submit"
            variant="primary"
            className="w-full"
            loading={loading}
          >
            Complete Profile
          </Button>
        </form>
      </div>
    </div>
  )
}

export default CompleteProfilePage
