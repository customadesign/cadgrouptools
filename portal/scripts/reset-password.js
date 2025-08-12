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

async function resetPassword() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const email = 'hpmurphy@icloud.com';
    const newPassword = 'B5tccpbx';

    console.log(`\nResetting password for: ${email}`);
    
    // Find user
    const user = await User.findOne({ email: email.toLowerCase() });
    
    if (!user) {
      console.log('❌ User not found');
      return;
    }

    console.log('✅ User found:', user.name);
    
    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    
    // Update password
    user.password = hashedPassword;
    await user.save();
    
    console.log('✅ Password updated successfully!');
    console.log('\nYou can now login with:');
    console.log('Email:', email);
    console.log('Password:', newPassword);
    
    // Verify the password works
    const isValid = await bcrypt.compare(newPassword, user.password);
    console.log('\nPassword verification test:', isValid ? '✅ PASSED' : '❌ FAILED');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

resetPassword();