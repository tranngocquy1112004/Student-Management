import mongoose from 'mongoose';
import Schedule from './src/models/Schedule.js';

async function checkScheduleDetail() {
  try {
    await mongoose.connect('mongodb://localhost:27017/classroom_management');
    
    // Get all schedules
    const schedules = await Schedule.find({ isDeleted: false }).populate('classId');
    
    console.log('=== ALL SCHEDULES ===');
    schedules.forEach(schedule => {
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      console.log(`- ${schedule.classId.name}: Day=${schedule.dayOfWeek} (${dayNames[schedule.dayOfWeek]}), ${schedule.startTime} - ${schedule.endTime}`);
    });
    
    // Check today's schedules specifically
    const today = new Date().getDay();
    const todaySchedules = schedules.filter(s => s.dayOfWeek === today);
    
    console.log(`\n=== TODAY'S SCHEDULES (Day ${today}) ===`);
    if (todaySchedules.length === 0) {
      console.log('No schedules found for today');
    } else {
      todaySchedules.forEach(schedule => {
        console.log(`- ${schedule.classId.name}: ${schedule.startTime} - ${schedule.endTime}`);
      });
    }
    
    await mongoose.connection.close();
  } catch (error) {
    console.error('Database error:', error);
  }
}

checkScheduleDetail();
