# Google Login Setup Guide

This guide will help you set up Google OAuth authentication for your Minispod application.

## What's Already Done ✅

1. **NextAuth Configuration Updated** - Added Google provider to `/app/api/auth/[...nextauth]/route.js`
2. **Login Page Updated** - Added Google login button to `/app/login/page.jsx`
3. **Environment Variables Added** - Added Google OAuth variables to `.env.local`

## Steps to Complete Setup

### 1. Create Google OAuth Application

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API:
   - Go to "APIs & Services" > "Library"
   - Search for "Google+ API" and enable it
4. Create OAuth 2.0 credentials:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth 2.0 Client IDs"
   - Choose "Web application"
   - Add authorized redirect URIs:
     - `http://localhost:3100/api/auth/callback/google` (for development)
     - `https://yourdomain.com/api/auth/callback/google` (for production)

### 2. Update Environment Variables

Replace the placeholder values in your `.env.local` file:

```env
GOOGLE_CLIENT_ID=your-actual-google-client-id-here
GOOGLE_CLIENT_SECRET=your-actual-google-client-secret-here
```

### 3. Backend API Endpoint (Required)

You need to create a backend endpoint to handle Google login. The NextAuth configuration expects a `/api/auth/google-login` endpoint that:

**Request Body:**

```json
{
  "email": "user@example.com",
  "name": "User Name",
  "avatar": "https://avatar-url.com/image.jpg",
  "googleId": "google-user-id"
}
```

**Expected Response:**

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user-id",
      "email": "user@example.com",
      "name": "User Name",
      "role": "USER",
      "phone": null,
      "avatar": "https://avatar-url.com/image.jpg"
    },
    "accessToken": "jwt-access-token",
    "refreshToken": "jwt-refresh-token"
  }
}
```

### 4. Test the Integration

1. Restart your development server: `npm run dev`
2. Go to `http://localhost:3100/login`
3. Click "Continue with Google"
4. Complete the OAuth flow

## Features Added

### Login Page Enhancements

- **Google Login Button** - Styled with Google's official colors and logo
- **Improved Layout** - Better separation between credential login and OAuth
- **Error Handling** - Proper error messages for Google login failures

### Security Features

- **Secure Token Handling** - Access and refresh tokens are properly managed
- **User Role Management** - Google users get appropriate roles from your backend
- **Avatar Integration** - Google profile pictures are automatically used

## Troubleshooting

### Common Issues

1. **"Invalid Client" Error**

   - Check that your `GOOGLE_CLIENT_ID` is correct
   - Verify the redirect URI in Google Console matches exactly

2. **"Redirect URI Mismatch"**

   - Ensure you've added the correct callback URL in Google Console
   - Format: `http://localhost:3100/api/auth/callback/google`

3. **Backend Integration Issues**
   - Make sure your backend `/api/auth/google/login` endpoint is working
   - Check that it properly verifies the Google ID token
   - Ensure it returns the expected response format with wallet data

### Development vs Production

**Development:**

- Redirect URI: `http://localhost:3100/api/auth/callback/google`
- NEXTAUTH_URL: `http://localhost:3100`

**Production:**

- Redirect URI: `https://yourdomain.com/api/auth/callback/google`
- NEXTAUTH_URL: `https://yourdomain.com`

## Next Steps

1. Set up your Google OAuth application
2. Update the environment variables with real credentials
3. Implement the backend Google login endpoint
4. Test the complete flow
5. Deploy and update production settings

## Support

If you encounter any issues, check:

- Google Cloud Console for OAuth setup
- Browser developer tools for network errors
- Server logs for backend integration issues
