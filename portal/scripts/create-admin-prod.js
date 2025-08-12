const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// IMPORTANT: Replace this with your production MongoDB URI from Render environment variables
const PROD_MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://marketing:TaNN6bttM920rEjL@cadtools.dvvdsg1.mongodb.net/?retryWrites=true&w=majority&appName=cadtools';

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, index: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['admin', 'staff'], default: 'staff', index: true },
    isActive: { type: Boolean, default: true },
    lastLogin: { type: Date },
  },
  { timestamps: true }
);

const User = mongoose.models.User || mongoose.model('User', UserSchema);

async function createAdminUser() {
  try {
    console.log('Connecting to Production MongoDB...');
    console.log('URI:', PROD_MONGODB_URI.replace(/:[^:@]+@/, ':****@')); // Hide password in logs
    
    await mongoose.connect(PROD_MONGODB_URI);
    console.log('✅ Connected to Production MongoDB');

    const adminEmail = 'hpmurphy@icloud.com';
    const adminPassword = 'B5tccpbx';
    const adminName = 'Pat Murphy';

    // Check if user already exists
    const existingUser = await User.findOne({ email: adminEmail.toLowerCase() });
    
    if (existingUser) {
      console.log('⚠️  User already exists, updating password...');
      
      // Update password
      const hashedPassword = await bcrypt.hash(adminPassword, 12);
      existingUser.password = hashedPassword;
      existingUser.role = 'admin';
      existingUser.isActive = true;
      existingUser.name = adminName;
      await existingUser.save();
      
      console.log('✅ Password updated successfully!');
    } else {
      console.log('Creating new admin user...');
      
      // Hash password
      const hashedPassword = await bcrypt.hash(adminPassword, 12);
      
      // Create new admin user
      const adminUser = await User.create({
        name: adminName,
        email: adminEmail.toLowerCase(),
        password: hashedPassword,
        role: 'admin',
        isActive: true,
      });
      
      console.log('✅ Admin user created successfully!');
    }

    console.log('\n🎉 You can now login to production with:');
    console.log('   URL: https://cadgrouptools.onrender.com/auth/signin');
    console.log('   Email:', adminEmail);
    console.log('   Password:', adminPassword);
    console.log('   Role: admin');
    
    // Verify the password works
    const user = await User.findOne({ email: adminEmail.toLowerCase() });
    if (user) {
      const isValid = await bcrypt.compare(adminPassword, user.password);
      console.log('\n✅ Password verification test:', isValid ? 'PASSED' : 'FAILED');
    }

    // Show all users in production database
    console.log('\n📊 All users in production database:');
    const allUsers = await User.find({}, 'name email role isActive createdAt');
    allUsers.forEach(u => {
      console.log(`   - ${u.email} (${u.name}) - ${u.role} - ${u.isActive ? 'Active' : 'Inactive'}`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.code === 11000) {
      console.error('Duplicate key error - user may already exist');
    }
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

console.log('🚀 CADGroup Tools - Production Admin User Setup');
console.log('================================================\n');
createAdminUser();