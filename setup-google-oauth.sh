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

echo "📋 Project Information:"
echo "  Supabase Project: $PROJECT_REF"
echo "  Supabase URL: $SUPABASE_URL"
echo "  OAuth Redirect URL: $REDIRECT_URL"
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
echo "   - Authorized redirect URIs: $REDIRECT_URL"
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
echo "Add these to your .env.local file:"
echo
echo "# Google OAuth Configuration"
echo "GOOGLE_CLIENT_ID=your_google_client_id_here"
echo "GOOGLE_CLIENT_SECRET=your_google_client_secret_here"
echo

echo "🧪 Step 4: Testing"
echo "=================="
echo "After configuration:"
echo "1. Restart your development server: npm run dev"
echo "2. Go to http://localhost:3000/login"
echo "3. Click 'Continue with Google'"
echo "4. Complete the OAuth flow"
echo

echo "❗ Current Issue:"
echo "================"
echo "Error: 'Unsupported provider: provider is not enabled'"
echo "This means the Google provider is not enabled in your Supabase project."
echo "Complete Steps 1 and 2 above to resolve this issue."
echo

echo "🔍 Troubleshooting:"
echo "==================="
echo "If you continue to have issues:"
echo "1. Check that the redirect URI exactly matches: $REDIRECT_URL"
echo "2. Ensure Google APIs are enabled in Google Cloud Console"
echo "3. Verify Client ID and Secret are correctly entered in Supabase"
echo "4. Check browser console for additional error details"
echo
echo "For support, check the implementation documentation: GOOGLE_AUTH_IMPLEMENTATION.md"
