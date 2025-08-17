require('dotenv').config();

async function testDeleteAPI() {
  console.log('🔍 Testing Delete API Endpoint...\\n');
  
  // Check environment variables
  console.log('📋 Environment Check:');
  console.log('MONGODB_URI:', process.env.MONGODB_URI ? '✅ Set' : '❌ Missing');
  console.log('SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL || 'Not set');
  console.log('SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'Not set');
  console.log('');
  
  // Test Supabase client creation
  console.log('🔌 Testing Supabase Client...');
  try {
    const { supabaseAdmin, SUPABASE_STATUS } = require('./src/lib/supabaseAdmin.ts');
    
    if (supabaseAdmin) {
      console.log('✅ Supabase Admin client created successfully');
    } else {
      console.log('❌ Supabase Admin client not created');
      console.log('  Status:', SUPABASE_STATUS);
    }
  } catch (error) {
    console.log('❌ Error creating Supabase client:', error.message);
  }
  
  // Test database connection
  console.log('\\n🔌 Testing Database Connection...');
  try {
    const { connectToDatabase } = require('./src/lib/db.ts');
    await connectToDatabase();
    console.log('✅ Database connection successful');
  } catch (error) {
    console.log('❌ Database connection failed:', error.message);
  }
  
  console.log('\\n📝 Summary:');
  console.log('- Supabase is required for file storage operations');
  console.log('- MongoDB connection is required for statement/transaction deletion');
  console.log('\\n🚀 To test the delete function:');
  console.log('1. Upload a new statement');
  console.log('2. Try to delete it from the upload page');
  console.log('3. Check the browser console and network tab for errors');
}

// Run the test
testDeleteAPI().catch(console.error);
