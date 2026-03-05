import mongoose from 'mongoose';
import Schedule from './src/models/Schedule.js';
import Class from './src/models/Class.js';
import Enrollment from './src/models/Enrollment.js';
import AttendanceSession from './src/models/AttendanceSession.js';
import scheduleValidator from './src/services/scheduleValidator.js';

async function checkAttendance() {
  try {
    await mongoose.connect('mongodb://localhost:27017/classroom_management');
    console.log('Connected to database');
    
    // Get current time info
    const now = new Date();
    const currentDay = now.getDay(); // 0=Sunday, 1=Monday, ...
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    
    console.log('\n=== CURRENT TIME INFO ===');
    console.log('Current Date:', now.toLocaleDateString('vi-VN'));
    console.log('Current Day:', currentDay, '(0=Sunday, 1=Monday, ...)');
    console.log('Current Time:', currentTime);
    
    // Find all classes
    const classes = await Class.find({ isDeleted: false });
    console.log('\n=== ALL CLASSES ===');
    classes.forEach(cls => {
      console.log(`- ${cls.name} (ID: ${cls._id})`);
    });
    
    // Check schedules for today
    const schedules = await Schedule.find({ 
      dayOfWeek: currentDay, 
      isDeleted: false 
    }).populate('classId');
    
    console.log('\n=== SCHEDULES FOR TODAY ===');
    if (schedules.length === 0) {
      console.log('No schedules found for today');
    } else {
      schedules.forEach(schedule => {
        console.log(`- ${schedule.classId.name}: ${schedule.startTime} - ${schedule.endTime}`);
      });
    }
    
    // Check attendance sessions
    const sessions = await AttendanceSession.find({ 
      date: now.toISOString().split('T')[0], // Today's date
      isDeleted: false 
    }).populate('classId');
    
    console.log('\n=== ATTENDANCE SESSIONS FOR TODAY ===');
    if (sessions.length === 0) {
      console.log('No attendance sessions found for today');
    } else {
      sessions.forEach(session => {
        console.log(`- ${session.classId.name}: Code=${session.code || 'None'}, Expires=${session.codeExpiredAt || 'None'}`);
      });
    }
    
    // Test schedule validator for each class
    console.log('\n=== SCHEDULE VALIDATION ===');
    for (const cls of classes) {
      const validation = await scheduleValidator.validateScheduleAndTime(cls._id);
      console.log(`\nClass: ${cls.name}`);
      console.log(`- Valid: ${validation.valid}`);
      console.log(`- Message: ${validation.message}`);
      console.log(`- Code: ${validation.code}`);
      if (validation.schedule) {
        console.log(`- Schedule: ${validation.schedule.startTime} - ${validation.schedule.endTime}`);
      }
    }
    
    await mongoose.connection.close();
  } catch (error) {
    console.error('Database error:', error);
  }
}

checkAttendance();
