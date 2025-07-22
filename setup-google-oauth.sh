#!/bin/bash

# Google OAuth Setup Script for Supabase
# This script helps configure Google Sign-In authentication

echo "🔧 Google OAuth Setup for Project Car Marketplace"
echo "=================================================="
echo

# Project information
PROJECT_REF="chekmxqlnosxphbmxiil"
SUPABASE_URL="https://chekmxqlnosxphbmxiil.supabase.co"
REDIRECT_URL="https://chekmxqlnosxphbmxiil.supabase.co/auth/v1/callback"
PRODUCTION_URL="https://www.projectcarlistings.com"
LOCAL_URL="http://localhost:3000"

echo "📋 Project Information:"
echo "  Supabase Project: $PROJECT_REF"
echo "  Supabase URL: $SUPABASE_URL"
echo "  OAuth Redirect URL: $REDIRECT_URL"
echo "  Production Site: $PRODUCTION_URL"
echo "  Development Site: $LOCAL_URL"
echo

echo "🚀 Step 1: Google Cloud Console Setup"
echo "======================================"
echo "1. Go to: https://console.cloud.google.com/"
echo "2. Create a new project or select an existing one"
echo "3. Enable the Google+ API or People API:"
echo "   - Go to 'APIs & Services' > 'Library'"
echo "   - Search for 'Google+ API' or 'People API'"
echo "   - Click 'Enable'"
echo "4. Create OAuth 2.0 Credentials:"
echo "   - Go to 'APIs & Services' > 'Credentials'"
echo "   - Click 'Create Credentials' > 'OAuth 2.0 Client ID'"
echo "   - Choose 'Web application'"
echo "   - Name: 'Project Car Marketplace'"
echo "   - Authorized JavaScript origins:"
echo "     * $LOCAL_URL (for development)"
echo "     * $PRODUCTION_URL (for production)"
echo "   - Authorized redirect URIs:"
echo "     * $REDIRECT_URL (for Supabase Auth)"
echo "5. Copy the Client ID and Client Secret"
echo

echo "🔑 Step 2: Supabase Dashboard Configuration"
echo "==========================================="
echo "1. Go to: https://supabase.com/dashboard/project/$PROJECT_REF/auth/providers"
echo "2. Find the Google provider"
echo "3. Toggle it to 'Enabled'"
echo "4. Enter your Google Client ID and Client Secret"
echo "5. Verify the redirect URL is: $REDIRECT_URL"
echo "6. Click 'Save'"
echo

echo "🌐 Step 3: Environment Variables"
echo "================================"
echo "For Development (.env.local):"
echo
echo "# Google OAuth Configuration"
echo "GOOGLE_CLIENT_ID=your_google_client_id_here"
echo "GOOGLE_CLIENT_SECRET=your_google_client_secret_here"
echo "NEXT_PUBLIC_SITE_URL=$LOCAL_URL"
echo "NODE_ENV=development"
echo
echo "For Production (Vercel Environment Variables):"
echo
echo "# Google OAuth Configuration"
echo "GOOGLE_CLIENT_ID=your_google_client_id_here"
echo "GOOGLE_CLIENT_SECRET=your_google_client_secret_here"
echo "NEXT_PUBLIC_SITE_URL=$PRODUCTION_URL"
echo "NODE_ENV=production"
echo

echo "🚀 Step 4: Vercel Deployment Configuration"
echo "===========================================" 
echo "1. Go to your Vercel dashboard: https://vercel.com/dashboard"
echo "2. Select your project: project-car-marketplace"
echo "3. Go to Settings > Environment Variables"
echo "4. Add the production environment variables listed above"
echo "5. Redeploy your application"
echo

echo "🧪 Step 5: Testing"
echo "=================="
echo "After configuration:"
echo "1. Development: npm run dev → Test at $LOCAL_URL/login"
echo "2. Production: Test at $PRODUCTION_URL/login" 
echo "3. Click 'Continue with Google'"
echo "4. Complete the OAuth flow"
echo "5. Verify you're redirected back to the correct domain"
echo

echo "❗ Current Issue Resolution:"
echo "============================"
echo "Issue: Redirecting to localhost instead of production domain"
echo "Solution: Updated code to use dynamic redirect URLs based on environment"
echo "Key fixes:"
echo "- Added site-config.ts utility for environment-aware URLs"
echo "- Updated GoogleSignInButton to use getOAuthCallbackUrl()"
echo "- Configured proper environment variables for production"
echo

echo "🔍 Troubleshooting:"
echo "==================="
echo "If redirects are still going to localhost:"
echo "1. Verify NEXT_PUBLIC_SITE_URL is set correctly in Vercel"
echo "2. Check Google Console authorized origins include $PRODUCTION_URL"
echo "3. Ensure Supabase redirect URL is exactly: $REDIRECT_URL"
echo "4. Clear browser cache and try incognito mode"
echo "5. Check browser developer tools for JavaScript errors"
echo
echo "For support, check: GOOGLE_AUTH_IMPLEMENTATION.md"
