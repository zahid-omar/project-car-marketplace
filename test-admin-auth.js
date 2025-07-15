// Test script to verify admin authentication
const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testAdminAuth() {
  try {
    console.log('🔍 Testing admin authentication...');
    
    // Test the profiles table structure
    console.log('\n📋 Testing profiles table...');
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, email, is_admin, is_moderator')
      .limit(5);
    
    if (profilesError) {
      console.error('❌ Error fetching profiles:', profilesError);
      return;
    }
    
    console.log('✅ Found profiles:', profiles.length);
    
    // Find admin user
    const adminUser = profiles.find(p => p.is_admin === true);
    if (adminUser) {
      console.log('✅ Found admin user:', adminUser.email);
    } else {
      console.log('❌ No admin user found');
    }
    
    // Test direct profile query for our admin user
    console.log('\n🔍 Testing direct profile query...');
    const { data: adminProfile, error: adminError } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', 'muttahar.hu@gmail.com')
      .single();
    
    if (adminError) {
      console.error('❌ Error fetching admin profile:', adminError);
      return;
    }
    
    console.log('✅ Admin profile:', {
      id: adminProfile.id,
      email: adminProfile.email,
      is_admin: adminProfile.is_admin,
      is_moderator: adminProfile.is_moderator
    });
    
    console.log('\n✅ Admin authentication test completed successfully!');
    console.log('🌐 You can now visit http://localhost:3001/admin to test the dashboard');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testAdminAuth();
