# Authentication System

A production-style authentication system with Email OTP and Google OAuth 2.0 for hackathon projects.

## Features

- Email + OTP authentication (signup and login)
- Google OAuth 2.0 / OpenID Connect
- Secure password hashing (Argon2/bcrypt)
- JWT-based authentication
- PostgreSQL database with Prisma ORM
- Rate limiting and security headers
- Responsive React frontend

## Tech Stack

### Frontend
- React.js
- React Router
- Axios
- Tailwind CSS
- Vite

### Backend
- Node.js
- Express.js
- Prisma ORM
- JWT authentication
- Nodemailer (SMTP)
- Google Auth Library

### Database
- SQLite (for easy hackathon setup) - can be upgraded to PostgreSQL

## Setup Instructions

### Prerequisites

1. Node.js (v18 or higher)
2. Google Cloud Console account (for OAuth)
3. SMTP email service (Gmail or other)

### Installation

1. Clone the repository and navigate to the project directory

2. **Frontend Setup:**
```bash
cd frontend
npm install
cp .env.example .env
# Edit .env with your configuration
npm run dev
```

3. **Backend Setup:**
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your configuration
npm run dev
```

### Environment Variables

Create `.env` files in both `frontend/` and `backend/` directories using the provided `.env.example` files.

**Backend .env variables:**
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Secret key for JWT tokens
- `GOOGLE_CLIENT_ID` - Google OAuth client ID
- `GOOGLE_CLIENT_SECRET` - Google OAuth client secret
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD` - Email configuration

**Frontend .env variables:**
- `VITE_API_URL` - Backend API URL
- `VITE_GOOGLE_OAUTH_URL` - Google OAuth endpoint

### Database Setup

1. Update `DATABASE_URL` in backend `.env` (using SQLite for easy setup)

2. Run Prisma migrations:
```bash
cd backend
npx prisma migrate dev
```

**Note:** The project uses SQLite for easy hackathon setup. To upgrade to PostgreSQL, change the provider in `prisma/schema.prisma` and update the `DATABASE_URL`.

### Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a project and enable Google+ API
3. Configure OAuth consent screen
4. Create OAuth 2.0 credentials (Web application)
5. Add redirect URI: `http://localhost:5000/api/auth/google/callback`
6. Copy Client ID and Client Secret to backend `.env`

### Email Setup

**For Gmail:**
1. Enable 2-factor authentication
2. Generate an app-specific password
3. Use app password in `SMTP_PASSWORD`

**For other providers:**
- Use provider-specific SMTP settings

## Running the Application

**Development:**
```bash
# Terminal 1 - Frontend
cd frontend
npm run dev

# Terminal 2 - Backend
cd backend
npm run dev
```

**Production:**
```bash
# Frontend
cd frontend
npm run build

# Backend
cd backend
npm start
```

## Project Structure

```
auth-system/
├── frontend/          # React frontend
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── hooks/
│   │   └── context/
├── backend/           # Express backend
│   ├── src/
│   │   ├── controllers/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── middleware/
│   │   └── prisma/
```

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Initiate signup
- `POST /api/auth/send-signup-otp` - Resend signup OTP
- `POST /api/auth/verify-signup-otp` - Verify signup OTP
- `POST /api/auth/send-login-otp` - Send login OTP
- `POST /api/auth/verify-login-otp` - Verify login OTP
- `GET /api/auth/google` - Initiate Google OAuth
- `GET /api/auth/google/callback` - Handle Google OAuth callback
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout

## Security Features

- Secure OTP generation and hashing
- Password hashing with Argon2/bcrypt
- JWT token authentication
- Rate limiting
- CORS protection
- Security headers (Helmet)
- Input validation
- SQL injection protection (Prisma)
- HTTP-only cookies
- Generic error messages

## Development Status

This project is complete for the MVP. The following phases have been completed:

- ✅ Phase 1: Project Setup
- ✅ Phase 2: Database Setup
- ✅ Phase 3: Backend APIs
- ✅ Phase 4: Email OTP System
- ⏳ Phase 5: Google OAuth (Optional - requires Google Cloud setup)
- ✅ Phase 6: React Frontend
- ✅ Phase 7: Security Hardening
- ✅ Phase 8: Testing & Documentation

## Current Features

### Implemented (MVP)
- ✅ Email + OTP authentication (signup and login)
- ✅ Secure password hashing with Argon2
- ✅ JWT-based authentication
- ✅ SQLite database with Prisma ORM
- ✅ Rate limiting and security headers
- ✅ Complete React frontend with validation
- ✅ Responsive design with Tailwind CSS
- ✅ OTP expiration and attempt limiting
- ✅ Resend cooldown functionality
- ✅ Protected routes and authentication context
- ✅ Comprehensive error handling
- ✅ Development email simulation

### Optional (Requires Additional Setup)
- ⏳ Google OAuth 2.0 integration
- ⏳ Production email service (SMTP)
- ⏳ PostgreSQL database (currently using SQLite)

## Quick Start

1. **Install dependencies:**
```bash
cd backend && npm install
cd ../frontend && npm install
```

2. **Configure environment:**
```bash
# Backend .env (provided with development defaults)
# Frontend .env (provided with development defaults)
```

3. **Run the application:**
```bash
# Terminal 1 - Backend
cd backend && npm run dev

# Terminal 2 - Frontend  
cd frontend && npm run dev
```

4. **Access the application:**
- Frontend: http://localhost:5173
- Backend API: http://localhost:5000/api/auth/health

## Testing

The system is ready for testing. Check the OTP in the backend console when using email authentication in development mode.

For detailed testing instructions, see [TESTING.md](TESTING.md).

## Documentation

- [SETUP.md](SETUP.md) - Detailed setup and configuration guide
- [TESTING.md](TESTING.md) - Comprehensive testing guide
- [README.md](README.md) - This file

## License

MIT License
