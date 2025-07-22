# Production OAuth Configuration Fix

## Issue
Google Sign-In redirects to localhost:3000 instead of production domain (https://www.projectcarlistings.com) after deployment.

## Root Cause
The OAuth redirect URIs are configured for development (localhost:3000) and need to be updated for production.

## 🚨 IMMEDIATE FIX REQUIRED

### 1. Update Google Cloud Console OAuth Configuration

**Go to Google Cloud Console:**
1. Visit: https://console.cloud.google.com/apis/credentials
2. Find your OAuth 2.0 Client ID for this project
3. Click to edit it

**Update Authorized JavaScript origins:**
```
https://www.projectcarlistings.com
https://projectcarlistings.com (without www)
```

**Update Authorized redirect URIs:**
```
https://www.projectcarlistings.com/auth/callback
https://projectcarlistings.com/auth/callback (without www)
```

**Keep localhost for development:**
```
http://localhost:3000/auth/callback
```

### 2. Update Supabase Dashboard Configuration

**Go to your Supabase Dashboard:**
1. Visit: https://supabase.com/dashboard/project/[your-project-id]
2. Go to **Authentication > Settings**
3. Update **Site URL** from `http://localhost:3000` to: `https://www.projectcarlistings.com`
4. Update **Redirect URLs** to include:
   ```
   https://www.projectcarlistings.com/dashboard
   https://www.projectcarlistings.com/profile
   https://www.projectcarlistings.com/**
   http://localhost:3000/** (keep for development)
   ```

### 3. Update Environment Variables on Vercel

**In your Vercel Dashboard:**
1. Go to your project settings
2. Go to **Environment Variables**
3. Add/Update these variables:

   ```
   NEXT_PUBLIC_SITE_URL=https://www.projectcarlistings.com
   NEXT_PUBLIC_SUPABASE_URL=your_actual_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_actual_supabase_anon_key
   NODE_ENV=production
   ```

### 4. Redeploy Your Application

After making the above changes:
1. **Trigger a new deployment** in Vercel (or push a commit to trigger auto-deployment)
2. Wait for the deployment to complete
3. Test the Google Sign-In on your production site

## 🔍 Verification Steps

After making these changes:

1. **Test Google Sign-In on Production:**
   - Go to https://www.projectcarlistings.com/login
   - Click "Continue with Google"
   - Should redirect to Google, then back to your production domain

2. **Check Developer Tools:**
   - Open browser dev tools → Network tab
   - Look for the OAuth redirect URL in the network requests
   - Should show `https://www.projectcarlistings.com/auth/callback`

3. **Test Both Domains:**
   - Test with `https://www.projectcarlistings.com`
   - Test with `https://projectcarlistings.com` (without www)
   - Both should work if you added both to Google OAuth config

## 🚨 Common Issues and Solutions

### Issue: "Redirect URI Mismatch" Error
**Solution:** Double-check that the redirect URIs in Google Cloud Console exactly match what Supabase is sending.

### Issue: Still redirecting to localhost
**Solutions:**
1. Clear your browser cache and cookies
2. Make sure environment variables are properly set in Vercel
3. Verify Supabase Site URL is updated
4. Redeploy the application

### Issue: OAuth works but user doesn't get logged in
**Solution:** Check that your `/auth/callback` route is properly handling the OAuth response.

## 📋 Quick Checklist

- [ ] Google Cloud Console: Updated Authorized JavaScript origins
- [ ] Google Cloud Console: Updated Authorized redirect URIs  
- [ ] Supabase Dashboard: Updated Site URL
- [ ] Supabase Dashboard: Updated Redirect URLs
- [ ] Vercel: Updated environment variables
- [ ] Redeployed application
- [ ] Tested Google Sign-In on production
- [ ] Verified redirect URLs in browser dev tools

## 🔗 Important Links

- **Google Cloud Console:** https://console.cloud.google.com/apis/credentials
- **Supabase Dashboard:** https://supabase.com/dashboard
- **Vercel Dashboard:** https://vercel.com/dashboard
- **Your Production Site:** https://www.projectcarlistings.com

## 📞 Need Help?

If you're still experiencing issues after following these steps:
1. Check browser developer tools for error messages
2. Check Vercel function logs for server-side errors
3. Verify all URLs are using HTTPS (not HTTP) for production

---

**⚠️ IMPORTANT:** Make sure to keep the localhost configurations for development. You should have both localhost and production URLs configured in both Google Cloud Console and Supabase.
NODE_ENV=production
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

#### **Google Cloud Console Setup**
1. Go to: https://console.cloud.google.com/apis/credentials
2. Edit your OAuth 2.0 Client ID
3. Under "Authorized JavaScript origins", add:
   - `https://www.projectcarlistings.com`
   - `http://localhost:3000` (for local development)
4. Under "Authorized redirect URIs", ensure you have:
   - `https://chekmxqlnosxphbmxiil.supabase.co/auth/v1/callback`

#### **Supabase Dashboard Verification**
1. Go to: https://supabase.com/dashboard/project/chekmxqlnosxphbmxiil/auth/providers
2. Verify Google provider is enabled
3. Ensure Client ID and Secret are correct
4. Confirm redirect URL is: `https://chekmxqlnosxphbmxiil.supabase.co/auth/v1/callback`

## 🔧 **Deployment Steps**

### 1. **Set Vercel Environment Variables**
```bash
# Via Vercel CLI (if you have it installed)
vercel env add NEXT_PUBLIC_SITE_URL
# Enter: https://www.projectcarlistings.com

vercel env add NODE_ENV
# Enter: production

vercel env add GOOGLE_CLIENT_ID
# Enter: your_actual_google_client_id

vercel env add GOOGLE_CLIENT_SECRET
# Enter: your_actual_google_client_secret
```

### 2. **Redeploy Application**
```bash
# Trigger a new deployment
vercel --prod
```

Or push changes to your main branch to trigger automatic deployment.

### 3. **Test the Fix**
1. Go to: https://www.projectcarlistings.com/login
2. Click "Continue with Google"  
3. Complete Google authentication
4. Verify you're redirected back to: https://www.projectcarlistings.com/dashboard

## 🐛 **Troubleshooting**

### If Still Redirecting to Localhost:

1. **Check Environment Variables**
   - Verify `NEXT_PUBLIC_SITE_URL` is set in Vercel
   - Ensure no trailing slash in the URL

2. **Clear Browser Cache**
   - Hard refresh (Ctrl+Shift+R / Cmd+Shift+R)
   - Try incognito/private mode

3. **Verify Google Console Settings**
   - Authorized origins must include your production domain
   - No typos in domain name

4. **Check Browser Developer Tools**
   - Look for JavaScript errors in console
   - Check Network tab for failed requests

### Common Issues:

- **CORS Errors**: Add production domain to Google Console authorized origins
- **Invalid Redirect URI**: Supabase callback URL must be exactly `https://chekmxqlnosxphbmxiil.supabase.co/auth/v1/callback`
- **Environment Variables Not Loading**: Redeploy after setting env vars in Vercel

## 📋 **Verification Checklist**

- [ ] `NEXT_PUBLIC_SITE_URL` set to `https://www.projectcarlistings.com` in Vercel
- [ ] Google Cloud Console has production domain in authorized origins
- [ ] Supabase Google provider is enabled with correct credentials
- [ ] Application has been redeployed after environment variable changes
- [ ] Tested in incognito mode to avoid cache issues

## 🎯 **Expected Result**

After applying these changes:
1. Development (`localhost:3000`) → Redirects to `localhost:3000`  
2. Production (`https://www.projectcarlistings.com`) → Redirects to `https://www.projectcarlistings.com`

The OAuth flow will respect the environment and redirect users to the correct domain.
