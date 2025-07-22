#!/bin/bash

# Production OAuth Debug Script
# Run this script to debug OAuth configuration issues

echo "🔍 OAUTH CONFIGURATION DEBUGGING"
echo "================================"

echo ""
echo "📍 Current Environment Variables:"
echo "NEXT_PUBLIC_SITE_URL: ${NEXT_PUBLIC_SITE_URL:-'NOT SET'}"
echo "NEXT_PUBLIC_SUPABASE_URL: ${NEXT_PUBLIC_SUPABASE_URL:-'NOT SET'}"
echo "NODE_ENV: ${NODE_ENV:-'NOT SET'}"

echo ""
echo "🌐 URLs that should be configured:"
echo "Production Site: https://www.projectcarlistings.com"
echo "Supabase Auth Callback: https://www.projectcarlistings.com/auth/callback"

echo ""
echo "🔧 REQUIRED FIXES:"
echo ""

echo "1. Google Cloud Console (https://console.cloud.google.com/apis/credentials):"
echo "   ✅ Authorized JavaScript origins:"
echo "      - https://www.projectcarlistings.com"
echo "      - https://projectcarlistings.com"
echo "      - http://localhost:3000 (for dev)"
echo ""
echo "   ✅ Authorized redirect URIs:"
echo "      - https://www.projectcarlistings.com/auth/callback"
echo "      - https://projectcarlistings.com/auth/callback"
echo "      - http://localhost:3000/auth/callback (for dev)"

echo ""
echo "2. Supabase Dashboard:"
echo "   ✅ Site URL: https://www.projectcarlistings.com"
echo "   ✅ Redirect URLs:"
echo "      - https://www.projectcarlistings.com/**"
echo "      - http://localhost:3000/** (for dev)"

echo ""
echo "3. Vercel Environment Variables:"
echo "   ✅ NEXT_PUBLIC_SITE_URL=https://www.projectcarlistings.com"
echo "   ✅ NODE_ENV=production"
echo "   ✅ NEXT_PUBLIC_SUPABASE_URL=your_supabase_url"
echo "   ✅ NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key"

echo ""
echo "📝 After making these changes:"
echo "   1. Redeploy your Vercel application"
echo "   2. Clear browser cache and cookies"
echo "   3. Test Google Sign-In on production"

echo ""
echo "🚨 If still having issues:"
echo "   - Check browser dev tools for error messages"
echo "   - Check Vercel function logs"
echo "   - Verify all URLs use HTTPS for production"

echo ""
echo "✅ Done! Follow the steps above to fix the OAuth redirect issue."
