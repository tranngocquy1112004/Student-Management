import mongoose from 'mongoose';
import User from './src/models/User.js';

async function checkDatabase() {
  try {
    console.log('Connecting to database...');
    await mongoose.connect('mongodb://localhost:27017/classroom_management');
    console.log('Connected to database');
    
    // Check admin user
    const adminUser = await User.findOne({email: 'admin@school.vn'});
    if (adminUser) {
      console.log('Admin user found:', {
        email: adminUser.email,
        role: adminUser.role,
        isLocked: adminUser.isLocked,
        status: adminUser.status
      });
      
      // Check password
      const isValid = await adminUser.comparePassword('123456');
      console.log('Password 123456 valid:', isValid);
    } else {
      console.log('Admin user not found');
    }
    
    // Check all users
    const users = await User.find({});
    console.log('Total users in database:', users.length);
    users.forEach(user => {
      console.log(`- ${user.email} (${user.role}) - Locked: ${user.isLocked}`);
    });
    
    await mongoose.connection.close();
  } catch (error) {
    console.error('Database error:', error);
  }
}

checkDatabase();
