# Admin Role Assignment Guide

## 🚀 Quick Start - Assigning Your First Admin

### Step 1: Database Method (Initial Setup)

Since you need at least one admin to access the admin dashboard, use the database method first:

1. **Go to your Supabase Dashboard** → SQL Editor
2. **Run this query** (replace `your-email@example.com` with the actual email):

```sql
-- Grant admin role to a user
UPDATE profiles 
SET 
  is_admin = true,
  updated_at = now()
WHERE email = 'your-email@example.com';

-- Verify the change
SELECT 
  email,
  display_name,
  is_admin,
  is_moderator
FROM profiles 
WHERE email = 'your-email@example.com';
```

### Step 2: Access Admin Dashboard

1. **Visit your application** at your domain
2. **Sign in** with the email you just made admin
3. **Navigate to** `/admin` - you should now see the admin dashboard
4. **Verify access** by checking that you can see all admin menu items

## 🎛️ Managing Roles Through Admin Dashboard

### Method A: User Management Page

1. **Go to** `/admin/users`
2. **Search for the user** by name or email
3. **Click on the user** to view their profile
4. **Use the role management buttons**:
   - "Make Admin" - Grants full admin access
   - "Make Moderator" - Grants moderator access
   - "Remove Role" - Reverts to regular user

### Method B: User Profile Actions

1. **Find the user** in the user list
2. **Click the action menu** (⋮) next to their name
3. **Select role action**:
   - "Promote to Admin"
   - "Promote to Moderator" 
   - "Demote to User"

## 🛡️ Role Permissions Overview

### Admin Role (`is_admin = true`)
**Full system access including:**
- ✅ User management (create, edit, delete, role changes)
- ✅ Listing management (approve, reject, moderate)
- ✅ Reports management (handle user reports)
- ✅ Analytics dashboard (view all metrics)
- ✅ Support ticket management
- ✅ Live chat management
- ✅ FAQ management
- ✅ System settings (maintenance mode, site config)
- ✅ Security audit (view security events)

### Moderator Role (`is_moderator = true`)
**Content moderation access including:**
- ✅ Reports management (handle user reports)
- ✅ Content moderation (approve/reject listings)
- ✅ Support ticket management
- ✅ FAQ management
- ✅ Live chat management
- ✅ Analytics dashboard (limited view)
- ❌ User role management
- ❌ System settings
- ❌ Security audit

### Regular User
**Standard user access:**
- ✅ Create listings
- ✅ Message other users
- ✅ Make offers
- ✅ View public content
- ❌ Admin dashboard access

## 📝 Step-by-Step Examples

### Example 1: Make someone an admin

**Via Database (Supabase SQL Editor):**
```sql
UPDATE profiles 
SET is_admin = true, updated_at = now() 
WHERE email = 'newadmin@example.com';
```

**Via Admin Dashboard:**
1. Go to `/admin/users`
2. Search for "newadmin@example.com"
3. Click "Make Admin" button
4. Confirm the action

### Example 2: Make someone a moderator

**Via Database:**
```sql
UPDATE profiles 
SET is_moderator = true, updated_at = now() 
WHERE email = 'moderator@example.com';
```

**Via Admin Dashboard:**
1. Go to `/admin/users`
2. Find the user
3. Click "Make Moderator"

### Example 3: Remove admin access

**Via Database:**
```sql
UPDATE profiles 
SET is_admin = false, updated_at = now() 
WHERE email = 'formeradmin@example.com';
```

**Via Admin Dashboard:**
1. Go to `/admin/users`
2. Find the admin user
3. Click "Remove Role" or "Demote to User"

## 🔍 Troubleshooting

### "Access Denied" when visiting /admin

**Possible causes:**
1. **User is not admin/moderator** - Check database: `SELECT is_admin, is_moderator FROM profiles WHERE email = 'your@email.com'`
2. **Not signed in** - Make sure you're logged in with the admin account
3. **Database not updated** - Check if the role update was successful

### Can't see all admin menu items

**Possible causes:**
1. **User is moderator, not admin** - Moderators have limited access
2. **Permission system working correctly** - Some features are admin-only

### Admin dashboard not loading

**Check:**
1. **Build successful** - Make sure `npm run build` completes without errors
2. **Environment variables** - Verify Supabase connection
3. **Database migrations** - Ensure all admin tables exist

## 🔐 Security Best Practices

### Admin Account Security

1. **Use strong passwords** for admin accounts
2. **Enable 2FA** if available in your auth system
3. **Limit admin accounts** - Only give admin access to trusted users
4. **Regular audits** - Review admin accounts periodically
5. **Monitor admin activity** - Check admin activity logs regularly

### Role Management Best Practices

1. **Principle of least privilege** - Give users minimum required access
2. **Regular reviews** - Audit user roles quarterly
3. **Document changes** - Keep track of who changed what roles
4. **Use moderators** - For content moderation, use moderator role instead of admin
5. **Emergency access** - Keep one admin account for emergencies

## 📊 Checking Current Roles

### View all admins and moderators:

```sql
SELECT 
  email,
  display_name,
  CASE 
    WHEN is_admin = true THEN 'Admin'
    WHEN is_moderator = true THEN 'Moderator'
    ELSE 'User'
  END as role,
  created_at
FROM profiles 
WHERE is_admin = true OR is_moderator = true
ORDER BY is_admin DESC, is_moderator DESC;
```

### View recent role changes:

```sql
SELECT 
  al.action,
  al.details,
  al.created_at,
  p.email as admin_who_made_change
FROM admin_activity_log al
LEFT JOIN profiles p ON al.user_id = p.id
WHERE al.action = 'user_role_changed'
ORDER BY al.created_at DESC
LIMIT 10;
```

## 🆘 Emergency Access

If you lose admin access:

1. **Database access** - Use Supabase dashboard SQL editor to restore admin role
2. **Service role key** - Use service role key to make direct database changes
3. **Support account** - Keep one admin account credentials secure for emergencies

## Current Status ✅

**You now have admin access with the account: `muttahar.hu@gmail.com`**

You can:
1. Sign in with this account
2. Visit `/admin` to access the admin dashboard
3. Manage other users' roles through the interface
4. Access all admin features

Next steps:
1. Sign in and test the admin dashboard
2. Create additional admin/moderator accounts as needed
3. Explore the various admin features
4. Set up your site configuration in `/admin/settings`
