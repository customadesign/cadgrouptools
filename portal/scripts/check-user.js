const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: '.env.local' });

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

async function checkUser() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find all users
    const users = await User.find({});
    console.log(`\nTotal users in database: ${users.length}`);
    
    users.forEach(user => {
      console.log(`\nUser: ${user.email}`);
      console.log(`  Name: ${user.name}`);
      console.log(`  Role: ${user.role}`);
      console.log(`  Active: ${user.isActive}`);
      console.log(`  Created: ${user.createdAt}`);
    });

    // Check specific user
    const targetEmail = 'hpmurphy@icloud.com';
    console.log(`\n\nSearching for user: ${targetEmail}`);
    const specificUser = await User.findOne({ email: targetEmail.toLowerCase() });
    
    if (specificUser) {
      console.log('✅ User found!');
      console.log('User details:', {
        id: specificUser._id.toString(),
        name: specificUser.name,
        email: specificUser.email,
        role: specificUser.role,
        hasPassword: !!specificUser.password,
        passwordLength: specificUser.password?.length
      });
      
      // Test password
      const testPassword = 'test123'; // Replace with actual password if you know it
      if (specificUser.password) {
        const isValid = await bcrypt.compare(testPassword, specificUser.password);
        console.log(`Password 'test123' valid: ${isValid}`);
      }
    } else {
      console.log('❌ User not found');
      console.log('Searching with case-insensitive...');
      const caseInsensitive = await User.findOne({ 
        email: { $regex: new RegExp(targetEmail, 'i') } 
      });
      if (caseInsensitive) {
        console.log('Found with different case:', caseInsensitive.email);
      }
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

checkUser();