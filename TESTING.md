# Authentication System - Testing Guide

This guide provides comprehensive testing instructions for the authentication system.

## Testing Environment Setup

### Prerequisites
- Backend running on `http://localhost:5000`
- Frontend running on `http://localhost:5173`
- Database properly configured (SQLite or PostgreSQL)
- Environment variables configured

### Test Accounts
For testing, you can use:
- Email: `test@example.com`
- Password: `TestPass123!` (meets all requirements)

## Manual Testing Checklist

### 1. Backend API Testing

#### Health Check
```bash
curl http://localhost:5000/api/auth/health
```
**Expected:** JSON response with success status and timestamp

#### Signup Flow
```bash
# 1. Initiate signup
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "TestPass123!",
    "confirmPassword": "TestPass123!"
  }'
```
**Expected:** Success response with email, OTP shown in backend console

```bash
# 2. Verify OTP (use OTP from console)
curl -X POST http://localhost:5000/api/auth/verify-signup-otp \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "otp": "123456"
  }'
```
**Expected:** Success response with token and user data

#### Login Flow
```bash
# 1. Send login OTP
curl -X POST http://localhost:5000/api/auth/send-login-otp \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com"}'
```
**Expected:** Success response, OTP shown in backend console

```bash
# 2. Verify login OTP
curl -X POST http://localhost:5000/api/auth/verify-login-otp \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "otp": "123456"
  }'
```
**Expected:** Success response with token and user data

#### Protected Routes
```bash
# Get current user (requires token)
curl http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```
**Expected:** User data if token is valid

```bash
# Logout
curl -X POST http://localhost:5000/api/auth/logout \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```
**Expected:** Success message

### 2. Frontend UI Testing

#### Signup Page
- [ ] Navigate to `http://localhost:5173/signup`
- [ ] Form validation works for empty fields
- [ ] Email validation works for invalid format
- [ ] Password validation enforces requirements
- [ ] Password confirmation matching works
- [ ] Successful signup redirects to OTP page
- [ ] Error messages display correctly
- [ ] Loading state shows during API call

#### Login Page
- [ ] Navigate to `http://localhost:5173/login`
- [ ] Email validation works
- [ ] Successful login sends OTP
- [ ] Redirects to OTP page
- [ ] Google OAuth button is present (non-functional without setup)
- [ ] Error messages display correctly
- [ ] Loading state shows during API call

#### OTP Page
- [ ] OTP page loads with correct email
- [ ] 6-digit input fields work correctly
- [ ] Auto-focus moves to next input
- [ ] Backspace navigation works
- [ ] Timer counts down correctly
- [ ] Resend button enables after timer expires
- [ ] Resend cooldown works
- [ ] Successful verification redirects to dashboard
- [ ] Error messages display for invalid OTP
- [ ] Back button returns to appropriate page

#### Dashboard Page
- [ ] Dashboard loads only when authenticated
- [ ] User information displays correctly
- [ ] Email verification status shows correctly
- [ ] Logout button works
- [ ] Logout redirects to login page
- [ ] Protected routes redirect unauthenticated users

### 3. Security Testing

#### Rate Limiting
```bash
# Test general rate limiting (100 requests per 15 minutes)
for i in {1..101}; do
  curl http://localhost:5000/api/auth/health
done
```
**Expected:** Rate limit error after 100 requests

```bash
# Test auth rate limiting (5 requests per 15 minutes)
for i in {1..6}; do
  curl -X POST http://localhost:5000/api/auth/signup \
    -H "Content-Type: application/json" \
    -d '{"name":"Test","email":"test'$i'@example.com","password":"TestPass123!","confirmPassword":"TestPass123!"}'
done
```
**Expected:** Rate limit error after 5 requests

```bash
# Test OTP rate limiting (3 requests per minute)
for i in {1..4}; do
  curl -X POST http://localhost:5000/api/auth/send-login-otp \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com"}'
done
```
**Expected:** Rate limit error after 3 requests

#### Input Validation
- [ ] SQL injection attempts are blocked
- [ ] XSS attempts are blocked
- [ ] Invalid email formats are rejected
- [ ] Weak passwords are rejected
- [ ] Invalid OTP formats are rejected

#### Authentication Security
- [ ] Protected routes require valid token
- [ ] Invalid tokens are rejected
- [ ] Expired tokens are rejected
- [ ] Logout clears authentication
- [ ] Generic error messages prevent enumeration

### 4. Error Handling Testing

#### API Errors
- [ ] 400 Bad Request for invalid input
- [ ] 401 Unauthorized for missing/invalid tokens
- [ ] 404 Not Found for non-existent resources
- [ ] 409 Conflict for duplicate resources
- [ ] 429 Too Many Requests for rate limits
- [ ] 500 Internal Server Error handled gracefully

#### Frontend Errors
- [ ] Network errors display user-friendly messages
- [ ] Validation errors show field-specific messages
- [ ] API errors display appropriate messages
- [ ] Loading states prevent duplicate submissions
- [ ] Error alerts can be dismissed

### 5. Database Testing

#### Data Integrity
- [ ] Users are created correctly
- [ ] Email uniqueness is enforced
- [ ] OTPs are stored with hashes
- [ ] OTP expiration works
- [ ] Foreign key constraints work
- [ ] Cascading deletes work

#### Using Prisma Studio
```bash
cd backend
npx prisma studio
```
- [ ] Can view all tables
- [ ] Can see user records
- [ ] Can see OTP records
- [ ] Can see session records
- [ ] Data relationships display correctly

## Automated Testing (Optional)

### Unit Testing Setup

Install testing dependencies:
```bash
cd backend
npm install --save-dev jest supertest @types/jest
```

### Example Test Structure

```javascript
// backend/tests/auth.test.js
const request = require('supertest');
const app = require('../src/app');

describe('Authentication API', () => {
  describe('POST /api/auth/signup', () => {
    it('should initiate signup with valid data', async () => {
      const response = await request(app)
        .post('/api/auth/signup')
        .send({
          name: 'Test User',
          email: 'test@example.com',
          password: 'TestPass123!',
          confirmPassword: 'TestPass123!'
        });
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });
});
```

## End-to-End Testing Scenarios

### Scenario 1: Complete User Registration
1. Navigate to signup page
2. Fill in valid user details
3. Submit form
4. Receive OTP in console (development)
5. Navigate to OTP page (automatic)
6. Enter correct OTP
7. Verify redirect to dashboard
8. Verify user is logged in
9. Verify user data displays correctly

### Scenario 2: Complete User Login
1. Navigate to login page
2. Enter registered email
3. Submit form
4. Receive OTP in console (development)
5. Navigate to OTP page (automatic)
6. Enter correct OTP
7. Verify redirect to dashboard
8. Verify user is logged in

### Scenario 3: Failed Authentication
1. Navigate to login page
2. Enter unregistered email
3. Submit form
4. Verify generic error message
5. Try to access dashboard directly
6. Verify redirect to login page

### Scenario 4: OTP Expiration
1. Initiate signup/login
2. Wait for OTP to expire (5 minutes)
3. Try to verify with expired OTP
4. Verify expiration error message
5. Request new OTP
6. Verify new OTP works

### Scenario 5: Rate Limiting
1. Make multiple rapid requests to same endpoint
2. Verify rate limit error
3. Wait for rate limit to expire
4. Verify requests work again

## Performance Testing

### Load Testing
Using Apache Bench:
```bash
# Test health endpoint
ab -n 1000 -c 10 http://localhost:5000/api/auth/health

# Test signup endpoint
ab -n 100 -c 5 -p signup.json -T application/json http://localhost:5000/api/auth/signup
```

### Response Time Monitoring
- [ ] Health check responds in < 100ms
- [ ] Signup initiates in < 500ms
- [ ] OTP verification in < 500ms
- [ ] Login initiates in < 500ms
- [ ] Protected routes respond in < 200ms

## Security Testing Checklist

### Authentication Security
- [ ] Passwords are hashed before storage
- [ ] OTPs are hashed before storage
- [ ] Tokens are signed with secret key
- [ ] Tokens have expiration
- [ ] Sessions can be invalidated

### Input Security
- [ ] All inputs are validated
- [ ] SQL injection is prevented
- [ ] XSS is prevented
- [ ] CSRF protection is active
- [ ] File uploads are restricted

### Network Security
- [ ] HTTPS is used in production
- [ ] Security headers are present
- [ ] CORS is properly configured
- [ ] Rate limiting is active
- [ ] Request size limits are set

### Data Security
- [ ] Sensitive data is not logged
- [ ] Error messages don't expose internals
- [ ] Environment variables are secure
- [ ] Database credentials are secure
- [ ] API secrets are not exposed

## Browser Testing

### Cross-Browser Testing
Test in:
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)

### Mobile Testing
- [ ] Responsive design works on mobile
- [ ] Touch interactions work correctly
- [ ] Virtual keyboard doesn't break layout
- [ ] Performance is acceptable on mobile

## Accessibility Testing

### WCAG 2.1 Compliance
- [ ] All images have alt text
- [ ] Form labels are properly associated
- [ ] Color contrast meets standards
- [ ] Keyboard navigation works
- [ ] Screen reader compatibility
- [ ] Focus indicators are visible

## Troubleshooting Tests

### Common Issues
- [ ] Database connection failures
- [ ] Email sending failures
- [ ] Token generation failures
- [ ] Rate limit configuration
- [ ] CORS configuration
- [ ] Environment variable loading

## Test Results Documentation

Record your test results:

| Test Category | Status | Notes |
|--------------|--------|-------|
| Backend API | | |
| Frontend UI | | |
| Security | | |
| Performance | | |
| Cross-browser | | |
| Accessibility | | |

## Continuous Testing

For development, run tests:
```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test
```

Set up pre-commit hooks to run tests automatically.

## Production Testing Checklist

Before deploying to production:
- [ ] All tests pass
- [ ] Security audit completed
- [ ] Performance benchmarks met
- [ ] Database migrations tested
- [ ] Environment variables configured
- [ ] Monitoring and logging set up
- [ ] Backup procedures tested
- [ ] Rollback plan prepared
