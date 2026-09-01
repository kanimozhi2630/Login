/**
 * Centralized error handling middleware
 */
export function errorHandler(err, req, res, next) {
  // Don't log sensitive information
  const safeError = {
    message: err.message,
    statusCode: err.statusCode,
    code: err.code,
    name: err.name
  }

  console.error('Error:', safeError)

  // Default error
  let statusCode = err.statusCode || 500
  let message = err.message || 'Internal server error'

  // Prisma errors
  if (err.code === 'P2002') {
    // Unique constraint violation
    statusCode = 409
    message = 'A record with this information already exists'
  } else if (err.code === 'P2025') {
    // Record not found
    statusCode = 404
    message = 'Record not found'
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401
    message = 'Invalid token'
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401
    message = 'Token expired'
  }

  // Validation errors
  if (err.name === 'ValidationError') {
    statusCode = 400
    message = err.message
  }

  // Rate limit errors
  if (err.name === 'RateLimitError') {
    statusCode = 429
    message = err.message || 'Too many requests'
  }

  // Don't expose detailed errors in production
  if (process.env.NODE_ENV === 'production') {
    message = statusCode === 500 ? 'Internal server error' : message
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { 
      stack: err.stack,
      code: err.code 
    })
  })
}

/**
 * Not found middleware for undefined routes
 */
export function notFound(req, res, next) {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  })
}

/**
 * Async handler wrapper to catch errors in async functions
 */
export function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next)
  }
}
