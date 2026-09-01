# Authentication System - Setup Guide

This guide will help you set up and run the authentication system for your hackathon project.

## Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Git (optional, for cloning)

## Quick Start

### 1. Clone or Download the Project

```bash
git clone <repository-url>
cd auth-system
```

Or download and extract the project files.

### 2. Install Dependencies

**Backend:**
```bash
cd backend
npm install
```

**Frontend:**
```bash
cd frontend
npm install
```

### 3. Configure Environment Variables

**Backend (.env):**
```bash
cd backend
cp .env.example .env
```

Edit the `.env` file with your configuration:
```env
DATABASE_URL="file:./dev.db"
PORT=5000
NODE_ENV=development
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_EXPIRES_IN=7d
GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_app_specific_password
SMTP_FROM=your_email@gmail.com
SMTP_FROM_NAME=Auth System
OTP_EXPIRY_MINUTES=5
OTP_MAX_ATTEMPTS=3
OTP_RESEND_COOLDOWN_SECONDS=60
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
FRONTEND_URL=http://localhost:5173
SESSION_SECRET=your_session_secret_change_this
```

**Frontend (.env):**
```bash
cd frontend
cp .env.example .env
```

Edit the `.env` file:
```env
VITE_API_URL=http://localhost:5000/api
VITE_GOOGLE_OAUTH_URL=http://localhost:5000/api/auth/google
```

### 4. Set Up Database

The project uses SQLite by default for easy setup. The database will be created automatically when you run the backend.

**Optional: PostgreSQL Setup**

If you want to use PostgreSQL instead:

1. Install PostgreSQL
2. Create a database:
```sql
CREATE DATABASE auth_db;
```

3. Update backend `.env`:
```env
DATABASE_URL="postgresql://username:password@localhost:5432/auth_db?schema=public"
```

4. Update `backend/prisma/schema.prisma`:
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

5. Run migrations:
```bash
cd backend
npx prisma migrate dev
```

### 5. Run the Application

**Start Backend:**
```bash
cd backend
npm run dev
```

Backend will run on `http://localhost:5000`

**Start Frontend:**
```bash
cd frontend
npm run dev
```

Frontend will run on `http://localhost:5173`

### 6. Access the Application

Open your browser and navigate to:
- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:5000/api/auth/health`

## Optional: Google OAuth Setup

### 1. Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing one

### 2. Enable Google+ API

1. Navigate to APIs & Services → Library
2. Search for "Google+ API" or "Google Identity"
3. Enable the API

### 3. Configure OAuth Consent Screen

1. Go to APIs & Services → OAuth consent screen
2. Choose "External" user type
3. Fill in required fields (app name, support email)
4. Add scopes: `email`, `profile`
5. Add test users (for development)

### 4. Create OAuth 2.0 Credentials

1. Go to APIs & Services → Credentials
2. Click "Create Credentials" → "OAuth client ID"
3. Application type: "Web application"
4. Add authorized redirect URIs:
   - Development: `http://localhost:5000/api/auth/google/callback`
   - Production: `https://yourdomain.com/api/auth/google/callback`
5. Add authorized JavaScript origins (if needed):
   - Development: `http://localhost:5173`
   - Production: `https://yourdomain.com`

### 5. Update Environment Variables

Copy the Client ID and Client Secret to your backend `.env`:
```env
GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

## Optional: Email Service Setup

### Gmail Setup

1. Enable 2-Factor Authentication on your Google Account
2. Generate an App-Specific Password:
   - Go to Google Account → Security
   - Enable 2-Step Verification
   - Go to App Passwords
   - Generate new app password for "Mail"
   - Use this 16-character password in `SMTP_PASSWORD`

### Other SMTP Providers

Use provider-specific SMTP settings and update the `.env` file accordingly.

### Development Mode

The application will simulate email sending in development mode if SMTP is not configured. OTPs will be printed in the backend console.

## Testing Checklist

### Backend Testing

- [ ] Server starts without errors
- [ ] Database connection successful
- [ ] Health check endpoint works: `GET /api/auth/health`
- [ ] Signup flow works end-to-end
- [ ] Login flow works end-to-end
- [ ] OTP verification works
- [ ] Rate limiting is active
- [ ] Error handling works correctly

### Frontend Testing

- [ ] Frontend loads without errors
- [ ] Navigation between pages works
- [ ] Signup form validation works
- [ ] Login form validation works
- [ ] OTP input handles user interaction correctly
- [ ] Protected routes redirect unauthenticated users
- [ ] Dashboard displays user information
- [ ] Logout functionality works

### Integration Testing

- [ ] Complete signup flow (frontend → backend → database)
- [ ] Complete login flow (frontend → backend → authentication)
- [ ] OTP timer and resend functionality
- [ ] Error messages display correctly
- [ ] Loading states work properly

## Troubleshooting

### Backend Issues

**Server won't start:**
- Check if port 5000 is already in use
- Verify all dependencies are installed
- Check environment variables are set correctly

**Database connection errors:**
- Verify DATABASE_URL is correct
- For PostgreSQL, ensure database exists and credentials are correct
- For SQLite, ensure write permissions on the directory

**Email sending fails:**
- Check SMTP credentials are correct
- For Gmail, use app-specific password (not regular password)
- In development, check console for simulated emails

### Frontend Issues

**Frontend won't start:**
- Check if port 5173 is already in use
- Verify all dependencies are installed
- Check VITE_API_URL is correct

**API calls fail:**
- Ensure backend is running
- Check CORS configuration
- Verify API URL in frontend .env

**Authentication not working:**
- Check JWT_SECRET is set
- Verify token storage in localStorage
- Check authentication middleware

### Common Issues

**CORS errors:**
- Verify FRONTEND_URL in backend .env matches frontend URL
- Check CORS configuration in backend

**Rate limiting issues:**
- Wait for rate limit to expire
- Adjust rate limit settings in .env

**OTP not received:**
- Check backend console for simulated OTP (development)
- Verify SMTP configuration (production)
- Check email spam folder

## Development Tips

### Database Management

```bash
# View database in Prisma Studio
cd backend
npx prisma studio

# Reset database (development only)
npx prisma migrate reset

# Create new migration
npx prisma migrate dev --name migration_name
```

### Code Quality

```bash
# Run backend in development mode with auto-reload
cd backend
npm run dev

# Run frontend in development mode with hot reload
cd frontend
npm run dev
```

### Production Build

```bash
# Build frontend
cd frontend
npm run build

# Start backend in production mode
cd backend
NODE_ENV=production npm start
```

## Security Notes

1. **Never commit .env files** - They contain sensitive information
2. **Use strong secrets** - JWT_SECRET and SESSION_SECRET should be cryptographically random
3. **Change defaults** - Update default secrets before production deployment
4. **Enable HTTPS** - Use HTTPS in production for secure communication
5. **Keep dependencies updated** - Regularly update packages for security patches
6. **Monitor logs** - Set up proper logging and monitoring in production

## Support

For issues or questions:
- Check the troubleshooting section above
- Review the main README.md file
- Check console logs for detailed error messages
- Verify all configuration files are correct

## Next Steps

After setup:
1. Test the complete authentication flow
2. Customize the UI as needed
3. Add additional features as required
4. Deploy to your hosting platform
5. Set up monitoring and logging for production
