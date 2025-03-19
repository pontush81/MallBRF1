Adding something...
Here's documentation for your solution:

# MallBRF Website Documentation

## System Architecture

This application uses a modern stack:
- **Frontend**: React with Material-UI
- **Backend**: Node.js/Express.js 
- **Database**: PostgreSQL (via Supabase)
- **Storage**: Supabase Storage for file uploads
- **Hosting**: Vercel for both frontend and backend

## Setup Instructions

### Prerequisites
- Node.js 14+
- Supabase account
- Vercel account (for deployment)

### Local Development
1. Clone repository: `git clone https://github.com/pontush81/MallBRF1.git`
2. Install dependencies: `cd react-webapp-boilerplate && npm install`
3. Create `.env` file in server directory with:
   ```
   PORT=3001
   POSTGRES_URL_NON_POOLING=your_supabase_connection_string
   SUPABASE_URL=your_supabase_url
   SUPABASE_KEY=your_supabase_anon_key
   ```
4. Start development server: `npm run dev`

### Deployment
1. Create Supabase Storage bucket named "page-files" with public access
2. Add environment variables to Vercel:
   - `POSTGRES_URL_NON_POOLING`: Your Supabase PostgreSQL connection string
   - `SUPABASE_URL`: Your Supabase project URL
   - `SUPABASE_KEY`: Your Supabase anon key

## Key Features

- **Content Management System**: Create, edit and publish pages
- **Booking System**: Allow users to book dates with availability checking
- **File Management**: Upload, store and manage images and documents
- **User Management**: Admin and user roles

## Implementation Details

### Backend Architecture
- RESTful API built with Express.js
- PostgreSQL database accessed via node-postgres
- Supabase Storage integration for file uploads
- Multer middleware for file handling
- Environment-specific configurations (dev/prod)

### Error Handling & Resilience
- SSL certificate validation bypass for Vercel
- Fallback strategies for missing Supabase credentials
- Read-only filesystem handling in serverless environment

### Storage Solution
- Development: Local filesystem storage
- Production: Supabase Storage with fallback mechanisms
- Automatic URL generation for uploaded files

## Troubleshooting

### SSL Certificate Issues
If you see `self-signed certificate in certificate chain` errors:
- SSL validation is disabled in production environments
- Check that `NODE_TLS_REJECT_UNAUTHORIZED='0'` is set

### File Upload Issues
If files don't upload in production:
- Verify Supabase credentials are set in Vercel
- Check Supabase bucket permissions (should be public)
- Review server logs for specific error messages

### Database Connection Problems
- Verify PostgreSQL connection string is correct
- Ensure SSL settings match your environment needs
- Check for case-sensitivity issues in column names

## Maintenance Notes

- SSL certificate validation is disabled for PostgreSQL in production (security trade-off for Vercel compatibility)
- Passwords are stored in plaintext (implement proper hashing in production)
- File storage fallbacks are temporary (implement more robust solutions for production)
